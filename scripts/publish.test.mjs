import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { activateGitHub, collectArtifacts, publishArtifacts, validateConfig } from './publish.mjs';

const config = { mode: 'local', repository: 'example/site', sourceBranch: 'main', publishBranch: 'gh-pages', site: 'https://example.github.io', base: '/site/' };
const repo = '/repos/example/site';
const blobSha = (bytes) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

test('refuses publishing generated files onto the source branch', () => {
  assert.throws(() => validateConfig({ ...config, publishBranch: 'main' }), /must be different/);
  assert.throws(() => validateConfig({ ...config, base: '/site' }), /base/);
  assert.equal(validateConfig(config).mode, 'local');
});

test('keeps .nojekyll, _astro assets and binary bytes intact', () => {
  const folder = mkdtempSync(join(tmpdir(), 'miaogroup-publish-test-'));
  try {
    mkdirSync(join(folder, '_astro'));
    writeFileSync(join(folder, 'index.html'), '<h1>Original page: café</h1>');
    writeFileSync(join(folder, '.nojekyll'), '');
    const binary = Buffer.from([0, 255, 128, 10]);
    writeFileSync(join(folder, '_astro', 'asset.png'), binary);
    const files = collectArtifacts(folder);
    assert.deepEqual(files.map((file) => file.path), ['_astro/asset.png', '.nojekyll', 'index.html'].sort((a, b) => a.localeCompare(b, 'en')));
    assert.deepEqual(files.find((file) => file.path === '_astro/asset.png').bytes, binary);
    assert.equal(files.find((file) => file.path === '_astro/asset.png').sha, blobSha(binary));
  } finally { rmSync(folder, { recursive: true }); }
});

function fakeApi({ refFailure = false, handleRun } = {}) {
  const calls = [];
  let workflowState = 'active';
  const api = async (method, path, data) => {
    calls.push({ method, path, data });
    if (method === 'GET' && path.includes('/git/ref/')) return null;
    if (method === 'POST' && path.endsWith('/git/blobs')) return { sha: blobSha(Buffer.from(data.content, 'base64')) };
    if (method === 'POST' && path.endsWith('/git/trees')) return { sha: 'new-tree' };
    if (method === 'POST' && path.endsWith('/git/commits')) return { sha: 'new-commit' };
    if (method === 'POST' && path.endsWith('/git/refs')) {
      if (refFailure) throw new Error('branch conflict');
      return {};
    }
    if (method === 'GET' && path.endsWith('/deploy.yml')) return { id: 8, state: workflowState };
    if (method === 'PUT' && path.endsWith('/disable')) {
      workflowState = 'disabled_manually';
      return null;
    }
    if (handleRun && (path.includes('/actions/runs/') || path.includes('/workflows/8/runs?'))) return handleRun(method, path);
    if (method === 'GET' && path.includes('/runs?')) return { workflow_runs: [] };
    if (method === 'GET' && path.endsWith('/pages')) return { build_type: 'workflow' };
    if (method === 'PUT' || (method === 'POST' && path.endsWith('/dispatches'))) return null;
    throw new Error(`Unexpected API call: ${method} ${path}`);
  };
  return { api, calls };
}

test('uploads only artifacts, disables original workflow, then selects the branch', async () => {
  const { api, calls } = fakeApi();
  const bytes = Buffer.from('<h1>same Astro HTML</h1>');
  const result = await publishArtifacts(api, config, [{ path: 'index.html', bytes, sha: blobSha(bytes) }], 'source-commit');
  assert.equal(result.commit, 'new-commit');
  const tree = calls.find((call) => call.path.endsWith('/git/trees')).data;
  assert.equal(tree.base_tree, undefined);
  assert.deepEqual(tree.tree.map((entry) => entry.path), ['index.html']);
  const updateRef = calls.findIndex((call) => call.path.endsWith('/git/refs'));
  const disable = calls.findIndex((call) => call.path.endsWith('/disable'));
  const pages = calls.findIndex((call) => call.method === 'PUT' && call.path.endsWith('/pages'));
  assert.ok(updateRef < disable && disable < pages);
  assert.deepEqual(calls[pages].data, { build_type: 'legacy', source: { branch: 'gh-pages', path: '/' } });
  assert.ok(!calls.some((call) => call.path.includes('/heads/main')));
});

test('a branch conflict does not disable Actions or switch the live site', async () => {
  const { api, calls } = fakeApi({ refFailure: true });
  const bytes = Buffer.from('html');
  await assert.rejects(publishArtifacts(api, config, [{ path: 'index.html', bytes, sha: blobSha(bytes) }], 'source'), /branch conflict/);
  assert.ok(!calls.some((call) => call.path.endsWith('/disable')));
  assert.ok(!calls.some((call) => call.method === 'PUT' && call.path.endsWith('/pages')));
});

