// node tools/shot.mjs <rootDir> <page> <out.png> [js to run before the shot] [wait ms] [viewport WxH]
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const [root, page, out, js, wait, vp] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const srv = http.createServer((q, s) => { const p = path.join(path.resolve(root), decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html')); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); }); }).listen(0);
const [w, h] = (vp || '1280x720').split('x').map(Number);
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: w, height: h } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(`http://localhost:${srv.address().port}/${page}`); await pg.waitForTimeout(1500);
if (js) { const r = await pg.evaluate(js); if (r !== undefined) console.log('eval:', JSON.stringify(r)); }
await pg.waitForTimeout(+(wait || 800)); await pg.screenshot({ path: out, fullPage: page.startsWith('index') });
console.log(out, 'errors:', errs.length ? errs.join(' | ') : 'none'); await b.close(); srv.close();
