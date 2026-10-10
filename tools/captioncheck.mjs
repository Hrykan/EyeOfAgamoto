// Scans every clip at 10 fps and reports captions drawn while ctx.textAlign wasn't left/start (the overlap bug).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, s) => { const p = path.join(process.cwd(), decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); } }); }).listen(0);
const b = await chromium.launch(); const pg = await b.newPage();
await pg.goto(`http://localhost:${srv.address().port}/story.html?s=0.25&static=1&nograin=1`); await pg.evaluate(() => AGAMOTO.ready);
const res = await pg.evaluate(() => {
  const bad = {}, orig = C.caption;
  C.caption = function () { const a = C.ctx.textAlign; if (a !== 'left' && a !== 'start') bad[window._id] = (bad[window._id] || 0) + 1; return orig.apply(this, arguments); };
  const roads = ['build-retrain', 'build-cut', 'ban-retrain', 'ban-cut'];
  const ids = ['prologue', 'wait-1', 'c1-ban', 'c1-build'].map(i => [i, 'build-retrain']).concat([['wait-2', 'ban-retrain'], ['wait-2', 'build-retrain']]);
  roads.forEach(r => ids.push(['c2-' + r, r], ['end-' + r, r], ['rewind', r]));
  ids.forEach(([id, r]) => { window._id = id + '@' + r; for (let t = 0; t <= AGAMOTO.dur(id); t += 0.1) AGAMOTO.frame(id, t, r); });
  return bad;
});
console.log(Object.keys(res).length ? res : 'no caption drawn with a leaked alignment'); await b.close(); srv.close();
