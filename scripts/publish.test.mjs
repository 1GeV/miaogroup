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

function fakeApi({ refFailure = false } = {}) {
  const calls = [];
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
    if (method === 'GET' && path.endsWith('/deploy.yml')) return { id: 8, state: 'active' };
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