const prequeueConflict = () => new Error('GitHub 409: Cannot cancel a workflow run that has not been queued yet. (POST /repos/example/site/actions/runs/91/cancel)');

function stuckRunApi({ status = 'queued', jobs = { total_count: 0, jobs: [] }, error = prequeueConflict() } = {}) {
  const run = { id: 91, status };
  return fakeApi({ handleRun: async (method, path) => {
    if (method === 'GET' && path.includes('/runs?')) return { workflow_runs: [run] };
    if (method === 'GET' && path.endsWith('/runs/91')) return run;
    if (method === 'GET' && path.endsWith('/runs/91/jobs')) return jobs;
    if (method === 'POST' && path.endsWith('/cancel')) throw error;
    throw new Error(`Unexpected run API call: ${method} ${path}`);
  } });
}

const htmlArtifact = () => {
  const bytes = Buffer.from('<h1>Original Astro page</h1>');
  return [{ path: 'index.html', bytes, sha: blobSha(bytes) }];
};

test('local publishing proceeds past the pre-queue conflict only after confirming zero jobs and a disabled workflow', async () => {
  const { api, calls } = stuckRunApi();
  const progress = [];
  const result = await publishArtifacts(api, config, htmlArtifact(), 'source', (message) => progress.push(message));
  assert.equal(result.changedSource, true);
  assert.ok(progress.some((message) => message.includes('91') && message.includes('no jobs')));
  const disable = calls.findIndex((call) => call.path.endsWith('/disable'));
  const jobs = calls.findIndex((call) => call.path.endsWith('/runs/91/jobs'));
  const verifyDisabled = calls.findLastIndex((call) => call.method === 'GET' && call.path.endsWith('/deploy.yml'));
  const switchPages = calls.findIndex((call) => call.method === 'PUT' && call.path.endsWith('/pages'));
  assert.ok(disable < jobs && jobs < verifyDisabled && verifyDisabled < switchPages);
  assert.deepEqual(calls[switchPages].data, { build_type: 'legacy', source: { branch: 'gh-pages', path: '/' } });
});

test('local publishing remains blocked when an uncancellable run has an actual job or is in progress', async () => {
  for (const scenario of [
    { jobs: { total_count: 1, jobs: [{ id: 3, status: 'in_progress' }] } },
    { jobs: { total_count: 1, jobs: [{ id: 3, status: 'queued' }] } },
    { status: 'in_progress' },
    { jobs: null },
    { jobs: { jobs: [] } },
  ]) {
    const { api, calls } = stuckRunApi(scenario);
    await assert.rejects(publishArtifacts(api, config, htmlArtifact(), 'source'), /GitHub 409/);
    assert.ok(!calls.some((call) => call.method === 'PUT' && call.path.endsWith('/pages')));
  }
});

test('local publishing does not ignore unrelated cancellation errors', async () => {
  for (const message of ['GitHub 403: Forbidden', 'GitHub API connection failed', 'GitHub 409: Another conflict']) {
    const { api, calls } = stuckRunApi({ error: new Error(message) });
    await assert.rejects(publishArtifacts(api, config, htmlArtifact(), 'source'), { message });
    assert.ok(!calls.some((call) => call.method === 'PUT' && call.path.endsWith('/pages')));
  }
});

test('local publishing stops if the workflow cannot be confirmed disabled', async () => {
  const { api: baseApi, calls } = stuckRunApi();
  const api = async (...args) => {
    const result = await baseApi(...args);
    if (args[0] === 'GET' && args[1].endsWith('/deploy.yml')) return { ...result, state: 'active' };
    return result;
  };
  await assert.rejects(publishArtifacts(api, config, htmlArtifact(), 'source'));
  assert.ok(!calls.some((call) => call.method === 'PUT' && call.path.endsWith('/pages')));
});

test('GitHub mode restores the original workflow and dispatches the source branch', async () => {
  const calls = [];
  const api = async (method, path, data) => {
    calls.push({ method, path, data });
    if (method === 'GET' && path.endsWith('/deploy.yml')) return { id: 8, state: 'disabled_manually' };
    if (method === 'GET' && path.endsWith('/pages')) return { build_type: 'legacy' };
    return null;
  };
  await activateGitHub(api, { ...config, mode: 'github' });
  assert.deepEqual(calls.filter((call) => call.method !== 'GET'), [
    { method: 'PUT', path: `${repo}/pages`, data: { build_type: 'workflow' } },
    { method: 'PUT', path: `${repo}/actions/workflows/8/enable`, data: undefined },
    { method: 'POST', path: `${repo}/actions/workflows/8/dispatches`, data: { ref: 'main' } },
  ]);
});
