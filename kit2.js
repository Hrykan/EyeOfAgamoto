/* kit2.js — the animotion skill's collage + motion layer, ported to this project's 16:9 engine (global C).
   Source: ~/.claude/skills/animotion (templates/collage.js + kit.js), adapted: draws to C.ctx, world 1920×1080,
   labels in Barlow Condensed 800 (the project's heavy condensed face), beat grid 96 bpm.
   Pure: a frame is a function of time. Load after collage.js and before cast.js / places-*.js.

   Beat grid   C.BEAT (0.625 s) · C.onBeat(n) · C.T12(t) on-twos time · C.beatPulse(t) · C.bump(cam, t, amt)
   Camera      C.drift(cam, t) moving hold · C.shake(cam, t, at) 0.3 s stamp shake · C.pushFx(zoom, blur, fn) push-through
   Paper       C.paperPiece(poly, fill, {dots, dotA, grain, shadow, blur, sx, sy}) · C.cardboard(col) screen-space ground
               C.sticker(x, y, w, h, fn, {res, rim, rimW, dots, grain, shadow}) any drawing as a scissor-cut piece
               C.photoSticker(img, x, y, w, o) · C.tornPrint(img, x, y, w, h, seed, {filter, focusX, focusY, tint, border})
   Type/marks  C.banner(text, x, y, {size, bg, fg, rot, p, seed}) · C.inkStamp(text, x, y, p, {size, col, rot, seed})
               C.tape(x, y, w, rot, o) · C.highlight(x, y, w, h, p, col, blend) · C.markUnder(x0, x1, y, p, col)
               C.markRing2(x, y, rx, ry, p, {col, w}) — saffron by default; red ONLY for something false
   Accents     C.sunburst(x, y, r0, r1, n, col, a, rot) · C.zigzag(x0, y, x1, amp, col, w, step) · C.confetti(seed, t, col, n, area)
   Motion      C.beats(lt, tA0, tA1, tP, tS) four-beat take timing · C.lag(f, t, k) follow-through · C.popIn(x, y, p, fn)
               C.trail(fn, t, n) motion trails · C.sweatDrop(x, y, p) · C.countScale(n, n0, n1, k0, k1)
   Photos      C.IMG(name) → loaded image or null (see PHOTOS below; story.html waits for them)
*/
(function (root) {
  'use strict';
  var C = root.C, P = C.PALETTE;
  C.BEAT = 60 / 96;
  C.onBeat = function (n) { return n * C.BEAT; };
  C.T12 = function (t) { return Math.floor(t * 12) / 12; };
  C.beatPulse = function (t) { return Math.exp(-((((t % C.BEAT) + C.BEAT) % C.BEAT) / 0.09)); };
  C.bump = function (cam, t, amt) { return { x: cam.x, y: cam.y, z: cam.z * (1 + (amt == null ? 0.012 : amt) * C.beatPulse(t)) }; };
  C.drift = function (cam, t) { return { x: cam.x + Math.sin(t * 0.9 + 0.5) * 5 / cam.z, y: cam.y + Math.cos(t * 0.7) * 4 / cam.z, z: cam.z * (1 + 0.006 * Math.sin(t * 0.5)) }; };
  C.shake = function (cam, t, at) {
    if (at == null || t <= at || t >= at + 0.3) return cam;
    var s = (1 - (t - at) / 0.3) * 12 / cam.z; return { x: cam.x + Math.sin(t * 90) * s, y: cam.y + Math.cos(t * 70) * s, z: cam.z };
  };

  /* ---------- textures (made once) ---------- */
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var GRAIN = (function () { var c = mk(256, 256), g = c.getContext('2d'), d = g.createImageData(256, 256), s = 7;
    for (var i = 0; i < d.data.length; i += 4) { s = (s * 16807) % 2147483647; var v = 128 + ((s % 1000) / 1000 - 0.5) * 110; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); return c; })();
  var DOTS = {};
  function dotTile(col, sp, r) { sp = sp || 9; r = r || 2.2; var k = col + sp + r; if (!DOTS[k]) { var c = mk(sp * 2, sp * 2), g = c.getContext('2d'); g.fillStyle = col;
    [[sp / 2, sp / 2], [sp * 1.5, sp * 1.5]].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], r, 0, 7); g.fill(); }); DOTS[k] = c; } return DOTS[k]; }
  function trace(c, poly) { c.beginPath(); c.moveTo(poly[0][0], poly[0][1]); for (var i = 1; i < poly.length; i++) c.lineTo(poly[i][0], poly[i][1]); c.closePath(); }

  // torn paper with occasional bigger bites (reads hand-torn); sides e.g. 'tb' tears only top and bottom
  function tornLine(x0, y0, x1, y1, seed, rough, step) {
    var r = C.rand(seed), len = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(2, Math.round(len / (step || 9))), nx = -(y1 - y0) / len, ny = (x1 - x0) / len, pts = [];
    for (var i = 0; i <= n; i++) { var u = i / n, j = (i === 0 || i === n) ? 0 : (r() - 0.5) * 2 * (rough == null ? 5 : rough) * (r() < 0.14 ? 2.3 : 1); pts.push([x0 + (x1 - x0) * u + nx * j, y0 + (y1 - y0) * u + ny * j]); }
    return pts;
  }
  C.tornRect2 = function (x, y, w, h, seed, rough, sides) {
    sides = sides || 'trbl';
    function e(s, a, b, cc, d, k) { return sides.indexOf(s) >= 0 ? tornLine(a, b, cc, d, seed + k, rough) : [[a, b], [cc, d]]; }
    return e('t', x, y, x + w, y, 1).concat(e('r', x + w, y, x + w, y + h, 2).slice(1), e('b', x + w, y + h, x, y + h, 3).slice(1), e('l', x, y + h, x, y, 4).slice(1, -1));
  };

  C.paperPiece = function (poly, fill, o) {
    var c = C.ctx; o = o || {};
    c.save(); trace(c, poly); if (o.shadow !== false) { c.shadowColor = 'rgba(26,16,8,.32)'; c.shadowBlur = o.blur == null ? 16 : o.blur; c.shadowOffsetX = o.sx == null ? 5 : o.sx; c.shadowOffsetY = o.sy == null ? 9 : o.sy; } c.fillStyle = fill; c.fill(); c.restore();
    c.save(); trace(c, poly); c.clip();
    if (o.dots) { var da = o.dotA == null ? 0.2 : o.dotA; c.globalAlpha *= da; c.fillStyle = c.createPattern(dotTile(o.dots, o.sp, o.r), 'repeat'); c.fillRect(-3000, -3000, 9000, 9000); c.globalAlpha /= da; }
    c.globalAlpha *= o.grain == null ? 0.2 : o.grain; c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.fillRect(-3000, -3000, 9000, 9000);
    c.restore();
  };
  // flat bold cardboard ground (screen space): colour + grain + soft vignette. Call before any camera.
  C.cardboard = function (col, vig) {
    var c = C.ctx; c.save(); c.fillStyle = col; c.fillRect(-10, -10, 1940, 1100);
    c.globalAlpha = 0.2; c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.fillRect(-10, -10, 1940, 1100); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    var v = c.createRadialGradient(960, 480, 220, 960, 540, 1150); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,0,' + (vig == null ? 0.3 : vig) + ')'); c.fillStyle = v; c.fillRect(-10, -10, 1940, 1100); c.restore();
  };

  // sticker(): ANY drawing as a scissor-cut piece — white rim, drop shadow, halftone + grain on the print.
  // fn draws with C.ctx in local coords 0..w × 0..h. res > 1 renders sharper for close-ups. Do not nest stickers.
  var STK = { c: mk(8, 8), t: mk(8, 8) };
  C.sticker = function (x, y, w, h, fn, o) {
    o = o || {}; var pad = 26, s = o.res || 1.5, PW = Math.ceil((w + pad * 2) * s), PH = Math.ceil((h + pad * 2) * s);
    [STK.c, STK.t].forEach(function (cv) { if (cv.width < PW || cv.height < PH) { cv.width = Math.max(cv.width, PW); cv.height = Math.max(cv.height, PH); } });
    var main = C.ctx, g = STK.c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.clearRect(0, 0, PW, PH);
    g.setTransform(s, 0, 0, s, pad * s, pad * s); C.ctx = g; try { fn(g); } finally { C.ctx = main; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
    if (o.dots !== false) { g.globalAlpha = o.dotA == null ? 0.1 : o.dotA; g.fillStyle = g.createPattern(dotTile('#000', 7, 1.5), 'repeat'); g.fillRect(0, 0, PW, PH); }
    g.globalAlpha = o.grain == null ? 0.14 : o.grain; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, PW, PH); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    var t = STK.t.getContext('2d'); t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, PW, PH); t.drawImage(STK.c, 0, 0, PW, PH, 0, 0, PW, PH);
    t.globalCompositeOperation = 'source-in'; t.fillStyle = o.rim || '#fffdf7'; t.fillRect(0, 0, PW, PH); t.globalCompositeOperation = 'source-over';
    var rim = (o.rimW == null ? 7 : o.rimW) * s, c = C.ctx;
    c.save(); c.translate(x - pad, y - pad); c.scale(1 / s, 1 / s);
    if (o.shadow !== false) { c.save(); c.shadowColor = 'rgba(26,16,8,.32)'; c.shadowBlur = o.blur == null ? 18 : o.blur; c.shadowOffsetX = o.sx == null ? 7 : o.sx; c.shadowOffsetY = o.sy == null ? 11 : o.sy; c.drawImage(STK.t, 0, 0, PW, PH, 0, 0, PW, PH); c.restore(); }
    if (rim > 0) for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; c.drawImage(STK.t, 0, 0, PW, PH, Math.cos(a) * rim, Math.sin(a) * rim, PW, PH); }
    c.drawImage(STK.c, 0, 0, PW, PH, 0, 0, PW, PH);
    c.restore();
  };
  C.photoSticker = function (img, x, y, w, o) {
    if (!img || !img.naturalWidth) return 0; o = o || {}; var h = w * img.naturalHeight / img.naturalWidth;
    C.sticker(x, y, w, h, function (g) { g.filter = o.filter || 'none'; g.drawImage(img, 0, 0, w, h); g.filter = 'none'; }, o); return h;
  };
  C.tornPrint = function (img, x, y, w, h, seed, o) {
    if (!img || !img.naturalWidth) return; o = o || {}; var c = C.ctx, b = o.border == null ? 14 : o.border;
    C.paperPiece(C.tornRect2(x, y, w, h, seed, 6), o.paperCol || '#f4ecd8', { sy: 10, blur: 18 });
    var inner = C.tornRect2(x + b, y + b, w - 2 * b, h - 2 * b, seed + 50, 3, o.tornInner || 'tb');
    c.save(); trace(c, inner); c.clip();
    var ir = img.naturalWidth / img.naturalHeight, r = (w - 2 * b) / (h - 2 * b), cw = ir > r ? (h - 2 * b) * ir : (w - 2 * b), ch = ir > r ? (h - 2 * b) : (w - 2 * b) / ir;
    var fx = o.focusX == null ? 0.5 : o.focusX, fy = o.focusY == null ? 0.5 : o.focusY;
    c.filter = o.filter || 'grayscale(1) contrast(1.15) brightness(1.04)';
    c.drawImage(img, x + b - (cw - (w - 2 * b)) * fx, y + b - (ch - (h - 2 * b)) * fy, cw, ch); c.filter = 'none';
    if (o.tint) { c.globalCompositeOperation = 'multiply'; c.fillStyle = o.tint; c.fillRect(x, y, w, h); c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha *= 0.14; c.fillStyle = c.createPattern(dotTile('#000', 6, 1.3), 'repeat'); c.fillRect(x, y, w, h);
    c.restore();
  };

  /* ---------- type and marks ---------- */
  var HEAVY = function (size) { return '800 ' + size + 'px ' + C.FONTS.label; };
  C.banner = function (text, x, y, o) {
    o = o || {}; var p = o.p == null ? 1 : o.p; if (p <= 0) return; var c = C.ctx, size = o.size || 84; text = String(text).toUpperCase();
    c.save(); c.translate(x, y); c.rotate(o.rot || 0); var k = (o.scale == null ? 1 : o.scale) * C.back(C.clamp(p)); c.scale(k, k);
    c.font = HEAVY(size); var tw = c.measureText(text).width, w = tw + size * 0.72, h = size * 1.3;
    C.paperPiece(C.tornRect2(-w / 2, -h / 2, w, h, o.seed || 7, 4, 'tb'), o.bg || '#fffdf7', { sy: 8 });
    c.fillStyle = o.fg || P.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, size * 0.06); c.restore();
  };
  // rubber stamp: slams down from 2.1×, worn ink. Start it ~0.12 s before the beat so it LANDS on the beat.
  C.inkStamp = function (text, x, y, p, o) {
    if (p <= 0) return; o = o || {}; var c = C.ctx, k = (o.k || 1) * C.lerp(2.1, 1, C.easeOut(C.clamp(p / 0.5))); text = String(text).toUpperCase();
    c.save(); c.translate(x, y); c.rotate(o.rot == null ? -0.12 : o.rot); c.scale(k, k); c.globalAlpha *= C.clamp(p * 4);
    var size = o.size || 64; c.font = HEAVY(size); var w = c.measureText(text).width + size * 0.62, h = size * 1.28, col = o.col || P.coral;
    c.strokeStyle = col; c.lineWidth = size * 0.085; c.strokeRect(-w / 2, -h / 2, w, h); c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, size * 0.05);
    var r = C.rand(o.seed || 3); c.fillStyle = o.bg || '#f4ecd8'; c.globalAlpha *= 0.55; for (var i = 0; i < 46; i++) { c.beginPath(); c.arc((r() - 0.5) * w, (r() - 0.5) * h, r() * 2.6 + 0.6, 0, 7); c.fill(); }
    c.restore();
  };
  C.tape = function (x, y, w, rot, o) {
    o = o || {}; var c = C.ctx, h = o.h || 34; c.save(); c.translate(x, y); c.rotate(rot || 0); c.globalAlpha *= 0.8;
    C.paperPiece(C.tornRect2(-w / 2, -h / 2, w, h, o.seed || 5, 3, 'lr'), o.col || '#ece0b4', { blur: 4, sx: 1, sy: 2, grain: 0.3 }); c.restore();
  };
  // highlighter swipe: multiply suits white paper; pass blend 'source-over' on saturated grounds
  C.highlight = function (x, y, w, h, p, col, blend) {
    if (p <= 0) return; var c = C.ctx; c.save(); c.fillStyle = col || 'rgba(239,181,43,.85)'; c.globalCompositeOperation = blend || 'multiply';
    trace(c, C.tornRect2(x, y, w * C.easeOut(p), h, 31, 2.5, 'lr')); c.fill(); c.restore();
  };
  C.markUnder = function (x0, x1, y, p, col, lw) {
    if (p <= 0) return; var c = C.ctx, xe = C.lerp(x0, x1, C.clamp(p)); c.save(); c.strokeStyle = col || '#b25f28'; c.lineWidth = lw || 8; c.lineCap = 'round';
    c.beginPath(); for (var i = 0; i <= 24; i++) { var xx = C.lerp(x0, xe, i / 24), yy = y + Math.sin(i * 0.9) * 2.5 + i / 24 * 4; if (i) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke(); c.restore();
  };
  // a hand-drawn marker ring that overshoots its start like a real pen. Saffron = key; red ONLY for falsehoods.
  C.markRing2 = function (x, y, rx, ry, p, o) {
    if (p <= 0) return; o = o || {}; var c = C.ctx, n = 56, end = Math.floor(n * 1.12 * C.clamp(p));
    c.save(); c.strokeStyle = o.col || '#d0702a'; c.lineWidth = o.w || 7; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    for (var i = 0; i <= end; i++) { var a = -2.4 + i / n * Math.PI * 2, wob = 1 + 0.05 * Math.sin(i * 0.7 + 1) + i / n * 0.07, xx = x + Math.cos(a) * rx * wob, yy = y + Math.sin(a) * ry * wob; if (i) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
    c.stroke(); c.restore();
  };

  /* ---------- accents that keep holds alive ---------- */
  C.sunburst = function (x, y, r0, r1, n, col, a, rot) {
    var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot || 0); c.globalAlpha *= a == null ? 1 : a; c.fillStyle = col;
    for (var i = 0; i < n; i++) { var a0 = i / n * Math.PI * 2, a1 = a0 + Math.PI / n * 0.9; c.beginPath(); c.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0); c.lineTo(Math.cos(a0) * r1, Math.sin(a0) * r1); c.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1); c.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0); c.fill(); }
    c.restore();
  };
  C.zigzag = function (x0, y, x1, amp, col, w, step) {
    var c = C.ctx; step = step || 26; c.save(); c.strokeStyle = col; c.lineWidth = w || 7; c.lineJoin = 'miter'; c.beginPath(); c.moveTo(x0, y);
    for (var x = x0, i = 0; x <= x1; x += step / 2, i++) c.lineTo(x, y + (i % 2 ? -amp : amp)); c.stroke(); c.restore();
  };
  C.confetti = function (seed, t, col, n, area) {
    var c = C.ctx, r = C.rand(seed); area = area || [0, 0, 1920, 940]; n = n || 14;
    for (var i = 0; i < n; i++) { var x = area[0] + r() * area[2], y = area[1] + r() * area[3], s = 10 + r() * 22, ph = r() * 6, kind = r();
      c.save(); c.translate(x + Math.sin(t * 0.8 + ph) * 12, y + Math.cos(t * 0.6 + ph) * 9); c.rotate(t * 0.4 + ph); c.fillStyle = col; c.globalAlpha *= 0.55;
      if (kind < 0.4) { c.beginPath(); c.arc(0, 0, s * 0.5, 0, 7); c.fill(); } else if (kind < 0.75) { c.beginPath(); c.moveTo(0, -s * 0.6); c.lineTo(s * 0.55, s * 0.45); c.lineTo(-s * 0.55, s * 0.45); c.fill(); } else c.fillRect(-s * 0.5, -s * 0.14, s, s * 0.28);
      c.restore(); }
  };

  /* ---------- motion ---------- */
  // four-beat take (School of Motion / Warner): ease into the anticipation and HOLD it, POP to the accent in ~1 frame,
  // then ease into the settle — the pose the audience reads. mix(antic, accent, settle) blends a value through it.
  C.beats = function (lt, tA0, tA1, tP, tS) {
    var A = C.ease(C.prog(lt, tA0, tA1)), Pp = C.prog(lt, tP, tP + 0.04), S = C.ease(C.prog(lt, tP + 0.04, tS));
    return { A: A, P: Pp, S: S, shut: A > 0.6 && Pp === 0, phase: Pp <= 0 ? (A > 0 ? 'antic' : 'start') : (S >= 1 ? 'settled' : 'settle'),
      mix: function (a, cc, s) { return Pp < 1 ? C.lerp(C.lerp(0, a, A), cc, Pp) : C.lerp(cc, s, S); },
      mix3: function (z, a, cc, s) { return Pp < 1 ? C.lerp(C.lerp(z, a, A), cc, Pp) : C.lerp(cc, s, S); } };
  };
  // follow-through: sample a body parameter a few frames back so loose parts (braid, dupatta, pallu) trail and rebound
  C.lag = function (f, t, k) { return (k == null ? 1 : k) * ((f(t - 0.05) - f(t)) - 0.45 * (f(t - 0.11) - f(t - 0.05))); };
  C.popIn = function (x, y, p, fn) { if (p <= 0) return; var c = C.ctx, s = C.back(p); c.save(); c.translate(x, y); c.scale(s, s); c.translate(-x, -y); fn(); c.restore(); };
  // motion trails: fn(tt) draws the object at time tt; ghost copies at t−0.05 and t−0.1
  C.trail = function (fn, t, alphas) {
    var c = C.ctx; alphas = alphas || [0.18, 0.38];
    c.save(); c.globalAlpha *= alphas[0]; fn(t - 0.1); c.restore(); c.save(); c.globalAlpha *= alphas[1]; fn(t - 0.05); c.restore(); fn(t);
  };
  C.sweatDrop = function (x, y, p, k) {
    if (p <= 0) return; var c = C.ctx; k = k || 1; c.save(); c.globalAlpha *= C.clamp(p * 3); c.translate(x, y + C.easeOut(p) * 26 * k); c.scale(k, k);
    c.fillStyle = '#9fc8ec'; c.strokeStyle = '#4a78a8'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -24); c.quadraticCurveTo(15, 0, 0, 14); c.quadraticCurveTo(-15, 0, 0, -24); c.fill(); c.stroke(); c.restore();
  };
  // counting dynamic scale: a number's type grows as it climbs
  C.countScale = function (n, n0, n1, k0, k1) { return C.lerp(k0 == null ? 1 : k0, k1 == null ? 1.45 : k1, C.clamp((n - n0) / Math.max(1, n1 - n0))); };
  // velocity-matched push-through: draw fn into a layer, composite it zoomed about the frame centre with a blur
  var FX = null;
  C.pushFx = function (zk, blur, fn) {
    if (zk === 1 && blur <= 0.5) return fn();
    if (!FX) FX = mk(1920, 1080);
    var main = C.ctx, m = main.getTransform ? main.getTransform() : null, g = FX.getContext('2d');
    if (FX.width !== main.canvas.width || FX.height !== main.canvas.height) { FX.width = main.canvas.width; FX.height = main.canvas.height; }
    g.setTransform(m || new DOMMatrix()); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, FX.width, FX.height); g.restore();
    C.ctx = g; try { fn(); } finally { C.ctx = main; }
    main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.filter = blur > 0.5 ? 'blur(' + blur.toFixed(1) + 'px)' : 'none';
    main.translate(FX.width / 2, FX.height / 2); main.scale(zk, zk); main.translate(-FX.width / 2, -FX.height / 2); main.drawImage(FX, 0, 0); main.restore();
  };

  /* ---------- photos (CC BY, credits in assets/web/CREDITS.md) ---------- */
  var PHOTOS = { 'fc-road': 'assets/web/fc-road-crossword-1000.jpg', 'pune-night': 'assets/web/pune-night-1000.jpg',
    'auto-rickshaw': 'assets/web/cut/auto-rickshaw-700.png', 'sewing-wheel': 'assets/web/street-tailor-1-800.jpg' };
  var IMGS = {};
  C.PHOTOS = PHOTOS;
  C.IMG = function (name) { var im = IMGS[name]; return im && im.complete && im.naturalWidth ? im : null; };
  C.loadPhotos = function () {
    return Promise.all(Object.keys(PHOTOS).map(function (k) {
      return new Promise(function (res) { var im = new Image(); im.onload = function () { res(); }; im.onerror = function () { console.warn('photo missing: ' + PHOTOS[k]); res(); }; im.src = PHOTOS[k]; IMGS[k] = im; });
    }));
  };
})(typeof window !== 'undefined' ? window : globalThis);
