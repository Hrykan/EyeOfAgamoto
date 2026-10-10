// Eye of Eye of Agamoto · Vidya Classes — clip renderer.
//   node render.mjs                    render every clip into clips/<id>.mp4 (priority order, 3 pages in parallel)
//   node render.mjs wait-1 c1-ban      render only these ids (also 'rewind-<road>', 'wait-2-<c1>')
//   node render.mjs --walkthrough      concatenate the demo path into walkthrough.mp4
//   node render.mjs --serve [port]     static server with Range support (for play.html), default port 8080
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path'; import os from 'os';
import { spawn } from 'child_process'; import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CLIPS = path.join(ROOT, 'clips');
const FPS = 30, PAR = 3, DEFAULT_ROAD = 'build-retrain';
const ROADS = ['build-retrain', 'build-cut', 'ban-retrain', 'ban-cut'];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function serve(port = 0) {
  const srv = http.createServer((q, s) => {
    const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/\.\./g, ''));
    fs.stat(p, (e, st) => {
      if (e || !st.isFile()) { s.writeHead(404); s.end(); return; }
      const type = types[path.extname(p)] || 'application/octet-stream', m = /bytes=(\d*)-(\d*)/.exec(q.headers.range || '');
      if (m) {
        const a = m[1] === '' ? Math.max(0, st.size - +m[2]) : +m[1], b = m[1] === '' || m[2] === '' ? st.size - 1 : Math.min(+m[2], st.size - 1);
        s.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${b}/${st.size}`, 'content-length': b - a + 1 });
        fs.createReadStream(p, { start: a, end: b }).pipe(s);
      } else { s.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': st.size, 'cache-control': 'no-cache' }); fs.createReadStream(p).pipe(s); }
    });
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}

// output id -> { clip, road, out[], }
function spec(id) {
  let m;
  if (id === 'rewind') return { clip: 'rewind', road: DEFAULT_ROAD, outs: ['rewind', 'rewind-build-retrain'] };
  if ((m = id.match(/^rewind-(\w+-\w+)$/))) return { clip: 'rewind', road: m[1], outs: [id] };
  if ((m = id.match(/^wait-2-(ban|build)$/))) return { clip: 'wait-2', road: m[1] + '-retrain', outs: [id] };
  if (id === 'wait-2') return { clip: 'wait-2', road: DEFAULT_ROAD, outs: ['wait-2', 'wait-2-build'] };
  if ((m = id.match(/^(?:c2|end)-(\w+-\w+)$/))) return { clip: id, road: m[1], outs: [id] };
  if ((m = id.match(/^c1-(\w+)$/))) return { clip: id, road: m[1] + '-retrain', outs: [id] };
  return { clip: id, road: DEFAULT_ROAD, outs: [id] };
}

const DEFAULT_ORDER = ['prologue', 'wait-1', 'wait-2', 'c1-build', 'c2-build-retrain', 'end-build-retrain', 'rewind',
  'c1-ban', 'wait-2-ban', 'c2-ban-retrain', 'end-ban-retrain', 'rewind-ban-retrain',
  'c2-build-cut', 'c2-ban-cut', 'end-build-cut', 'end-ban-cut', 'rewind-build-cut', 'rewind-ban-cut'];

async function renderOne(browser, port, id) {
  const sp = spec(id), t0 = Date.now(), page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  try {
    await page.goto(`http://localhost:${port}/index.html?clip=${sp.clip}&road=${sp.road}&s=0.6667&static=1`);
    await page.evaluate(() => AGAMOTO.ready);
    const dur = await page.evaluate(c => AGAMOTO.dur(c), sp.clip), n = Math.round(dur * FPS);
    fs.mkdirSync(CLIPS, { recursive: true });
    const tmp = path.join(CLIPS, `.${sp.outs[0]}.tmp.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-vf', 'scale=1280:720', '-an', '-f', 'mp4', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => { ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))); ff.on('error', rej); });
    ff.stdin.on('error', () => {});
    for (let i = 0; i < n; i++) {
      const url = await page.evaluate(([c, t, r]) => { AGAMOTO.frame(c, t, r); return AGAMOTO.canvas.toDataURL('image/jpeg', .85); }, [sp.clip, i / FPS, sp.road]);
      const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await done;
    for (const o of sp.outs) fs.copyFileSync(tmp, path.join(CLIPS, o + '.mp4'));
    fs.unlinkSync(tmp);
    console.log(`${sp.outs.join(' + ')}.mp4  ${n} frames  ${((Date.now() - t0) / 1000).toFixed(1)}s${errs.length ? '  (page errors: ' + [...new Set(errs)].slice(0, 3).join(' | ') + ')' : ''}`);
    return true;
  } catch (e) { console.log(`FAILED ${id}: ${e.message}`); return false; }
  finally { await page.close(); }
}

async function renderAll(ids) {
  const srv = await serve(0), port = srv.address().port, browser = await chromium.launch(), T = Date.now();
  const queue = [...ids]; let bad = 0;
  await Promise.all(Array.from({ length: Math.min(PAR, queue.length) }, async () => {
    while (queue.length) { const id = queue.shift(); if (!(await renderOne(browser, port, id))) bad++; }
  }));
  await browser.close(); srv.close();
  console.log(`done ${ids.length - bad}/${ids.length} in ${((Date.now() - T) / 1000).toFixed(1)}s`);
  if (bad) process.exitCode = 1;
}

function walkthrough() {
  const seq = ['prologue', 'wait-1', 'c1-build', 'wait-2', 'c2-build-retrain', 'end-build-retrain', 'rewind-build-retrain', 'c1-ban', 'c2-ban-retrain', 'end-ban-retrain'];
  const have = seq.filter(id => { const ok = fs.existsSync(path.join(CLIPS, id + '.mp4')); if (!ok) console.log('skip (missing): ' + id); return ok; });
  if (!have.length) { console.log('no clips to concatenate'); process.exitCode = 1; return; }
  const list = path.join(os.tmpdir(), `agamoto-concat-${process.pid}.txt`);
  fs.writeFileSync(list, have.map(id => `file '${path.join(CLIPS, id + '.mp4')}'`).join('\n') + '\n');
  const r = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c:v', 'libx264', '-crf', '24', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-r', String(FPS), '-an', path.join(ROOT, 'walkthrough.mp4')], { stdio: 'inherit' });
  r.on('close', c => { fs.rmSync(list, { force: true }); console.log(c === 0 ? `walkthrough.mp4 from ${have.length} clips` : 'ffmpeg failed'); process.exitCode = c; });
}

const args = process.argv.slice(2);
if (args[0] === '--walkthrough') walkthrough();
else if (args[0] === '--serve') { const p = +args[1] || 8080; serve(p).then(() => console.log(`http://localhost:${p}/play.html`)); }
else await renderAll(args.length ? args : DEFAULT_ORDER);
