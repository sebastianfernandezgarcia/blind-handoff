import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/receiver.js', ['receiver.js', 'text/javascript; charset=utf-8']],
  ['/scenarios.js', ['scenarios.js', 'text/javascript; charset=utf-8']],
  ['/domain.js', ['domain.js', 'text/javascript; charset=utf-8']]
]);
export function createAppServer() {
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end('Method not allowed'); return; }
    let pathname;
    try { pathname = new URL(req.url, 'http://127.0.0.1').pathname; } catch { res.writeHead(400); res.end('Bad request'); return; }
    if (pathname === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ok: true, app: 'blind-handoff', localOnly: true })); return; }
    const entry = files.get(pathname);
    if (!entry) { res.writeHead(404); res.end('Not found'); return; }
    try {
      const content = await readFile(path.join(root, entry[0]));
      res.writeHead(200, { 'Content-Type': entry[1] });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { res.writeHead(500); res.end('Could not load this page. Check the local project files.'); }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createAppServer();
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Port 4319 is busy. Stop the process already using it, then retry.' : error.message); process.exitCode = 1; });
  server.listen(4319, '127.0.0.1', () => console.log('Blind Handoff ready at http://127.0.0.1:4319'));
}
