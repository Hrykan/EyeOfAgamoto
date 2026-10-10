// node tools/hometest.mjs <rootDir> → loads the home page, opens example 1, checks the result and the live film; screenshots qc/home-*.png
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve(process.argv[2] || '.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html')); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); }); }).listen(0);
const b = await chromium.launch();
for (const [w, h, tag] of [[1280, 800, 'desk'], [390, 844, 'phone']]) {
  const pg = await b.newPage({ viewport: { width: w, height: h } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`http://localhost:${srv.address().port}/`); await pg.waitForTimeout(1800);
  const mode = await pg.textContent('#mode span');
  await pg.click('#examples button >> nth=0'); await pg.waitForTimeout(3500);
  const res = await pg.evaluate(() => ({ title: document.querySelector('.dcard h3')?.textContent, ends: document.querySelectorAll('.end').length, brief: !!document.querySelector('.why-grid'), table: document.querySelectorAll('.cmp tbody tr').length, overflowX: document.documentElement.scrollWidth > innerWidth + 1 }));
  const filmOk = await pg.frameLocator('#film').locator('canvas').count();
  await pg.screenshot({ path: `qc/home-${tag}.png`, fullPage: true });
  await pg.locator('.rtop').screenshot({ path: `qc/home-${tag}-result.png` });
  console.log(tag, JSON.stringify({ mode: mode.slice(0, 60), ...res, filmCanvas: filmOk }), 'errors:', errs.length ? errs.join(' | ') : 'none');
  await pg.close();
}
await b.close(); srv.close();
