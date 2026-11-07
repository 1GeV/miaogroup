import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const say = (message) => console.log(message);

export function validateConfig(config) {
  if (!['local', 'github'].includes(config.mode)) throw new Error('The publishing.json mode must be local or github.');
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository)) throw new Error('repository must use the GitHub owner/repository format.');
  for (const key of ['sourceBranch', 'publishBranch']) {
    if (!/^[\w./-]+$/.test(config[key] ?? '') || config[key].includes('..') || config[key].endsWith('/')) {
      throw new Error(`${key} is not a valid branch name.`);
    }
  }
  if (config.sourceBranch === config.publishBranch) throw new Error('The source and publication branches must be different.');
  if (!/^https:\/\/[^/]+\/?$/.test(config.site)) throw new Error('site must be an HTTPS website origin.');
  if (!/^\/(?:[^?#\\]*\/)?$/.test(config.base)) throw new Error('base must start and end with /.');
  return config;
}

function git(args, { input, allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd: root, encoding: 'utf8', input, timeout: 60000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' },
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    if (allowFailure) return null;
    // Credential helper output must never appear in diagnostics.
    if (args[0] === 'credential') throw new Error('Existing GitHub credentials are unavailable. Sign in through Git Credential Manager before publishing.');
    throw new Error(`Git operation failed: git ${args.join(' ')}\n${result.stderr?.trim() || result.error?.message || ''}`);
  }
  return result.stdout.trimEnd();
}

export function makeApi(token) {
  return async function api(method, path, payload) {
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await fetch(`https://api.github.com${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'miaogroup-publisher',
            ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          body: payload === undefined ? undefined : JSON.stringify(payload),
          signal: AbortSignal.timeout(25000),
        });
        if (response.status === 404 && method === 'GET') return null;
        const text = await response.text();
        let data;
        try { data = text ? JSON.parse(text) : null; } catch { data = null; }
        if (!response.ok) throw new Error(`GitHub ${response.status}: ${data?.message || response.statusText} (${method} ${path})`);
        return data;
      } catch (error) {
        if (method === 'GET' && attempt < 1 && !error.message.startsWith('GitHub ')) {
          await pause(1000);
          continue;
        }
        if (!error.message.startsWith('GitHub ')) {
          throw new Error(`GitHub API connection failed (${error.cause?.code || error.code || 'network interruption'}). Retry after connectivity returns; saved source files are preserved.`);
        }
        throw error;
      }
    }
  };
}

export function collectArtifacts(directory) {
  const files = [];
  function walk(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (lstatSync(path).isSymbolicLink()) throw new Error('The publication directory must not contain symbolic links.');
      if (entry.isDirectory()) walk(path);
      else {
        const bytes = readFileSync(path);
        if (bytes.length >= 100 * 1024 * 1024) throw new Error(`File exceeds the GitHub file size limit: ${entry.name}`);
        files.push({
          path: relative(directory, path).replaceAll('\\', '/'), bytes,
          sha: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),
        });
      }
    }
  }
  walk(directory);
  if (!files.some((file) => file.path === 'index.html')) throw new Error('Build output is missing index.html; no files have been uploaded.');
  return files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

async function mapLimit(values, limit, operation) {
  const result = new Array(values.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(values.length, limit) }, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      result[index] = await operation(values[index], index);
    }
  }));
  return result;
}

const repoPath = (config) => `/repos/${config.repository}`;
const branchPath = (branch) => branch.split('/').map(encodeURIComponent).join('/');
const workflowPath = (config) => `${repoPath(config)}/actions/workflows/deploy.yml`;

export async function publishArtifacts(api, config, files, sourceCommit, onProgress = () => {}) {
  const repo = repoPath(config);
  const previous = await api('GET', `${repo}/git/ref/heads/${branchPath(config.publishBranch)}`);
  const parentSha = previous?.object.sha;
  let oldFiles = new Map();
  if (parentSha) {
    const oldCommit = await api('GET', `${repo}/git/commits/${parentSha}`);
    const oldTree = await api('GET', `${repo}/git/trees/${oldCommit.tree.sha}?recursive=1`);
    if (oldTree.truncated) throw new Error('The publication branch file listing is too large; publishing settings have not been changed.');
    oldFiles = new Map(oldTree.tree.filter((entry) => entry.type === 'blob').map((entry) => [entry.path, entry.sha]));
  }
  onProgress(`Uploading the Astro site (${files.length} files)...`);
  const treeEntries = await mapLimit(files, 4, async (file) => {
    let sha = oldFiles.get(file.path);
    if (sha !== file.sha) {
      const blob = await api('POST', `${repo}/git/blobs`, { content: file.bytes.toString('base64'), encoding: 'base64' });
      sha = blob.sha;
      if (sha !== file.sha) throw new Error(`Upload verification failed: ${file.path}`);
    }
    return { path: file.path, mode: '100644', type: 'blob', sha };
  });
  // A fresh tree includes only the build output, never source files or an obsolete asset.
  const tree = await api('POST', `${repo}/git/trees`, { tree: treeEntries });
  const commit = await api('POST', `${repo}/git/commits`, {
    message: `Publish Astro site from local build (source ${sourceCommit.slice(0, 12)})`,
    tree: tree.sha, parents: parentSha ? [parentSha] : [],
  });
  if (previous) {
    await api('PATCH', `${repo}/git/refs/heads/${branchPath(config.publishBranch)}`, { sha: commit.sha, force: false });
  } else {
    await api('POST', `${repo}/git/refs`, { ref: `refs/heads/${config.publishBranch}`, sha: commit.sha });
  }
  const workflow = await api('GET', workflowPath(config));
  if (workflow && workflow.state !== 'disabled_manually') {
    await api('PUT', `${repo}/actions/workflows/${workflow.id}/disable`);
  }
  if (workflow) {
    // Disable future runs and finish cancelling existing ones before changing the source.
    const runsPath = `${repo}/actions/workflows/${workflow.id}/runs?per_page=20`;
    const unfinished = (await api('GET', runsPath))?.workflow_runs.filter((run) => run.status !== 'completed') ?? [];
    for (const run of unfinished) {
      try { await api('POST', `${repo}/actions/runs/${run.id}/cancel`); }
      catch (error) {
        const latest = await api('GET', `${repo}/actions/runs/${run.id}`);
        if (latest?.status !== 'completed') throw error;
      }
    }
    const pending = new Set(unfinished.map((run) => run.id));
    for (let attempt = 0; pending.size && attempt < 12; attempt++) {
      await pause(5000);
      const latest = await api('GET', runsPath);
      for (const id of pending) {
        if (latest?.workflow_runs.find((run) => run.id === id)?.status === 'completed') pending.delete(id);
      }
    }
    if (pending.size) throw new Error('Cancellation of the previous deployment is still pending. Retry shortly; the Pages source has not been switched.');
  }
  const pages = await api('GET', `${repo}/pages`);
  const setting = { build_type: 'legacy', source: { branch: config.publishBranch, path: '/' } };
  let changedSource = false;
  if (!pages) {
    await api('POST', `${repo}/pages`, setting);
    changedSource = true;
  } else if (pages.build_type !== 'legacy' || pages.source?.branch !== config.publishBranch || pages.source?.path !== '/') {
    await api('PUT', `${repo}/pages`, setting);
    changedSource = true;
  }
  return { commit: commit.sha, previousCommit: parentSha ?? null, changedSource };
}

export async function activateGitHub(api, config, dispatch = true) {
  const repo = repoPath(config);
  const workflow = await api('GET', workflowPath(config));
  if (!workflow) throw new Error('The original deploy.yml workflow was not found in the source branch.');
  const pages = await api('GET', `${repo}/pages`);
  const settings = { build_type: 'workflow' };
  await api(pages ? 'PUT' : 'POST', `${repo}/pages`, settings);
  if (workflow.state !== 'active') await api('PUT', `${repo}/actions/workflows/${workflow.id}/enable`);
  if (dispatch) await api('POST', `${repo}/actions/workflows/${workflow.id}/dispatches`, { ref: config.sourceBranch });
  return { mode: 'github', dispatched: dispatch };
}

async function synchronize(config, api) {
  const currentBranch = git(['branch', '--show-current']);
  if (currentBranch !== config.sourceBranch) throw new Error(`Switch to the ${config.sourceBranch} source branch before publishing.`);
  const remote = git(['remote', 'get-url', 'origin']);
  if (!remote.toLowerCase().endsWith(`github.com/${config.repository.toLowerCase()}.git`) &&
      !remote.toLowerCase().endsWith(`github.com:${config.repository.toLowerCase()}.git`) &&
      !remote.toLowerCase().endsWith(`github.com/${config.repository.toLowerCase()}`)) {
    throw new Error('origin does not match the repository in publishing.json; publication stopped.');
  }
  const dirty = git(['status', '--porcelain=v1', '--untracked-files=all']);
  const pending = dirty.split(/\r?\n/).filter(Boolean).filter((line) => line.slice(3) !== 'publishing.json');
  if (pending.length) throw new Error('Uncommitted source changes found. Commit changes before publishing; local files will not be overwritten automatically.');
  say(`Checking the latest ${config.sourceBranch} source on GitHub...`);
  const remoteHead = await api('GET', `${repoPath(config)}/git/ref/heads/${branchPath(config.sourceBranch)}`);
  if (!remoteHead) throw new Error('The source branch was not found on GitHub.');
  const sha = remoteHead.object.sha;
  if (git(['rev-parse', 'HEAD']) === sha) return;
  if (git(['cat-file', '-e', `${sha}^{commit}`], { allowFailure: true }) !== null) {
    git(['merge', '--ff-only', sha]);
  } else {
  git(['fetch', 'origin', config.sourceBranch]);
  git(['merge', '--ff-only', `origin/${config.sourceBranch}`]);
  }
  // A fast-forward may also have updated publishing.json. Never build with stale settings.
  const refreshed = JSON.parse(readFileSync(join(root, 'publishing.json'), 'utf8'));
  for (const key of Object.keys(config)) {
    if (refreshed[key] !== config[key]) throw new Error('Publishing settings changed during synchronization. Run the publishing command again.');
  }
}

function build(config) {
  if (!existsSync(join(root, 'node_modules', 'astro', 'astro.js'))) {
    say('Installing website dependencies...');
    const install = process.platform === 'win32'
      ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm ci --no-audit --no-fund'], { cwd: root, stdio: 'inherit', windowsHide: true })
      : spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit' });
    if (install.status !== 0) throw new Error('Dependency installation failed; no files have been uploaded and publishing settings have not been changed.');
  }
  say('Building the Astro site locally and refreshing the calendar subscription feed...');
  const result = spawnSync(process.execPath, [join(root, 'node_modules', 'astro', 'astro.js'), 'build'], {
    cwd: root, stdio: 'inherit', windowsHide: true,
    env: { ...process.env, PUBLISH_BASE: config.base },
  });
  if (result.status !== 0) throw new Error('Build failed; no files have been uploaded and publishing settings have not been changed.');
  const directory = join(root, 'dist');
  writeFileSync(join(directory, '.nojekyll'), '');
  return directory;
}

async function publicReceipt(url) {
  try {
    const response = await fetch(`${url}publish-info.json?verify=${Date.now()}`, {
      signal: AbortSignal.timeout(10000), cache: 'no-store',
    });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

async function waitForPages(api, config, publication, receipt) {
  const url = `${config.site.replace(/\/$/, '')}${config.base}`;
  const started = Date.now();
  let requestedBuild = false;
  let lastReport = 0;
  while (Date.now() - started < 8 * 60 * 1000) {
    const online = await publicReceipt(url);
    if (online?.publicationId === receipt.publicationId) {
      say(`Published successfully: ${url}`);
      return;
    }
    let runs;
    try {
      runs = await api('GET', `${repoPath(config)}/actions/runs?branch=${encodeURIComponent(config.publishBranch)}&per_page=5`);
    } catch (error) {
      if (!error.message.startsWith('GitHub API connection failed')) throw error;
      if (Date.now() - lastReport > 25000) {
        say('Files uploaded; deployment status is temporarily unavailable. Waiting for connectivity...');
        lastReport = Date.now();
      }
      await pause(5000);
      continue;
    }
    const run = runs?.workflow_runs.find((item) => item.head_sha === publication.commit && item.name === 'pages build and deployment');
    if (run?.status === 'completed' && run.conclusion !== 'success') {
      throw new Error(`GitHub built-in Pages deployment did not succeed (${run.conclusion}): ${run.html_url}. Source and generated files have been preserved.`);
    }
    if (!run && !requestedBuild && Date.now() - started > 35000) {
      await api('POST', `${repoPath(config)}/pages/builds`);
      requestedBuild = true;
    }
    if (Date.now() - lastReport > 25000) {
      say(run ? `GitHub static site deployment: ${run.status}. ${run.html_url}` : 'Waiting for GitHub built-in Pages deployment...');
      lastReport = Date.now();
    }
    await pause(5000);
  }
  throw new Error(`Files uploaded, but the online update has not been confirmed. Run npm run publish:check later or inspect ${url}. The uploaded files are preserved.`);
}

function options(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i];
    if (['--check', '--dry-run', '--no-sync', '--no-dispatch'].includes(name)) parsed[name] = true;
    else if (['--repository', '--base', '--mode'].includes(name) && argv[i + 1] && !argv[i + 1].startsWith('--')) parsed[name] = argv[++i];
    else throw new Error(`Unknown option or missing option value: ${name}`);
  }
  return parsed;
}

export async function main(argv = process.argv.slice(2)) {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22 or newer is required.');
  const flags = options(argv);
  const savedConfig = JSON.parse(readFileSync(join(root, 'publishing.json'), 'utf8'));
  const config = validateConfig({ ...savedConfig,
    ...(flags['--repository'] ? { repository: flags['--repository'] } : {}),
    ...(flags['--base'] ? { base: flags['--base'] } : {}),
    ...(flags['--mode'] ? { mode: flags['--mode'] } : {}),
  });
  say(`Publishing mode: ${config.mode === 'local' ? 'local build -> GitHub Pages branch deployment' : 'GitHub Actions build and deployment'}`);
  let api;
  const login = () => {
    if (api) return api;
    const raw = git(['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n' });
    const password = raw.split(/\r?\n/).find((line) => line.startsWith('password='))?.slice('password='.length);
    if (!password) throw new Error('GitHub credentials were not found. Sign in through Git Credential Manager before publishing.');
    api = makeApi(password);
    return api;
  };
  if (!flags['--check'] && !flags['--dry-run'] && !flags['--no-sync']) await synchronize(config, login());
  let directory;
  let files;
  const sourceCommit = git(['rev-parse', 'HEAD']);
  if (!flags['--check'] && config.mode === 'local') {
    directory = build(config);
    files = collectArtifacts(directory);
    if (flags['--dry-run']) {
      say(`Local build check passed: ${files.length} files; no online publication was performed.`);
      return;
    }
  }
  if (flags['--dry-run']) throw new Error('--dry-run is only available in local mode.');
  login();
  const repository = await api('GET', repoPath(config));
  if (!repository?.permissions?.admin) throw new Error('The current GitHub account lacks repository administrator access; publishing settings have not been changed.');
  const [pages, workflow] = await Promise.all([api('GET', `${repoPath(config)}/pages`), api('GET', workflowPath(config))]);
  const url = `${config.site.replace(/\/$/, '')}${config.base}`;
  if (flags['--check']) {
    say(JSON.stringify({ configuredMode: config.mode, pagesSource: pages?.build_type, branch: pages?.source, originalWorkflow: workflow?.state, url, online: await publicReceipt(url) }, null, 2));
    return;
  }
  // This is an operation receipt, not a source backup; version backups live in GitHub tags.
  const operationDir = join(root, 'work', 'publishing');
  mkdirSync(operationDir, { recursive: true });
  writeFileSync(join(operationDir, 'last-operation.json'), `${JSON.stringify({ repository: config.repository, mode: config.mode, sourceCommit, previousPages: pages, previousWorkflowState: workflow?.state, startedAt: new Date().toISOString() }, null, 2)}\n`);
  if (config.mode === 'github') {
    await activateGitHub(api, config, !flags['--no-dispatch']);
    say(flags['--no-dispatch'] ? 'GitHub Actions publishing settings restored; no build was requested.' : `GitHub Actions publishing restored and a build requested: ${repository.html_url}/actions. If the account remains billing-locked, switch back to local mode.`);
    return;
  }
  const receipt = {
    publicationId: createHash('sha256').update(`${Date.now()}:${files.map((file) => file.sha).join(':')}`).digest('hex'),
    sourceCommit, publishedAt: new Date().toISOString(), mode: 'local',
  };
  writeFileSync(join(directory, 'publish-info.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  files = collectArtifacts(directory);
  const publication = await publishArtifacts(api, config, files, sourceCommit, say);
  writeFileSync(join(operationDir, 'last-publication.json'), `${JSON.stringify({ repository: config.repository, ...publication, ...receipt, url }, null, 2)}\n`);
  if (publication.changedSource) {
    try {
      await api('POST', `${repoPath(config)}/pages/builds`);
    } catch (error) {
      if (!error.message.startsWith('GitHub 409:')) throw error;
      // A push can already have queued the same built-in Pages deployment.
    }
  }
  await waitForPages(api, config, publication, receipt);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(`\nPublication incomplete: ${error.message}`);
    process.exitCode = 1;
  });
}
