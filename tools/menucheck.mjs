// Screenshots the menu in both modes and checks every menu control is the top element at its own centre (nothing covers it).
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve(process.argv[2] || '.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html')); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); }); }).listen(0);
const b = await chromium.launch();
for (const [w, h] of [[1280, 720], [1920, 1080], [1280, 900]]) {
  const pg = await b.newPage({ viewport: { width: w, height: h } }); await pg.goto(`http://localhost:${srv.address().port}/`); await pg.waitForTimeout(1200);
  for (const mode of ['solo', 'room']) {
    await pg.evaluate(m => PLAY.setVoting(m === 'room'), mode); await pg.waitForTimeout(150);
    const r = await pg.evaluate(() => { const bad = [], st = document.querySelector('#stage').getBoundingClientRect();
      document.querySelectorAll('#splash button, #mStart').forEach(el => { const b = el.getBoundingClientRect(), t = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); if (!t || !(el === t || el.contains(t))) bad.push((el.id || el.textContent.trim().slice(0, 24)) + ' covered by ' + (t ? (t.id || t.getAttribute('class')) : 'nothing')); });
      const k = document.querySelector('#splash .keys').getBoundingClientRect(); if (k.bottom > st.bottom + 1) bad.push('keys legend runs off the stage');
      return bad; });
    console.log(`${w}x${h} ${mode}: ${r.length ? r.join('; ') : 'all menu controls clickable'}`);
    if (w === 1280 && h === 720) await pg.screenshot({ path: `qc/menu-${mode}.png` });
  }
  await pg.close();
}
await b.close(); srv.close();
