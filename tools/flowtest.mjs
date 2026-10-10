// node tools/flowtest.mjs [rootDir]  → drives the player (index.html) through a full room session, screenshots to qc/flow-*.png
// Headless Chromium has no H.264, so point rootDir at a copy whose clips/*.mp4 are VP8 transcodes.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve(process.argv[2] || '.'), out = path.resolve('qc');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } const range = q.headers.range; const ty = types[path.extname(p)] || 'application/octet-stream';
  if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const st = +a, en = b ? +b : d.length - 1; s.writeHead(206, { 'content-type': ty, 'content-range': `bytes ${st}-${en}/${d.length}`, 'accept-ranges': 'bytes', 'content-length': en - st + 1 }); s.end(d.subarray(st, en + 1)); }
  else { s.writeHead(200, { 'content-type': ty, 'accept-ranges': 'bytes', 'content-length': d.length }); s.end(d); } }); }).listen(0);
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(`http://localhost:${srv.address().port}/index.html`); await pg.waitForTimeout(1200);
const t0 = Date.now(), log = [];
await pg.exposeFunction('_seg', (id, fb) => log.push([((Date.now() - t0) / 1000).toFixed(2), id, fb ? 'LIVE-FALLBACK' : 'video']));
await pg.evaluate(() => { let last = null; setInterval(() => { const s = PLAY.S.seg; if (s && s.id !== last) { last = s.id; window._seg(s.id, PLAY.S.fbOn); } }, 50); });
const shot = n => pg.screenshot({ path: `${out}/flow-${n}.png` });
const until = (fn, ms = 60000) => pg.waitForFunction(fn, null, { timeout: ms, polling: 100 });
await pg.keyboard.press("Enter");
await until(() => PLAY.S.seg && PLAY.S.seg.id === 'wait-1', 30000); await pg.waitForTimeout(700);
await pg.keyboard.press('1'); await pg.keyboard.press('1'); await pg.keyboard.press('2'); await pg.waitForTimeout(300); await shot('1-choice');
await pg.keyboard.press('Enter'); await pg.waitForTimeout(280); await shot('2-cardfly'); await pg.waitForTimeout(900); await shot('3-landed');
await until(() => PLAY.S.seg && PLAY.S.seg.id === 'wait-2-ban', 30000); await pg.waitForTimeout(600); await shot('4-choice2');
await pg.keyboard.press('2'); await pg.keyboard.press('Enter');
await until(() => PLAY.S.seg && /^end-/.test(PLAY.S.seg.id), 30000); await pg.waitForTimeout(1000); await shot('5-2036');
await until(() => PLAY.S.mapOn, 30000); await pg.waitForTimeout(800); await shot('6-map');
await pg.keyboard.press('4');
await pg.waitForTimeout(1300); await shot('7-rewind');
await until(() => PLAY.S.cmpOn, 80000); await pg.waitForTimeout(900); await shot('8-compare');
console.log(log.map(l => l.join('  ')).join('\n')); console.log('errors:', errs.length ? errs.join(' | ') : 'none');
await b.close(); srv.close();
