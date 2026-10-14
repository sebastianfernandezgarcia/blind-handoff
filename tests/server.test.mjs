import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.mjs';

test('loopback HTTP server serves only public app assets and rejects writes', async t => {
  const server = createAppServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Blind Handoff/);
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(`${base}/domain.js`)).status, 200);
  assert.equal((await fetch(`${base}/scenarios.js`)).status, 200);
  assert.deepEqual(await (await fetch(`${base}/health`)).json(), { ok: true, app: 'blind-handoff', localOnly: true });
  for (const secretPath of ['/devpost/learner-profile.md', '/.env', '/server.mjs', '/%2e%2e/package.json', '/unknown']) {
    assert.equal((await fetch(base + secretPath)).status, 404, secretPath);
  }
  assert.equal((await fetch(base, { method: 'POST', body: 'test' })).status, 405);
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
