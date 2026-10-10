// Loads the player (play.html) headless, reports page errors and screenshots the splash.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const srv = http.createServer((q, s) => { const p = path.join(process.cwd(), decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); } }); }).listen(0);
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
pg.on('pageerror', e => errs.push(e.message)); await pg.goto(`http://localhost:${srv.address().port}/play.html`); await pg.waitForTimeout(1500);
await pg.screenshot({ path: 'qc/stage-final-splash.png' }); console.log('errors:', errs.length ? errs.join(' | ') : 'none'); await b.close(); srv.close();
