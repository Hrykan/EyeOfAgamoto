// node joincheck.mjs  → checks every join: last frame of A (t=dur) vs first frame of B (t=0), mean abs pixel diff (no grain)
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, s) => { const p = path.join(process.cwd(), decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); } }); }).listen(0);
const b = await chromium.launch(); const pg = await b.newPage();
await pg.goto(`http://localhost:${srv.address().port}/story.html?s=0.25&static=1&nograin=1`); await pg.evaluate(() => AGAMOTO.ready);
const J = [['prologue', 'wait-1', 'build-retrain'], ['wait-1', 'wait-1', 'build-retrain'], ['wait-1', 'c1-ban', 'ban-cut'], ['wait-1', 'c1-build', 'build-retrain'],
  ['c1-ban', 'wait-2', 'ban-cut'], ['c1-build', 'wait-2', 'build-cut'], ['wait-2', 'wait-2', 'build-cut'], ['wait-2', 'wait-2', 'ban-cut']];
for (const r of ['build-retrain', 'build-cut', 'ban-retrain', 'ban-cut']) J.push(['wait-2', 'c2-' + r, r], ['c2-' + r, 'end-' + r, r], ['end-' + r, 'rewind', r], ['rewind', 'c1-ban', r], ['rewind', 'wait-1', r]);
const res = await pg.evaluate((J) => {
  const cv = AGAMOTO.canvas, x = cv.getContext('2d');
  function grab(id, t, r) { AGAMOTO.frame(id, t, r); return x.getImageData(0, 0, cv.width, cv.height - 30).data; }
  return J.map(([a, bb, r]) => { const A = grab(a, AGAMOTO.dur(a), r), B = grab(bb, 0, r); let d = 0; for (let i = 0; i < A.length; i += 4) d += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); return [a, bb, r, +(d / (A.length / 4) / 3).toFixed(2)]; });
}, J);
for (const [a, bb, r, d] of res) console.log((d < 1.5 ? 'OK  ' : 'BAD ') + `${a} → ${bb} (${r})  diff ${d}`);
await b.close(); srv.close();
