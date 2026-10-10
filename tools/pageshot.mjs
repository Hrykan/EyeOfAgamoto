// node tools/shot.mjs <page.html> <out.png> [wait ms]  — screenshot a local page at 1920x1080 via a tiny static server
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const [page, out, wait = 600] = process.argv.slice(2), root = process.cwd();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); } }); }).listen(0);
const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1920, height: 1080 } }), errs = [];
pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
await pg.goto(`http://localhost:${srv.address().port}/${page}`); await pg.waitForTimeout(+wait); await pg.screenshot({ path: out });
console.log(out, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'ok'); await b.close(); srv.close();
