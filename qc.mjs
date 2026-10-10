// node qc.mjs <clipId> <t1> [t2 ...] [--road build-retrain]  → qc/<id>-<t>.jpg   (starts its own static server)
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const args = process.argv.slice(2); let road = 'build-retrain'; const ri = args.indexOf('--road'); if (ri >= 0) { road = args[ri + 1]; args.splice(ri, 2); }
const [id, ...ts] = args; fs.mkdirSync('qc', { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const srv = http.createServer((q, s) => { const p = path.join(process.cwd(), decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); } }); }).listen(0);
const port = srv.address().port;
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto(`http://localhost:${port}/story.html?clip=${id}&road=${road}&s=0.6667&static=1`); await pg.evaluate(() => AGAMOTO.ready);
for (const t of ts) {
  const url = await pg.evaluate(([id, t, road]) => { AGAMOTO.frame(id, +t, road); return AGAMOTO.canvas.toDataURL('image/jpeg', .85); }, [id, t, road]);
  const f = `qc/${id}${road !== 'build-retrain' ? '@' + road : ''}-${t}.jpg`; fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log(f);
}
if (errs.length) console.log('ERRORS:', errs.join('\n'));
await b.close(); srv.close();
