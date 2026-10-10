// Eye of Eye of Agamoto · Vidya Classes — clip renderer.
//   node render.mjs                    render every clip into clips/<id>.mp4 (priority order, 3 pages in parallel)
//   node render.mjs wait-1 c1-ban      render only these ids (also 'rewind-<road>', 'wait-2-<c1>')
//   node render.mjs --walkthrough      concatenate the demo path into walkthrough.mp4
//   node render.mjs --serve [port]     static server with Range support (for the player), default port 8080
//   node render.mjs place-shop --road ban-cut   preview one PLACES scene with its sound → qc/place-shop@ban-cut.mp4
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
// --road <road> picks the road for place-<name> previews; they go to qc/place-<name>@<road>.mp4 (with sound)
const ROAD_ARG = (() => { const i = process.argv.indexOf('--road'); if (i < 0) return null; const r = process.argv[i + 1]; process.argv.splice(i, 2); return r; })();
function spec(id) {
  let m;
  if (/^place-/.test(id)) { const r = ROAD_ARG || DEFAULT_ROAD; return { clip: id, road: r, outs: [`${id}@${r}`], dir: path.join(ROOT, 'qc') }; }
  if (id === 'rewind') return { clip: 'rewind', road: DEFAULT_ROAD, outs: ['rewind', 'rewind-build-retrain'] };
  if ((m = id.match(/^rewind-(\w+-\w+)$/))) return { clip: 'rewind', road: m[1], outs: [id] };
  if ((m = id.match(/^wait-2-(ban|build)$/))) return { clip: 'wait-2', road: m[1] + '-retrain', outs: [id] };
  if (id === 'wait-2') return { clip: 'wait-2', road: DEFAULT_ROAD, outs: ['wait-2', 'wait-2-build'] };
  if ((m = id.match(/^(?:c2|end|mid)-(\w+-\w+)$/))) return { clip: id, road: m[1], outs: [id] };
  if ((m = id.match(/^(?:c1|home)-(\w+)$/))) return { clip: id, road: m[1] + '-retrain', outs: [id] };
  return { clip: id, road: DEFAULT_ROAD, outs: [id] };
}

// each id is a whole shot (story.html SHOTS: board push → clip → places → board pull), rendered with its score
const DEFAULT_ORDER = ['prologue', 'wait-1', 'wait-2', 'c1-build', 'c2-build-retrain', 'end-build-retrain', 'rewind',
  'c1-ban', 'wait-2-ban', 'c2-ban-retrain', 'end-ban-retrain', 'rewind-ban-retrain',
  'c2-build-cut', 'c2-ban-cut', 'end-build-cut', 'end-ban-cut', 'rewind-build-cut', 'rewind-ban-cut'];

async function renderOne(browser, port, id) {
  const sp = spec(id), t0 = Date.now(), page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  try {
    await page.goto(`http://localhost:${port}/story.html?clip=${sp.clip}&road=${sp.road}&s=0.6667&static=1`);
    await page.evaluate(() => AGAMOTO.ready);
    const dur = await page.evaluate(c => AGAMOTO.dur(c), sp.clip), n = Math.round(dur * FPS);
    const OUT = sp.dir || CLIPS; fs.mkdirSync(OUT, { recursive: true });
    const tmp = path.join(OUT, `.${sp.outs[0]}.tmp.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-crf', '26', '-pix_fmt', 'yuv420p', '-vf', 'scale=1280:720', '-an', '-f', 'mp4', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => { ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))); ff.on('error', rej); });
    ff.stdin.on('error', () => {});
    for (let i = 0; i < n; i++) {
      const url = await page.evaluate(([c, t, r]) => { AGAMOTO.frame(c, t, r); return AGAMOTO.canvas.toDataURL('image/jpeg', .85); }, [sp.clip, i / FPS, sp.road]);
      const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await done;
    // the score: groove.js rendered offline in the page (deterministic), fixed level (no per-clip normalising, so joined
    // clips don't jump in loudness), muxed as AAC. A clip without sound would fail the animotion "never ship silent" rule.
    const wav64 = await page.evaluate(async ([c, r, secs]) => {
      const SR = 48000, ac = new OfflineAudioContext(2, Math.ceil(SR * secs), SR); AGAMOTO.score(c, r)(ac);
      const buf = await ac.startRendering(), n = buf.length, L = buf.getChannelData(0), R = buf.getChannelData(1);
      let peak = 1e-9; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
      const g = peak > .97 ? .97 / peak : 1, dv = new DataView(new ArrayBuffer(44 + n * 4)), w = (o, str) => [...str].forEach((ch, i) => dv.setUint8(o + i, ch.charCodeAt(0)));
      w(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
      dv.setUint32(24, SR, true); dv.setUint32(28, SR * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) { dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * g)) * 32767, true); dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i] * g)) * 32767, true); }
      const bytes = new Uint8Array(dv.buffer); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    }, [sp.clip, sp.road, dur]);
    const wav = path.join(OUT, `.${sp.outs[0]}.wav`), muxed = path.join(OUT, `.${sp.outs[0]}.mux.mp4`);
    fs.writeFileSync(wav, Buffer.from(wav64, 'base64'));
    await new Promise((res, rej) => { const m = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', muxed], { stdio: 'inherit' }); m.on('close', c => c === 0 ? res() : rej(new Error('mux exit ' + c))); });
    for (const o of sp.outs) fs.copyFileSync(muxed, path.join(OUT, o + '.mp4'));
    fs.unlinkSync(tmp); fs.unlinkSync(muxed); fs.mkdirSync(path.join(ROOT, 'qc', 'wav'), { recursive: true }); fs.renameSync(wav, path.join(ROOT, 'qc', 'wav', sp.outs[0] + '.wav'));
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
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-r', String(FPS), path.join(ROOT, 'walkthrough.mp4')], { stdio: 'inherit' });
  r.on('close', c => { fs.rmSync(list, { force: true }); console.log(c === 0 ? `walkthrough.mp4 from ${have.length} clips` : 'ffmpeg failed'); process.exitCode = c; });
}

const args = process.argv.slice(2);
if (args[0] === '--walkthrough') walkthrough();
else if (args[0] === '--serve') { const p = +args[1] || 8080; serve(p).then(() => console.log(`http://localhost:${p}/`)); }
else await renderAll(args.length ? args : DEFAULT_ORDER);
