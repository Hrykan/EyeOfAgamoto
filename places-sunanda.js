/* places-sunanda.js — PLACES.office: Sunanda's office, 2034, night (animotion v3). Varies by road.ending (trusted / lean / smaller / empty).
   Four shots on the 96 bpm grid (10 beats = 6.25 s): wide establishing → push-in to the key thing → big-face take → pull-out / cutaway.
   Look: a flat teal cardboard ground per shot, torn cut-outs with white scissor rims at three parallax depths, a banner, ink stamps,
   numbers as things that spring in. Sunanda is always CAST.draw. Pure function of (t, road): no Math.random, no Date, no state. */
(function (root) {
  'use strict';
  var PLACES = root.PLACES = root.PLACES || {};
  var P = C.PALETTE, PI = Math.PI, BEAT = C.BEAT, DUR = 10 * BEAT;                   // 6.25 s
  function B(n) { return n * BEAT; }
  var K = {
    wallD: '#0c2a34', wall: '#12404c', wallL: '#1a5361', dado: '#0a232c', wood: '#7a4c2c', woodD: '#4a2c1a', woodL: '#a06a3e',
    amber: '#f4b860', amberL: '#ffd99a', cream: '#f4ead7', paper: '#efe3c8', ink: '#1f1b18', rust: '#a8482a', sage: '#5f8070',
    maroon: '#8c2a2a', cyan: '#8fd8ff', teal: '#2f7f7a', tealD: '#1d5552', mustard: '#d9a933', saffron: '#e0863e'
  };
  var RIM = '#f3ead6';
  var SEAT = { x: 1180, y: 712, h: 540 };                    // Sunanda seated at her desk, facing left
  var DESKTOP = 690, LAMPX = 880;
  var CLOCK = { x: 1128, y: 190, r: 58 };
  var WIN = { x: 80, y: 130, w: 400, h: 430 };
  var BOARD = { x: 1290, y: 400 }, DOORS = [640, 980];       // corridor

  /* ---------- small helpers ---------- */
  function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, f) { return a + (b - a) * f; }
  function sm(t, a, b) { return C.ease(C.prog(t, a, b)); }
  function lin(t, a, b) { return C.prog(t, a, b); }
  function step(t, kf) { var v = kf[0][1]; for (var i = 0; i < kf.length; i++) if (t >= kf[i][0]) v = kf[i][1]; return v; }
  function ramp(t, kf) { if (t <= kf[0][0]) return kf[0][1]; for (var i = 0; i < kf.length - 1; i++) if (t < kf[i + 1][0]) return mix(kf[i][1], kf[i + 1][1], C.ease((t - kf[i][0]) / (kf[i + 1][0] - kf[i][0]))); return kf[kf.length - 1][1]; }
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mixHex(a, b, f) { var A = hexRgb(a), B2 = hexRgb(b); return 'rgb(' + Math.round(mix(A[0], B2[0], f)) + ',' + Math.round(mix(A[1], B2[1], f)) + ',' + Math.round(mix(A[2], B2[2], f)) + ')'; }
  function endOf(road) { var e = road && (road.ending || (road.endingInfo && road.endingInfo.id)); return e === 'trusted' || e === 'lean' || e === 'empty' ? e : 'smaller'; }
  function txt(s, x, y, size, col, align, weight) { C.label(s, x, y, size, col, align, weight); }
  function ntxt(c, s, x, y, size, col, weight, align) { c.save(); c.font = (weight || 500) + ' ' + size + 'px ' + C.FONTS.label; c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); c.restore(); }
  function serif(c, s, x, y, size, col, align) { c.save(); c.font = 'italic ' + size + 'px ' + C.FONTS.serif; c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); c.restore(); }
  function lcam(cam, k) { return { x: 960 + (cam.x - 960) * k, y: 540 + (cam.y - 540) * k, z: 1 + (cam.z - 1) * k }; }
  function layer(cam, k, fn) { C.withCam(lcam(cam, k), fn); }
  function pc(x, y, w, h, fn, o) { C.sticker(x, y, w, h, function (g) { g.translate(-x, -y); fn(g); }, Object.assign({ rim: RIM, rimW: 6 }, o || {})); }
  function sheet(x, y, w, h, seed, fill, o) { C.paperPiece(C.tornRect2(x, y, w, h, seed, 6), fill, Object.assign({ dots: '#000', dotA: 0.1, grain: 0.22 }, o || {})); }
  function shotAt(t, shots) { for (var i = 0; i < shots.length; i++) if (t < shots[i].b) return shots[i]; return shots[shots.length - 1]; }
  function cnt(t, a, b, n) { return Math.round(n * C.easeOut(C.prog(t, a, b))); }
  function fmtINR(f) { return '₹' + (Math.round(f / 500) * 500).toLocaleString('en-IN'); }

  /* two-link arm solver: [shoulder, elbow] so the hand of figure f (x, y, h, pose, flip, lean) reaches world point (tx, ty) */
  var L1 = 15.5, L2 = 14.5;
  function reach(f, tx, ty, far) {
    var s = f.h / 100, b = f.b || 1.03, fl = f.flip ? -1 : 1, hipY = f.pose === 'sit' ? 0 : -44, lean = f.lean || 0;
    var ux = (tx - f.x) / s * fl, uy = (ty - f.y) / s, dx = ux, dy = uy - hipY, cs = Math.cos(-lean), sn = Math.sin(-lean);
    var bx = dx * cs - dy * sn, by = hipY + dx * sn + dy * cs;
    var sx = (far ? -11 : 11) * b, sy = hipY - 28 + 1.5, vx = bx - sx, vy = by - sy, d = Math.hypot(vx, vy), dmax = L1 + L2 - 0.4;
    if (d > dmax) { vx *= dmax / d; vy *= dmax / d; d = dmax; }
    if (d < 7) { vx *= 7 / Math.max(d, 1e-3); vy *= 7 / Math.max(d, 1e-3); d = 7; }
    var th = Math.atan2(vx, vy), dl = Math.acos(cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), s1 = th - dl;
    var ex = sx + Math.sin(s1) * L1, ey = sy + Math.cos(s1) * L1, s2 = Math.atan2(sx + vx - ex, sy + vy - ey);
    return [s1, s2 - s1];
  }
  function actor(c, f, o) { // Sunanda with hands aimed: o.R / o.L = [x, y] world targets
    var oo = Object.assign({ pose: f.pose || 'stand', flip: !!f.flip, lean: f.lean || 0, t: f.t }, o);
    var ff = { x: f.x, y: f.y, h: f.h, pose: oo.pose, flip: oo.flip, lean: oo.lean };
    if (o.R) oo.armR = reach(ff, o.R[0], o.R[1], false);
    if (o.L) oo.armL = reach(ff, o.L[0], o.L[1], true);
    return CAST.draw(c, 'sunanda', f.x, f.y, f.h, oo);
  }

  /* ---------- narration (scenes.js style) ---------- */
  function cap(c, text, t, a, b) {
    if (t < a || t > b) return;
    var plain = text.replace(/\*/g, ''); c.save(); c.font = 'italic 54px ' + C.FONTS.serif; var w = c.measureText(plain).width; c.restore();
    var size = Math.min(54, Math.floor(54 * 1640 / Math.max(w + 70, 1)));
    c.save(); c.globalAlpha *= cl((t - a) / 0.05, 0, 1) * cl((b - t) / 0.45, 0, 1);
    C.caption(text, [], C.prog(t, a, a + Math.max(1, (b - a) * 0.55)), 880, { size: size, seed: 11 + (a * 7 | 0) }); c.restore();
  }

  /* ================= CUT-OUT SET PIECES (absolute world coordinates, drawn inside a sticker) ================= */

  // torn print of the Pune night photo, with a procedural skyline when the photo is missing
  function windowGlass(c, t) {
    var x = WIN.x, y = WIN.y, w = WIN.w, h = WIN.h, i, r, img = C.IMG('pune-night');
    if (img) {
      C.tornPrint(img, x - 14, y - 14, w + 28, h + 28, 5, { filter: 'saturate(1.12) contrast(1.05) brightness(0.95)', border: 12, focusX: 0.52 + 0.03 * Math.sin(t * 0.4), focusY: 0.55, paperCol: '#efe3c8', tint: 'rgba(40,110,130,0.30)' });
    } else {
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#061625'); g.addColorStop(0.5, '#0e3550'); g.addColorStop(1, '#2d8089'); c.fillStyle = g; c.fillRect(x, y, w, h);
      r = C.rand(5); for (i = 0; i < 30; i++) { var sx = x + r() * w, sy = y + r() * h * 0.55, tw = 0.5 + 0.5 * Math.sin(t * 2.1 + i * 1.7); c.globalAlpha = 0.2 + 0.5 * tw; c.fillStyle = '#e8f4ff'; c.fillRect(sx, sy, 2.5, 2.5); } c.globalAlpha = 1;
      function layerB(seed, base, hmin, hmax, wmin, wmax, col, lit, pw) { var rr = C.rand(seed), bx = x - 20; while (bx < x + w + 20) { var bw = wmin + rr() * (wmax - wmin), bh = hmin + rr() * (hmax - hmin), by = y + base - bh; c.fillStyle = col; c.fillRect(bx, by, bw, y + h - by);
        for (var wy = by + 14; wy < y + h - 20; wy += 22) for (var wx = bx + 8; wx < bx + bw - 10; wx += 17) { if (rr() < lit) { c.fillStyle = 'rgba(255,205,125,0.9)'; c.fillRect(wx, wy, pw, pw + 2); } } bx += bw + 2 + rr() * 6; } }
      layerB(31, h * 0.78, 90, 190, 46, 82, '#12384d', 0.18, 6); layerB(47, h * 0.97, 70, 150, 54, 96, '#0a2433', 0.3, 7);
      c.restore();
    }
    // iron grille over the glass
    c.fillStyle = 'rgba(11,19,24,0.92)'; for (i = 0; i < 9; i++) c.fillRect(x + 20 + i * 44, y, 5, h); c.fillRect(x, y + h * 0.36, w, 5); c.fillRect(x, y + h * 0.74, w, 5);
    // the blinking mobile-tower lamp, the one thing that moves in the print
    c.fillStyle = Math.sin(t * 3.6) > 0.2 ? '#ff6f4a' : 'rgba(255,111,74,0.25)'; c.beginPath(); c.arc(x + w * 0.74, y + h * 0.3, 5, 0, 7); c.fill();
  }
  function windowPiece(c, t) {
    C.rect(WIN.x - 30, WIN.y - 30, WIN.w + 60, WIN.h + 60, K.woodD, 301, { rough: 4, shadow: false });
    windowGlass(c, t);
    // sill + a money-plant in a bottle
    C.rect(WIN.x - 40, WIN.y + WIN.h + 14, WIN.w + 80, 24, K.wood, 302, { rough: 2, shadow: false });
    var bx = WIN.x + 70, by = WIN.y + WIN.h, i; c.fillStyle = 'rgba(150,215,225,0.7)'; c.beginPath(); c.moveTo(bx - 14, by + 14); c.lineTo(bx - 16, by - 46); c.lineTo(bx - 6, by - 62); c.lineTo(bx + 6, by - 62); c.lineTo(bx + 16, by - 46); c.lineTo(bx + 14, by + 14); c.closePath(); c.fill();
    for (i = 0; i < 7; i++) { var sw = Math.sin(C.T12(t) * 1.3 + i) * 3; c.fillStyle = i % 2 ? '#3f9a62' : '#2e7c4c'; c.save(); c.translate(bx - 8 + i * 4 + sw, by - 64 - i * 10); c.rotate(-0.6 + i * 0.22 + sw * 0.02); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14, -10, 24, 2); c.quadraticCurveTo(12, 12, 0, 0); c.fill(); c.restore(); }
    // curtain on the right edge
    var sw2 = Math.sin(C.T12(t) * 0.7) * 2; C.paper(C.torn(WIN.x + WIN.w + 8 + sw2, WIN.y - 56, 104, WIN.h + 150, 311, 5), K.maroon, { halftone: 0.5, dot: 'rgba(0,0,0,0.22)', shadow: false });
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 3; for (i = 1; i < 5; i++) { c.beginPath(); c.moveTo(WIN.x + WIN.w + 8 + i * 20 + sw2, WIN.y - 40); c.lineTo(WIN.x + WIN.w + 12 + i * 20 + sw2, WIN.y + WIN.h + 80); c.stroke(); }
  }
  function clockPiece(c, t, hr, mn) {
    var x = CLOCK.x, y = CLOCK.y, r = CLOCK.r;
    c.fillStyle = K.woodD; c.beginPath(); c.arc(x, y, r + 9, 0, 7); c.fill(); c.fillStyle = '#efe5cd'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = K.ink; c.lineWidth = 3; for (var i = 0; i < 12; i++) { var a = i * PI / 6; c.beginPath(); c.moveTo(x + Math.sin(a) * (r - 6), y - Math.cos(a) * (r - 6)); c.lineTo(x + Math.sin(a) * (r - (i % 3 ? 11 : 16)), y - Math.cos(a) * (r - (i % 3 ? 11 : 16))); c.stroke(); }
    var ha = (hr % 12 + mn / 60) * PI / 6, ma = mn * PI / 30, sa = Math.floor(t * 1) * PI / 30 * 1;   // second hand ticks once a second
    c.lineCap = 'round'; c.strokeStyle = K.ink; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ha) * (r * 0.5), y - Math.cos(ha) * (r * 0.5)); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ma) * (r * 0.78), y - Math.cos(ma) * (r * 0.78)); c.stroke();
    c.strokeStyle = K.rust; c.lineWidth = 2; c.beginPath(); c.moveTo(x - Math.sin(sa * 6) * 10, y + Math.cos(sa * 6) * 10); c.lineTo(x + Math.sin(sa * 6) * (r * 0.86), y - Math.cos(sa * 6) * (r * 0.86)); c.stroke();
    c.fillStyle = K.rust; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill();
  }
  function framePiece(c, x, y, w, h, drawIn, seed) {
    C.rect(x - 14, y - 14, w + 28, h + 28, K.woodL, seed, { rough: 2.5, shadow: false });
    C.rect(x - 4, y - 4, w + 8, h + 8, K.cream, seed + 1, { rough: 1.5, shadow: false });
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); drawIn(x, y, w, h); c.restore();
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); var gg = c.createLinearGradient(x, y, x + w, y + h); gg.addColorStop(0, 'rgba(255,255,255,0.20)'); gg.addColorStop(0.35, 'rgba(255,255,255,0.03)'); gg.addColorStop(0.5, 'rgba(255,255,255,0)'); gg.addColorStop(1, 'rgba(255,255,255,0.07)'); c.fillStyle = gg; c.fillRect(x, y, w, h); c.restore();
  }
  function sepia(c, x, y, w, h) {
    c.fillStyle = 'rgba(122,84,44,0.52)'; c.fillRect(x, y, w, h);
    var gr = c.createRadialGradient(x + w / 2, y + h / 2, h * 0.3, x + w / 2, y + h / 2, h * 0.9); gr.addColorStop(0, 'rgba(60,34,12,0)'); gr.addColorStop(1, 'rgba(60,34,12,0.5)'); c.fillStyle = gr; c.fillRect(x, y, w, h);
  }
  // the 2009 first-batch photograph: Sunanda in the middle of her first fourteen students (sepia)
  function photo2009(c, x, y, w, h) {
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#d8c39d'); g.addColorStop(1, '#b49366'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#6b6a58'; c.fillRect(x + w * 0.08, y + h * 0.08, w * 0.4, h * 0.34); c.fillStyle = '#e8dcc0'; c.fillRect(x + w * 0.56, y + h * 0.1, w * 0.3, h * 0.3);
    c.fillStyle = '#8a7a58'; c.fillRect(x + w * 0.7, y + h * 0.1, 3, h * 0.3); c.fillRect(x + w * 0.56, y + h * 0.24, w * 0.3, 3);
    var back = [6, 11, 3, 0, 14, 8, 2], i, hb = h * 0.8, hf = h * 0.74;
    for (i = 0; i < 7; i++) { var bx = x + w * (0.12 + i * 0.127), who = i === 3 ? 'sunanda' : 'extra:' + (back[i] + 40); CAST.draw(c, who, bx, y + h * 0.9, hb * (i === 3 ? 1.04 : 1), { pose: 'stand', face: i % 2 ? 'smile' : 'neutral', t: 0.3 + i, blink: false, flip: i > 3 }); }
    for (i = 0; i < 6; i++) { var fx = x + w * (0.16 + i * 0.136); CAST.draw(c, 'extra:' + (i * 5 + 7), fx, y + h * 1.0, hf, { pose: 'sit', face: i % 3 ? 'smile' : 'grin', t: 1 + i, blink: false, flip: i % 2 === 0 }); }
    sepia(c, x, y, w, h);
  }
  // the faculty photo of 2026: faces drop out one by one (tg = time the fading runs from)
  function staffPhoto(c, x, y, w, h, kept, t, tg) {
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#cfd3c6'); g.addColorStop(1, '#a8aea0'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(70,90,80,0.35)'; c.fillRect(x, y + h * 0.58, w, h * 0.42); c.fillStyle = 'rgba(60,80,70,0.25)'; c.fillRect(x + w * 0.05, y + h * 0.1, w * 0.38, h * 0.26);
    var fh = h * 0.64, row, i, rk = C.rand(77);
    for (row = 0; row < 2; row++) for (i = 0; i < 10; i++) {
      var k = row * 10 + i, here = kept.indexOf(k) >= 0, bx = x + w * (0.07 + i * 0.095 + (row ? 0.045 : 0)), by = y + h * (row ? 1.02 : 0.76), t0 = tg + rk() * 0.5;
      var a = here ? 1 : 0.14 + 0.86 * (1 - C.ease(C.prog(t, t0, t0 + 0.3)));
      CAST.draw(c, k === 14 ? 'sunanda' : 'extra:' + (k + 70), bx, by, fh * (row ? 1.08 : 1), { pose: 'stand', face: 'neutral', t: 0.4 + k, blink: false, alpha: a, flip: i > 4 });
    }
    c.fillStyle = 'rgba(210,214,200,0.20)'; c.fillRect(x, y, w, h);
  }
  // mentor portraits spring in (stagger capped at 0.5 s for the whole wall)
  function mentorWall(c, t, x, y, w, h, t0) {
    C.paperPiece(C.tornRect2(x, y, w, h, 421, 3), '#e7d9b9', { dots: '#3c280a', dotA: 0.12, shadow: false });
    C.paperPiece(C.tornRect2(x + 20, y - 20, 240, 44, 422, 2), K.rust, { shadow: false }); txt('Our mentors', x + 140, y + 2, 30, K.cream, 'center', 800);
    var cols = 6, rows = 3, pw = 74, ph = 88, gx = (w - 40 - cols * pw) / (cols - 1), gy = (h - 62 - rows * ph) / (rows - 1), bgs = ['#d98c6b', '#7fb3b0', '#e6c26a', '#9aa9d0', '#b9d2a0', '#e2a8b5'], i, j;
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
      var k = j * cols + i, px = x + 20 + i * (pw + gx), py = y + 52 + j * (ph + gy), who = k === 0 ? 'meera' : k === 17 ? 'aarav' : 'extra:' + (k + 20), p = C.prog(t, t0 + k * 0.027, t0 + k * 0.027 + 0.22);
      if (p <= 0) continue;
      C.popIn(px + pw / 2, py + ph / 2, p, function () {
        c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip(); c.fillStyle = bgs[(k * 5) % 6]; c.fillRect(px, py, pw, ph);
        var s = 2.5; CAST.draw(c, who, px + pw / 2 - 3.5, py + 34 + 88 * s, 100 * s, { pose: 'stand', face: k % 3 === 0 ? 'smile' : 'neutral', t: k, blink: false }); c.restore();
        c.strokeStyle = '#fbf5e8'; c.lineWidth = 4; c.strokeRect(px, py, pw, ph); c.fillStyle = 'rgba(31,27,24,0.55)'; c.fillRect(px + 8, py + ph + 4, pw - 16 - (k % 3) * 8, 3);
        if (k === 17) { C.paperPiece(C.tornRect2(px + pw - 28, py - 8, 40, 20, 430, 1), K.amber, { shadow: false }); txt('new', px + pw - 8, py + 2, 14, K.ink, 'center', 800); }
      });
    }
  }
  var BATCH = ['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A', '12-B', 'JEE', 'NEET', 'FOUND.', '6 AM'];
  var BLANK = { smaller: [1, 2, 5, 7, 8, 11], empty: [0, 1, 2, 3, 6, 9, 10] };
  // the batch cards are countable objects: they spring in, and the blank ones peel off (tOff = time the emptying starts)
  function blankFor(E, road) { // empty: the wall empties in step with the 2034 student count (third-floor row first)
    if (E !== 'empty' || !road) return BLANK[E] || [];
    var n = cl(Math.round(12 * (1 - Agamoto.at(road, 2034).students / Agamoto.at(road, 2026).students)), 4, 8);
    return [0, 1, 2, 3, 6, 9, 10, 5, 7].slice(0, n);
  }
  function chartPiece(c, t, E, x, y, w, h, t0, tOff, blank0) {
    var blank = blank0 || BLANK[E] || [];
    C.paperPiece(C.tornRect2(x, y, w, h, 401, 4), '#8c6340', { dots: '#280e04', dotA: 0.22, shadow: false });
    C.paperPiece(C.tornRect2(x + 20, y - 20, 330, 48, 402, 2), K.cream, { shadow: false }); txt('Batches · 2034–35', x + 185, y + 3, 28, K.ink, 'center', 800);
    var rows = 3, cols = 4, pad = 20, top = 52, gx = 14, gy = 12, cw = (w - pad * 2 - (cols - 1) * gx) / cols, ch = (h - top - pad - (rows - 1) * gy) / rows, cc = [P.teal, P.mustard, P.coral, '#4b6fa8'], i, j;
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
      var k = j * cols + i, cx = x + pad + i * (cw + gx), cy = y + top + j * (ch + gy), isB = blank.indexOf(k) >= 0, bi = blank.indexOf(k);
      var pin = C.prog(t, t0 + k * 0.03, t0 + k * 0.03 + 0.22), off = isB && tOff != null ? C.prog(t, tOff + bi * 0.07, tOff + bi * 0.07 + 0.28) : (isB ? 1 : 0);
      c.save(); c.strokeStyle = 'rgba(244,234,215,0.42)'; c.lineWidth = 3; c.setLineDash([9, 7]); c.strokeRect(cx, cy, cw, ch); c.setLineDash([]); c.restore();   // the empty slot is always there
      if (pin > 0 && off < 1) {
        c.save(); var fall = C.easeIn(off); c.translate(cx + cw / 2, cy + ch / 2 + fall * 90); c.rotate(fall * (0.5 + (k % 3) * 0.2) * (k % 2 ? 1 : -1)); c.globalAlpha *= 1 - fall; c.translate(-(cx + cw / 2), -(cy + ch / 2));
        C.popIn(cx + cw / 2, cy + ch / 2, pin, function () {
          C.paperPiece(C.tornRect2(cx, cy, cw, ch, 410 + k, 1.5), E === 'empty' && k === 11 ? P.coral : cc[(k + (k >> 2)) % 4], { dots: '#000', dotA: 0.15, shadow: false });
          txt(BATCH[k], cx + 10, cy + 17, 20, K.cream, 'left', 800);
          c.fillStyle = 'rgba(251,245,232,0.9)'; var dots = E === 'empty' && k === 11 ? 3 : 10; for (var d = 0; d < dots; d++) { c.beginPath(); c.arc(cx + 14 + (d % 5) * 15, cy + ch - 28 + Math.floor(d / 5) * 15, 4.4, 0, 7); c.fill(); }
          if (E === 'trusted' && k % 3 === 1) { C.paperPiece(C.tornRect2(cx + cw - 52, cy + ch - 24, 56, 26, 450 + k, 1), K.cream, { shadow: false }); txt('wait ' + (28 + k * 3), cx + cw - 24, cy + ch - 11, 15, K.rust, 'center', 800); }
        });
        c.restore();
      }
      c.fillStyle = '#d2392d'; c.beginPath(); c.arc(cx + cw / 2, cy + 3, 5, 0, 7); c.fill();
    }
  }
  // the dashboard on the wall (lean): tiles, a line chart, and a grid of fifty room-chairs that fill up
  function screenPiece(c, t, road, x, y, w, h, t0) {
    var v = Agamoto.at(road, 2034), i, k = C.T12(t);
    C.paperPiece(C.tornRect2(x - 16, y - 16, w + 32, h + 32, 431, 3), '#0a0f14', { shadow: false, grain: 0.1 });
    c.fillStyle = '#071820'; c.fillRect(x, y, w, h);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    txt('Vidya · live', x + 20, y + 24, 24, K.cyan, 'left', 800); txt('Mon 10:20 pm', x + w - 20, y + 24, 20, 'rgba(143,216,255,0.7)', 'right', 600);
    var tiles = [['Students', Math.round(v.students), '#47d18c', 0], ['Teachers', Math.round(v.teachers), '#f4b860', 1], ['Fees', Math.round(v.fees), '#f4b860', 2], ['Rooms full', 98, K.cyan, 3]], tw = (w - 40 - 3 * 12) / 4;
    for (i = 0; i < 4; i++) {
      var tx = x + 20 + i * (tw + 12), p = C.prog(t, t0 + i * 0.08, t0 + i * 0.08 + 0.22), val = tiles[i][3] === 2 ? fmtINR(tiles[i][1]) : tiles[i][3] === 3 ? Math.round(98 * C.easeOut(C.prog(t, t0 + 0.1, t0 + 0.7))) + '%' : Math.round(tiles[i][1] * C.easeOut(C.prog(t, t0 + 0.1, t0 + 0.8))).toLocaleString('en-IN');
      if (p <= 0) continue;
      C.popIn(tx + tw / 2, y + 85, p, function () { c.fillStyle = 'rgba(143,216,255,0.10)'; c.fillRect(tx, y + 48, tw, 74); txt(tiles[i][0], tx + 10, y + 66, 17, 'rgba(244,234,215,0.7)', 'left', 600); txt(val, tx + 10, y + 98, 38, tiles[i][2], 'left', 800); });
    }
    // line chart (left) draws on
    var pr = C.prog(t, t0 + 0.2, t0 + 1.2), cx0 = x + 20, cy0 = y + 146, cw = w * 0.48, chh = h - 166;
    c.strokeStyle = 'rgba(143,216,255,0.15)'; c.lineWidth = 1; for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(cx0, cy0 + i * chh / 3); c.lineTo(cx0 + cw, cy0 + i * chh / 3); c.stroke(); }
    function curve(f, col) { c.strokeStyle = col; c.lineWidth = 4; c.lineJoin = 'round'; c.beginPath(); for (var q = 0; q <= 60 * pr; q++) { var u = q / 60, px = cx0 + u * cw, py = cy0 + chh * (1 - f(u)); if (q === 0) c.moveTo(px, py); else c.lineTo(px, py); } c.stroke(); }
    curve(function (u) { return 0.2 + 0.65 * u + 0.03 * Math.sin(u * 14 + k * 0.9); }, '#47d18c'); curve(function (u) { return 0.75 - 0.45 * u + 0.025 * Math.sin(u * 11 + 2 + k * 0.7); }, '#f4b860');
    // fifty chairs: 49 fill in
    var gx0 = x + w * 0.56, gy0 = y + 150, n;
    txt('Rooms', gx0, gy0 - 8, 16, 'rgba(244,234,215,0.6)', 'left', 600);
    for (n = 0; n < 50; n++) {
      var p2 = C.prog(t, t0 + 0.2 + n * 0.009, t0 + 0.2 + n * 0.009 + 0.2), col2 = n === 37 ? 'rgba(143,216,255,0.15)' : '#8fd8ff', ccx = gx0 + (n % 10) * 31 + 12, ccy = gy0 + 12 + Math.floor(n / 10) * 24;
      if (p2 > 0) C.popIn(ccx, ccy, p2, function () { c.fillStyle = col2; c.fillRect(ccx - 9, ccy - 8, 18, 12); c.fillRect(ccx - 9, ccy - 14, 18, 4); c.fillRect(ccx - 7, ccy + 4, 3, 6); c.fillRect(ccx + 4, ccy + 4, 3, 6); });
    }
    c.restore();
  }

  /* ---------- desk, lamp, chair, props ---------- */
  function deskPiece(c) {
    C.paperPiece(C.tornRect2(300, DESKTOP + 18, 840, 215, 371, 3), K.wood, { dots: '#1e0c04', dotA: 0.2, shadow: false });
    for (var i = 0; i < 3; i++) { var dx = 345 + i * 265, dh = 58 + (i === 2 ? 70 : 0); C.paperPiece(C.tornRect2(dx, DESKTOP + 40, 240, dh, 375 + i, 2), K.woodL, { dots: '#1e0c04', dotA: 0.15, shadow: false, blur: 6 });
      c.fillStyle = '#d6b66a'; c.beginPath(); c.arc(dx + 120, DESKTOP + 40 + dh / 2, 7, 0, 7); c.fill(); }
    C.paperPiece(C.tornRect2(280, DESKTOP - 2, 870, 26, 372, 2), K.woodL, { dots: '#1e0c04', dotA: 0.1, shadow: false });
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(290, DESKTOP, 850, 4);
  }
  function chairPiece(c, cx) {
    var x = cx == null ? SEAT.x : cx, y = SEAT.y;
    c.fillStyle = '#16181a'; c.fillRect(x - 9, y + 52, 18, 108); c.beginPath(); c.moveTo(x - 110, y + 168); c.lineTo(x + 100, y + 168); c.lineTo(x + 70, y + 152); c.lineTo(x - 80, y + 152); c.closePath(); c.fill();
    c.fillStyle = '#0c0d0e'; [-100, -40, 40, 92].forEach(function (dx) { c.beginPath(); c.arc(x + dx, y + 176, 9, 0, 7); c.fill(); });
    C.paperPiece(C.tornRect2(x - 150, y + 14, 270, 42, 361, 3), '#5b2127', { dots: '#000', dotA: 0.22, shadow: false });
    C.paperPiece(C.tornRect2(x + 55, y - 330, 62, 350, 362, 4), '#6a272d', { dots: '#000', dotA: 0.22, shadow: false });
    c.fillStyle = '#16181a'; c.fillRect(x + 72, y - 10, 12, 50);
  }
  function lampGeom() { var x = LAMPX, y = DESKTOP; return { x: x, y: y, joint: [x - 6, y - 170], head: [x + 68, y - 250], open: [x + 138, y - 154], rim: [x + 86, y - 118] }; }
  function lampPiece(c, t, on, pull) {
    var g = lampGeom(), x = g.x, y = g.y;
    c.lineCap = 'round'; c.fillStyle = '#b08a3a'; c.beginPath(); c.ellipse(x, y - 6, 52, 11, 0, 0, 7); c.fill(); c.fillStyle = '#8a6a28'; c.fillRect(x - 52, y - 6, 104, 7);
    c.strokeStyle = '#b89a48'; c.lineWidth = 9; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(g.joint[0], g.joint[1]); c.lineTo(g.head[0], g.head[1]); c.stroke();
    c.fillStyle = '#d6b66a'; c.beginPath(); c.arc(g.joint[0], g.joint[1], 11, 0, 7); c.fill();
    c.save(); c.translate(g.head[0], g.head[1]); c.rotate(-0.55);
    c.fillStyle = on > 0.5 ? '#e0b650' : '#6f5a2a'; c.beginPath(); c.moveTo(-18, -4); c.lineTo(18, -4); c.lineTo(62, 118); c.lineTo(-62, 118); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.16)'; c.beginPath(); c.moveTo(-10, 0); c.lineTo(4, 0); c.lineTo(22, 112); c.lineTo(-24, 112); c.closePath(); c.fill();
    c.fillStyle = on > 0.5 ? '#fff0c8' : '#2e2610'; c.beginPath(); c.ellipse(0, 118, 62, 11, 0, 0, 7); c.fill(); c.restore();
    var sw = Math.sin(t * 1.6) * 1.2, ex = g.rim[0] - 2 + sw, ey = g.rim[1] + 40 + 12 * (pull || 0);
    c.strokeStyle = '#d2bb84'; c.lineWidth = 2.4; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(g.rim[0], g.rim[1]); c.lineTo(ex, ey); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#e0c476'; c.beginPath(); c.arc(ex, ey + 5, 5.5, 0, 7); c.fill();
  }
  function steam(c, t, x, y) {
    c.save(); c.strokeStyle = 'rgba(244,234,215,0.55)'; c.lineWidth = 3; c.lineCap = 'round';
    for (var i = 0; i < 3; i++) { var ph = (t * 0.7 + i * 0.33) % 1, sx = x - 8 + i * 8 + Math.sin(t * 2 + i) * 3; c.globalAlpha *= 0.5 * (1 - ph) + 0.001; c.beginPath(); c.moveTo(sx, y - 6 - ph * 38); c.quadraticCurveTo(sx + 7, y - 20 - ph * 38, sx, y - 34 - ph * 38); c.stroke(); c.globalAlpha /= 0.5 * (1 - ph) + 0.001; }
    c.restore();
  }
  function chaiGlass(c, t, x, y, hot) {
    c.fillStyle = 'rgba(210,225,225,0.7)'; c.beginPath(); c.moveTo(x - 17, y - 52); c.lineTo(x + 17, y - 52); c.lineTo(x + 13, y); c.lineTo(x - 13, y); c.closePath(); c.fill();
    c.fillStyle = '#a8682f'; c.beginPath(); c.moveTo(x - 16, y - 38); c.lineTo(x + 16, y - 38); c.lineTo(x + 13, y - 1); c.lineTo(x - 13, y - 1); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x - 11, y - 48, 4, 42); if (hot) steam(c, t, x, y - 52);
  }
  function phoneOnStand(c, t, x, y, ring) {
    var sh = ring > 0 ? Math.sin(t * 90) * 1.6 * ring : 0;
    c.save(); c.translate(x + sh, y); c.fillStyle = '#2c2420'; c.beginPath(); c.moveTo(-18, 0); c.lineTo(24, 0); c.lineTo(10, -26); c.lineTo(-10, -26); c.closePath(); c.fill();
    c.rotate(0.12); c.fillStyle = '#111'; c.beginPath(); c.roundRect(-22, -88, 44, 70, 6); c.fill();
    c.fillStyle = 'rgba(160,225,255,' + (0.6 + 0.4 * ring) + ')'; c.fillRect(-18, -84, 36, 60); c.fillStyle = 'rgba(31,27,24,0.55)'; for (var i = 0; i < 4; i++) c.fillRect(-14, -78 + i * 15, 22 + (i % 2) * 8, 8);
    c.restore();
  }
  function boxPiece(c, x, y, w, h, seed) {
    C.paperPiece(C.tornRect2(x, y - h, w, h, seed, 2), '#b58a55', { dots: '#3c1e0a', dotA: 0.18, shadow: false });
    c.fillStyle = '#9a7344'; c.fillRect(x, y - h, w, 8); c.fillStyle = 'rgba(244,234,200,0.5)'; c.fillRect(x + w * 0.42, y - h, w * 0.16, h);
  }
  function deskItems(c, t, E, ring) {
    var y = DESKTOP, i;
    if (E === 'trusted') {
      C.paperPiece(C.tornRect2(520, y - 118, 150, 118, 471, 2), '#7a2e2a', { dots: '#000', dotA: 0.22, shadow: false });
      for (i = 0; i < 6; i++) { c.fillStyle = '#f1e8d2'; c.save(); c.translate(540 + i * 18, y - 118); c.rotate(-0.05 + i * 0.03); c.fillRect(0, -16 - (i % 2) * 8, 16, 18); c.restore(); }
      C.paperPiece(C.tornRect2(540, y - 90, 112, 42, 472, 1), K.cream, { shadow: false }); txt('waiting list', 596, y - 76, 20, K.rust, 'center', 800); txt('2035–36', 596, y - 58, 16, K.ink, 'center', 600);
      phoneOnStand(c, t, 740, y, ring); chaiGlass(c, t, 450, y, true);
    } else if (E === 'lean') { chaiGlass(c, t, 470, y, false); boxPiece(c, 560, y, 110, 22, 473); phoneOnStand(c, t, 740, y, 0); }
    else if (E === 'smaller') {
      chaiGlass(c, t, 470, y, true);
      for (i = 0; i < 6; i++) { c.save(); c.translate(600 + i * 3, y - 6 - i * 5); c.rotate(-0.03 + i * 0.02); C.paperPiece(C.tornRect2(0, -4, 120, 10, 480 + i, 1), i % 2 ? K.cream : '#d9ceb5', { shadow: false }); c.restore(); }
      txt('blank cards', 658, y - 56, 18, K.amberL, 'center', 700);
    } else {
      boxPiece(c, 500, y, 190, 100, 474);
      for (i = 0; i < 4; i++) { c.fillStyle = ['#8b3a2f', '#d9a933', '#2f7f7a', '#c8bfa9'][i]; c.fillRect(516 + i * 34, y - 128 - (i % 2) * 14, 28, 36); }
      chaiGlass(c, t, 450, y, false);
      c.save(); c.translate(760, y); c.rotate(-0.04); C.paperPiece(C.tornRect2(-36, -86, 92, 86, 475, 1.5), '#f3ebd5', { shadow: false }); c.fillStyle = K.maroon; c.fillRect(-28, -78, 76, 11); c.fillStyle = 'rgba(31,27,24,0.5)'; for (i = 0; i < 6; i++) c.fillRect(-28, -60 + i * 9, 76 - (i % 3) * 14, 3); c.restore();
    }
  }

  /* ================= THE SHOTS ================= */
  var GROUND = { teal: '#14434d', deep: '#0e3a43', cold: '#0b2f3a', mid: '#1f6a70', maroon: '#7a2e2a', green: '#215f5b' };

  // ---- the lit office, drawn through three parallax layers (far wall · wall pieces and furniture · near leaves)
  function officeLayers(c, t, E, road, cam, S) {
    var g = lampGeom(), on = S.on, k12 = C.T12(t), i;
    C.cardboard(mixHex(S.ground, '#071d25', 1 - on * 0.6 - 0.4), 0.34);
    // far: torn wall sheets and the amber sunburst that rides behind the lamp
    layer(cam, 0.55, function () {
      sheet(-420, -240, 2800, 940, 901, '#17505c', { dotA: 0.1, blur: 24 });
      for (i = 0; i < 7; i++) sheet(-260 + i * 340, -240, 170, 940, 910 + i, i % 2 ? '#1b5966' : '#144651', { shadow: false, dotA: 0.08, grain: 0.15 });
      sheet(-420, 556, 2800, 170, 920, '#0d303a', { dotA: 0.2, blur: 18 });
      if (on > 0.02) C.sunburst(g.open[0], g.open[1] - 20, 70, 1700, 22, 'rgba(255,196,110,1)', 0.075 * on, k12 * 0.05);
    });
    // wall pieces (cut-outs with rims)
    layer(cam, S.wallK != null ? S.wallK : 0.8, function () {
      pc(30, 60, 600, 570, function (cc) { windowPiece(cc, t); });
      pc(CLOCK.x - 80, CLOCK.y - 80, 160, 160, function (cc) { clockPiece(cc, t, S.clock[0], S.clock[1]); });
      if (E === 'trusted') {
        pc(536, 76, 540, 370, function (cc) { mentorWall(cc, k12, 556, 104, 500, 310, 0.1); });
        pc(1170, 66, 650, 340, function (cc) { chartPiece(cc, k12, E, 1190, 96, 610, 290, 0.3, null); });
      } else if (E === 'lean') {
        pc(580, 100, 480, 340, function (cc) { framePiece(cc, 610, 130, 420, 270, function (x, y, w, h) { staffPhoto(cc, x, y, w, h, [8, 14], k12, 3 * BEAT + 0.15); }, 441); });
        pc(650, 418, 300, 40, function (cc) { C.paperPiece(C.tornRect2(690, 416, 260, 34, 442, 1), K.cream, { shadow: false }); txt('Vidya faculty · 2026', 820, 434, 22, K.ink, 'center', 800); });
        pc(1180, 80, 640, 330, function (cc) { screenPiece(cc, k12, road, 1210, 110, 580, 270, 3 * BEAT + 0.1); });
      } else if (E === 'smaller') {
        pc(690, 120, 340, 280, function (cc) { framePiece(cc, 720, 150, 280, 210, function (x, y, w, h) { photo2009(cc, x, y, w, h); }, 451); });
        pc(1290, 66, 540, 330, function (cc) { chartPiece(cc, k12, E, 1320, 96, 480, 270, 0.2, 3 * BEAT + 0.15); });
      } else {
        pc(536, 76, 540, 340, function (cc) { chartPiece(cc, k12, E, 556, 104, 480, 280, 0.1, 0.8, blankFor(E, road)); });
        if (S.photoOn && !S.held) { var Fp = photoPos(t); pc(Fp.x - 150, Fp.y - 120, 300, 240, function (cc) { cc.save(); cc.translate(Fp.x, Fp.y); cc.rotate(Fp.r); cc.translate(-Fp.x, -Fp.y); framePiece(cc, Fp.x - 120, Fp.y - 90, 240, 180, function (x, y, w, h) { photo2009(cc, x, y, w, h); }, 453); cc.restore(); }); }
        else C.paperPiece(C.tornRect2(1290, 170, 240, 180, 452, 2), 'rgba(20,80,92,0.55)', { shadow: false });
      }
      if (E !== 'lean') pc(1560, 340, 270, 360, function (cc) { almirahPiece(cc); });
    });
    // floor, rug, furniture
    layer(cam, 0.95, function () {
      sheet(-420, 704, 2800, 520, 921, '#0b2830', { dotA: 0.2, blur: 20 });
      C.paperPiece(C.tornRect2(300, 930, 1300, 150, 922, 4), '#6a2630', { dots: '#000', dotA: 0.18, shadow: false });
    });
    layer(cam, 1, function () {
      if (S.chairX != null) pc(S.chairX - 160, SEAT.y - 345, 300, 540, function (cc) { chairPiece(cc, S.chairX); });
      pc(g.x - 80, g.y - 270, 340, 290, function (cc) { lampPiece(cc, t, on, S.pull); }, { shadow: true });
      S.sun(c, t);
      if (S.afterSun) S.afterSun(c, t);
      pc(270, DESKTOP - 6, 890, 245, function (cc) { deskPiece(cc); });
      pc(410, 520, 480, 180, function (cc) { deskItems(cc, t, E, S.ring); });
    });
    // lamp glow, phone glow, the dashboard's cold light (screen-space halos inside the mid layer)
    layer(cam, 1, function () {
      if (on > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; var gr = c.createRadialGradient(g.open[0] - 20, g.open[1] + 10, 6, g.open[0] - 20, g.open[1] + 10, 520); gr.addColorStop(0, 'rgba(255,200,120,' + (0.40 * on * (1 + 0.03 * Math.sin(k12 * 9))) + ')'); gr.addColorStop(0.4, 'rgba(255,170,80,' + 0.10 * on + ')'); gr.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = gr; c.fillRect(g.open[0] - 560, g.open[1] - 520, 1100, 1100); c.restore(); }
      if (S.after) S.after(c, t);
    });
    // the lamp going out: a night shade over the room, the window keeps its light
    if (on < 0.98) {
      c.save(); c.fillStyle = 'rgba(5,24,33,' + (0.66 * (1 - on)) + ')'; c.fillRect(-10, -10, 1940, 1100); c.restore();
      layer(cam, 0.8, function () { c.save(); c.globalAlpha *= (1 - on); pc(30, 60, 600, 570, function (cc) { windowPiece(cc, t); }); c.restore(); });
    }
    // near: a leaf cut-out each side and slow amber dust
    layer(cam, 1.45, function () {
      var sw = Math.sin(k12 * 0.8) * 0.03; c.save(); c.translate(-40, 1040); c.rotate(-0.15 + sw);
      for (i = 0; i < 5; i++) { c.save(); c.rotate(-0.1 + i * 0.32); C.paperPiece([[0, 0], [90, -70], [260, -30], [330, 40], [190, 30], [60, 40]].map(function (q) { return [q[0] * 0.9, q[1] * 0.9]; }), i % 2 ? '#1c6a58' : '#14554a', { dotA: 0.2, dots: '#000', shadow: true, blur: 20 }); c.restore(); }
      c.restore();
      c.save(); c.translate(1990, 1060); c.rotate(PI + 0.3 - sw); for (i = 0; i < 4; i++) { c.save(); c.rotate(-0.05 + i * 0.3); C.paperPiece([[0, 0], [90, -70], [260, -30], [330, 40], [190, 30], [60, 40]].map(function (q) { return [q[0] * 0.8, q[1] * 0.8]; }), i % 2 ? '#14554a' : '#1c6a58', { dotA: 0.2, dots: '#000', shadow: true, blur: 20 }); c.restore(); } c.restore();
      c.save(); c.globalAlpha *= 0.5 * on; C.confetti(33, k12 * 0.5, K.amber, 16, [200, 100, 1500, 800]); c.restore();
    });
  }
  function almirahPiece(c) {
    var x = 1560, y = 400, w = 260, h = 300;
    C.paperPiece(C.tornRect2(x, y, w, h, 331, 3), K.sage, { dots: '#000', dotA: 0.2, shadow: false });
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + w / 2 - 2, y + 8, 4, h - 16);
    for (var i = 0; i < 7; i++) { c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x + 18, y + 30 + i * 22, w / 2 - 36, 5); c.fillRect(x + w / 2 + 18, y + 30 + i * 22, w / 2 - 36, 5); }
    c.fillStyle = '#d6c27a'; c.fillRect(x + w / 2 - 22, y + h * 0.5, 8, 26); c.fillRect(x + w / 2 + 14, y + h * 0.5, 8, 26);
    var fx = x + 12, cols = ['#8b3a2f', '#d9a933', '#2f7f7a', '#c8bfa9', '#5a6f9c'];
    for (i = 0; i < 6; i++) { var fh = 62 + (i * 13) % 26; C.paperPiece(C.tornRect2(fx + i * 22, y - fh, 19, fh, 340 + i, 1.5), cols[i % 5], { shadow: false }); }
    C.paperPiece(C.tornRect2(x + w - 100, y - 58, 92, 58, 351, 3), '#9d2c2c', { dots: '#000', dotA: 0.2, shadow: false }); c.strokeStyle = '#e8d9a8'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + w - 100, y - 30); c.lineTo(x + w - 8, y - 30); c.moveTo(x + w - 54, y - 58); c.lineTo(x + w - 54, y); c.stroke();
  }
  function photoPos(t) { // the first-batch photo: on the wall → lifted off the nail (S3) → held at her chest (S4)
    var wall = [1410, 260], held = [1560, 505], lift = C.ease(C.prog(t, B(5) + 0.1, B(6) + 0.25)), p = [mix(wall[0], held[0], lift), mix(wall[1], held[1], lift)];
    return { x: p[0], y: p[1], r: -0.03 * lift + 0.015 * Math.sin(t * 1.2) * lift };
  }

  /* ---------- the acting (each returns the CAST draw call for that moment) ---------- */
  function seatedSticker(t, o, extra) { // Sunanda at her desk, as a cut-out
    pc(1000, 380, 340, 440, function (cc) { var f = { x: SEAT.x, y: SEAT.y, h: SEAT.h, pose: 'sit', flip: true, t: t, lean: o.lean || 0 }; actor(cc, f, Object.assign({ face: o.face }, o.opts || {}, extra || {})); });
  }
  var DIR = {};

  /* ---------- TRUSTED ---------- */
  DIR.trusted = {
    caps: ['2034. The waiting list is longer than the *register*.', 'Sunanda goes home before *nine*.'],
    shots: [{ a: 0, b: B(3), k: 'wide' }, { a: B(3), b: B(5), k: 'insert' }, { a: B(5), b: B(8), k: 'face' }, { a: B(8), b: B(10), k: 'mid' }],
    cam: function (sh, t) {
      if (sh.k === 'wide') return camAt(t, sh, [960, 540, 1.0], [1010, 548, 1.1]);
      return camAt(t, sh, [1030, 474, 1.5], [1050, 470, 1.62]);
    },
    ground: function (t) { return GROUND.teal; },
    clock: function (t) { return [8, 45 + 7 * t / 6.25]; },
    state: function (t) {
      var reachT = C.ease(C.prog(t, B(8), B(8) + 0.3)) * (1 - C.ease(C.prog(t, B(9) + 0.2, B(9) + 0.6))), pull = C.ease(C.prog(t, B(8) + 0.34, B(9) - 0.04)) * (1 - C.prog(t, B(9) + 0.05, B(9) + 0.2));
      return { on: 1 - C.ease(C.prog(t, B(9) - 0.02, B(9) + 0.12)), ring: C.prog(t, 0.8, 0.84) * (1 - C.prog(t, 1.7, 1.8)), pull: pull, reach: reachT, chairX: SEAT.x, clock: DIR.trusted.clock(t) };
    },
    sun: function (t, S) {
      var base = { face: 'focused', look: [0.4, 0.9], tilt: 0 }, chain = chainPos(S.pull, t);
      var writing = t < 1.0, o = Object.assign({}, base);
      var rx = mix(1078 + 6 * Math.sin(t * 5.2), chain.x, S.reach), ry = mix(674 + 2 * Math.sin(t * 10.4), chain.y, S.reach);
      var op = { R: [rx, ry], L: [1048, 680], holdR: S.reach < 0.02 && t < B(5) ? 'pen' : null, look: [0.4, 0.9], t: t };
      if (t < B(3)) { op = CAST.doubleTake(Object.assign({ face: 'focused' }, op), t, 0.8, 1); }
      else if (t >= B(8)) { op.look = [1, 0.5]; }
      var face = t < B(3) ? op.face : t < B(8) ? 'smile' : 'smile';
      op.face = op.face || face;
      var lean = 0.14 * S.reach;
      return function () { seatedSticker(t, { face: op.face, lean: lean }, op); };
    },
    after: function (c, t) {
      var ring = DIR.trusted.state(t).ring;
      if (ring > 0) { c.save(); c.globalCompositeOperation = 'lighter'; var gr = c.createRadialGradient(742, 640, 8, 742, 640, 190); gr.addColorStop(0, 'rgba(160,225,255,' + 0.45 * ring + ')'); gr.addColorStop(1, 'rgba(160,225,255,0)'); c.fillStyle = gr; c.fillRect(540, 440, 400, 400); c.restore();
        c.save(); c.strokeStyle = 'rgba(190,235,255,0.6)'; c.lineWidth = 3; for (var k = 0; k < 2; k++) { var ph = ((C.T12(t) * 1.8) + k * 0.5) % 1; c.globalAlpha *= (1 - ph) * ring * 0.7; c.beginPath(); c.arc(742, 640, 30 + ph * 90, 0, 7); c.stroke(); c.globalAlpha /= Math.max(1e-3, (1 - ph) * ring * 0.7); } c.restore(); }
    }
  };
  function chainPos(pull, t) { var g = lampGeom(); return { x: g.rim[0] - 2 + Math.sin(t * 1.6) * 1.2, y: g.rim[1] + 45 + 12 * (pull || 0) }; }
  function camAt(t, sh, k0, k1) { var f = (t - sh.a) / (sh.b - sh.a); f = C.ease(C.clamp(f, 0, 1)); return { x: mix(k0[0], k1[0], f), y: mix(k0[1], k1[1], f), z: mix(k0[2], k1[2], f) }; }

  /* ---------- screen-space shots: inserts and the big face ---------- */
  var NAMES = ['Anaya K.', 'Rohan B.', 'Ishita D.', 'Kabir S.', 'Mrunal P.', 'Zoya P.', 'Atharv J.', 'Diya N.', 'Veer S.', 'Tanvi M.', 'Aryan G.', 'Sana M.', 'Om K.', 'Riya S.'];
  function insertCam(c, z, fn) { C.withCam({ x: 960, y: 540, z: z }, fn); }
  function phoneSticker(c, cx, cy, rot, lt, msgs) { // a full phone: header, bubbles that spring in at their times
    c.save(); c.translate(cx, cy); c.rotate(rot);
    pc(-215, -440, 430, 880, function (g) {
      g.fillStyle = '#0d0f12'; g.beginPath(); g.roundRect(-215, -440, 430, 880, 44); g.fill();
      g.fillStyle = '#ece6d6'; g.beginPath(); g.roundRect(-197, -420, 394, 840, 30); g.fill();
      g.fillStyle = '#1f6f5c'; g.fillRect(-197, -420, 394, 88); ntxt(g, 'Parents · enquiries', -176, -388, 31, '#fff', 700); ntxt(g, '8:46 pm', 176, -388, 23, 'rgba(255,255,255,0.75)', 500, 'right');
      var by = -300;
      for (var i = 0; i < msgs.length; i++) {
        var m = msgs[i], p = C.easeOut(C.prog(lt, m.t0, m.t0 + 0.2)); if (p <= 0) { by += 120; continue; }
        var bw = 360, bh = 96, bx = m.out ? 197 - bw - 8 : -197 + 8;
        g.save(); g.globalAlpha *= p; g.translate(0, (1 - p) * 36); g.fillStyle = m.out ? '#cfe8b8' : '#ffffff'; g.beginPath(); g.roundRect(bx, by, bw, bh, 20); g.fill();
        ntxt(g, m.s[0], bx + 16, by + 30, 24, '#1f1b18', 500); ntxt(g, m.s[1], bx + 16, by + 66, 24, '#1f1b18', 500); g.restore(); by += bh + 24;
      }
    }, { res: 1.3 });
    c.restore();
  }
  function stampPlate(c, x, y, w, h, rot, p) { // a cream torn plate that the ink stamp lands on (stamps need a plain ground to read)
    if (p <= 0) return; c.save(); c.translate(x, y); c.rotate(rot); c.scale(C.back(C.clamp(p * 3)), C.back(C.clamp(p * 3)));
    pc(-w / 2, -h / 2, w, h, function (g) { C.paperPiece(C.tornRect2(-w / 2, -h / 2, w, h, 61, 5), '#f4ead7', { shadow: false }); }); c.restore();
  }
  // TRUSTED · shot 2: one thin register against a tall stack of waiting-list files
  function insertTrusted(c, t, lt) {
    C.cardboard(GROUND.mid, 0.36);
    var z = 1 + 0.12 * C.prog(lt, 0, B(2)), cam = C.shake(C.bump(C.drift({ x: 960, y: 540, z: z }, t), t), t, B(4));
    C.withCam(cam, function () {
      C.sunburst(900, 560, 120, 1700, 20, 'rgba(244,214,140,1)', 0.14, C.T12(t) * 0.06);
      // the register: one thin ledger
      c.save(); c.translate(430, 770); c.rotate(-0.03);
      pc(-250, -150, 500, 190, function (g) {
        C.paperPiece(C.tornRect2(-250, -70, 500, 110, 71, 3), '#8c2a2a', { dots: '#000', dotA: 0.2, shadow: false }); g.fillStyle = '#efe5cd'; g.fillRect(-236, -84, 472, 16); g.fillStyle = 'rgba(31,27,24,0.25)'; g.fillRect(-236, -78, 472, 2);
        C.paperPiece(C.tornRect2(-170, -50, 340, 54, 72, 2), '#d9a933', { shadow: false }); txt('Enrolment register', 0, -22, 30, K.ink, 'center', 800);
      }); c.restore();
      c.save(); C.popIn(430, 880, C.prog(lt, 0.0, 0.2), function () { C.banner('The register', 430, 900, { size: 40, rot: -0.04, bg: K.cream, fg: K.ink, seed: 3 }); }); c.restore();
      // the waiting list: fourteen files stack up (stagger capped at 0.5 s)
      var cols = [K.teal, K.mustard, K.coral, '#4b6fa8', K.saffron, '#7d5a8c'], i;
      for (i = 0; i < 14; i++) {
        var p = C.prog(lt, 0.05 + i * 0.034, 0.05 + i * 0.034 + 0.2); if (p <= 0) continue;
        var fy = 940 - (i + 1) * 54, fx = 760 + (i % 3) * 10 - 10;
        C.popIn(fx + 320, fy + 26, p, (function (fx, fy, i) { return function () {
          pc(fx, fy, 640, 56, function (g) { C.paperPiece(C.tornRect2(fx, fy, 640, 52, 80 + i, 2.5), cols[i % 6], { dots: '#000', dotA: 0.12, shadow: false }); C.paperPiece(C.tornRect2(fx + 18, fy - 12, 150, 22, 120 + i, 1.5), K.cream, { shadow: false }); txt(NAMES[i], fx + 93, fy - 1, 17, K.ink, 'center', 800); g.fillStyle = 'rgba(251,245,232,0.5)'; g.fillRect(fx + 200, fy + 24, 400, 3); });
        }; })(fx, fy, i));
      }
      // a phone pings with the newest enquiry
      phoneSticker(c, 1560, 560, 0.06, lt, [{ s: ['Ma\'am, is there a seat in', 'Class 9? We applied in March.'], t0: 0.35 }, { s: ['You are 38th on the list.', 'Her mentor will call tomorrow.'], t0: 0.8, out: 1 }]);
    });
    // the verdict lands on the beat (starts 0.12 s early so the slam lands on beat 4)
    var ps = C.prog(t, B(4) - 0.12, B(4) + 0.12);
    stampPlate(c, 1010, 480, 700, 190, -0.08, ps); C.inkStamp('Waiting list', 1010, 480, ps, { size: 120, col: K.maroon, rot: -0.08, seed: 5 });
    if (t > B(4)) { c.save(); c.globalAlpha *= 1 - C.prog(t, B(4) + 0.3, B(5)); C.confetti(21, C.T12(t), K.amber, 18, [300, 80, 1400, 600]); c.restore(); }
  }

  // the huge face: Sunanda drawn at h ≈ 2800 so the head fills over half the frame
  function bigSunanda(c, hx, hy, s, o) {
    o = Object.assign({ pivot: 'chest' }, o);
    var flip = o.flip !== false, f = { x: hx + (flip ? 1.5 * s : -1.5 * s), y: hy + 44 * s, h: s * 100, pose: 'sit', flip: flip, t: o.t, lean: o.lean || 0 };
    return actor(c, f, o);
  }
  function faceBg(c, t, ground, hx, hy, sun, a, rot) {
    C.cardboard(ground, 0.4); C.sunburst(hx, hy, 240, 1800, 24, sun, a, rot);
  }
  function phoneChat(c, hp, s, t) { // chat bubbles drawn over the lit phone prop (prop rect: x −5.25..1.25 units, y −8.7..2 around the hand, facing left)
    var x0 = hp.x + s * (-3.25 - 2) + 24, y0 = hp.y + s * (-11.5 + 2.8) + 24, w = 6.5 * s - 48, k = C.T12(t);
    c.save(); c.beginPath(); c.rect(x0, y0, w, 11.5 * s - 50); c.clip(); c.fillStyle = '#1f6f5c'; c.fillRect(x0, y0, w, 40);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x0 + 8, y0 + 60, w - 40, 56, 12); c.fill(); c.fillStyle = '#cfe8b8'; c.beginPath(); c.roundRect(x0 + 32, y0 + 130, w - 40, 56, 12); c.fill();
    c.fillStyle = 'rgba(31,27,24,0.55)'; c.fillRect(x0 + 22, y0 + 80, w - 80, 8); c.fillRect(x0 + 22, y0 + 96, w - 120, 8); c.fillRect(x0 + 46, y0 + 150, w - 90, 8); c.fillRect(x0 + 46, y0 + 166, w - 130, 8);
    var ty = y0 + 210 + 4 * Math.sin(k * 8); c.fillStyle = 'rgba(31,27,24,0.4)'; for (var i = 0; i < 3; i++) { c.beginPath(); c.arc(x0 + 36 + i * 20, ty, 6, 0, 7); c.fill(); }
    c.restore();
  }
  // TRUSTED · shot 3: she reads the phone, a four-beat joy take lands on beat 7
  function faceTrusted(c, t, lt) {
    var cam = C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.06 * C.prog(t, B(5), B(8)) }, t), t), k12 = C.T12(t), tk = B(7) - 0.3;
    C.withCam(cam, function () {
      faceBg(c, t, GROUND.deep, 1010, 440, 'rgba(244,184,96,1)', 0.2, k12 * 0.06);
      var o = CAST.withTake({ face: 'focused', look: [0.5, 0.9], t: t, R: [650, 890], L: [760, 960], holdR: 'phone', glow: 1, tilt: 0.02, flip: true }, 'joy', t, tk);
      var hh = bigSunanda(c, 1010, 440, 28, o);
      phoneChat(c, hh.handR, 28, t);
      // the message that makes her day pops in beside the phone on beat 6
      var p = C.prog(t, B(6), B(6) + 0.22); c.save(); C.popIn(420, 300, p, function () {
        pc(130, 190, 580, 220, function (g) { C.paperPiece(C.tornRect2(130, 190, 580, 200, 90, 4), '#cfe8b8', { shadow: false }); ntxt(g, 'Anaya starts Monday!', 170, 262, 44, K.ink, 800); ntxt(g, 'Thank you, ma\'am.', 170, 326, 40, K.ink, 600); });
      }); c.restore();
      if (t > B(7)) { c.save(); c.globalAlpha *= C.prog(t, B(7), B(7) + 0.1) * (1 - C.prog(t, B(7) + 0.9, B(8))); C.confetti(41, k12, K.amber, 22, [100, 50, 1700, 700]); c.restore(); }
    });
  }


  function standingSticker(t, f, o) { // Sunanda on her feet, as a cut-out
    var x0 = f.x - 300, y0 = f.y - f.h * 1.06, w = 600, h = f.h * 1.14;
    pc(x0, y0, w, h, function (cc) { actor(cc, Object.assign({ pose: 'stand', t: t }, f), o); });
  }
  function leanFace(t) { return ramp(t, [[0, 0], [1, 0]]); }

  /* ---------- LEAN: an analytics wall, a faculty photo that has faded, alone ---------- */
  DIR.lean = {
    caps: ['2034. Lowest fees in Pune, and the rooms are *full*.', 'Fees fell; each teacher\'s class is *bigger*.'],
    shots: [{ a: 0, b: B(3), k: 'wide' }, { a: B(3), b: B(5), k: 'screen' }, { a: B(5), b: B(7), k: 'photo' }, { a: B(7), b: B(10), k: 'face' }],
    cam: function (sh, t) {
      if (sh.k === 'wide') return camAt(t, sh, [1000, 545, 1.0], [1070, 540, 1.1]);
      if (sh.k === 'screen') return camAt(t, sh, [1470, 262, 1.4], [1500, 258, 1.55]);
      return camAt(t, sh, [826, 270, 2.2], [832, 266, 2.4]);
    },
    ground: function (t, sh) { return sh.k === 'wide' ? GROUND.teal : GROUND.cold; },
    clock: function (t) { return [10, 19 + 2 * t / 6.25]; },
    state: function (t) { return { on: 1, ring: 0, pull: 0, reach: 0, chairX: SEAT.x }; },
    sun: function (t, S) {
      var face = step(t, [[-1, 'tired'], [B(2), 'sad']]), look = step(t, [[-1, [0.3, 0.6]], [B(2) - 0.3, [1, -0.25]]]);
      var tilt = ramp(t, [[0.8, 0], [B(2), 0.06], [B(3), 0.06]]);
      return function () { seatedSticker(t, { face: face, lean: 0.03 }, { armR: CAST.ARMS.think.armR, armL: reach({ x: SEAT.x, y: SEAT.y, h: SEAT.h, pose: 'sit', flip: true }, 1050, 684, true), look: look, tilt: tilt, t: t }); };
    },
    after: function (c, t) { // the dashboard's cold light on the room
      c.save(); c.globalCompositeOperation = 'lighter'; var fl = 0.85 + 0.15 * Math.sin(C.T12(t) * 5.3), gr = c.createRadialGradient(1500, 250, 20, 1500, 250, 760); gr.addColorStop(0, 'rgba(110,200,235,' + 0.2 * fl + ')'); gr.addColorStop(1, 'rgba(110,200,235,0)'); c.fillStyle = gr; c.fillRect(700, -200, 1400, 1200); c.restore();
    },
    stamps: [{ at: B(4), text: 'Lowest fees', x: 820, y: 640, size: 112, col: K.tealD, rot: -0.07, plate: [660, 180] }],
    face: function (c, t, lt) {
      var cam = C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.06 * C.prog(t, B(7), B(10)) }, t), t), k12 = C.T12(t);
      C.withCam(cam, function () {
        faceBg(c, t, GROUND.cold, 1010, 440, 'rgba(143,216,255,1)', 0.15, k12 * 0.05);
        var o = CAST.withTake({ face: 'neutral', look: [1, -0.2], t: t, armR: CAST.ARMS.think.armR, armL: [0.4, 1.3], tilt: 0.03, flip: true }, 'sag', t, B(8) - 0.4);
        bigSunanda(c, 1010, 440, 28, o);
        // the faculty photo, small and mostly empty, tucked at the corner
        c.save(); c.translate(280, 800); c.rotate(-0.07); pc(-170, -120, 340, 240, function (g) { framePiece(g, -150, -100, 300, 200, function (x, y, w, h) { staffPhoto(g, x, y, w, h, [3, 8, 14, 16, 5, 11, 18, 12], 99, 0); }, 441); }); c.restore();
        c.save(); c.globalCompositeOperation = 'lighter'; var gr = c.createRadialGradient(1700, 300, 20, 1700, 300, 800); gr.addColorStop(0, 'rgba(110,200,235,0.20)'); gr.addColorStop(1, 'rgba(110,200,235,0)'); c.fillStyle = gr; c.fillRect(800, -200, 1300, 1200); c.restore();
      });
    },
    events: [[B(1) - 0.05, 'pop'], [B(3), 'swish'], [B(3) + 0.15, 'pop'], [B(3) + 0.3, 'popLow', 1], [B(3) + 0.45, 'pop'], [B(3) + 0.6, 'zip', 1], [B(4) - 0.45, 'whooshIn'], [B(4), 'clank'], [B(5), 'swish'], [B(5) + 0.35, 'zip', 1], [B(5) + 0.7, 'zip', 2], [B(7) - 0.03, 'swish'], [B(7), 'pop'], [B(8), 'popLow', 0]]
  };

  /* ---------- SMALLER: half the cards go blank, two empty rooms go dark ---------- */
  function doorPiece(c, x, lit, label) {
    C.rect(x - 112, 236, 224, 540, '#3d2917', 650 + x, { rough: 3, shadow: false });
    C.rect(x - 100, 250, 200, 520, '#7a5333', 651 + x, { rough: 2, shadow: false, halftone: 0.5, dot: 'rgba(30,12,4,0.25)' });
    C.rect(x - 78, 560, 156, 180, '#6a4627', 652 + x, { rough: 2, shadow: false });
    c.save(); c.beginPath(); c.rect(x - 64, 288, 128, 236); c.clip();
    c.fillStyle = '#0f2a33'; c.fillRect(x - 64, 288, 128, 236);
    var lg = c.createLinearGradient(0, 288, 0, 524); lg.addColorStop(0, 'rgba(255,224,150,' + 0.95 * lit + ')'); lg.addColorStop(1, 'rgba(255,190,100,' + 0.85 * lit + ')'); c.fillStyle = lg; c.fillRect(x - 64, 288, 128, 236);
    c.fillStyle = lit > 0.5 ? 'rgba(90,50,20,0.7)' : 'rgba(30,60,70,0.8)'; for (var r = 0; r < 3; r++) for (var q = 0; q < 3; q++) { c.fillRect(x - 56 + q * 40 + r * 4, 410 + r * 40, 30, 12); c.fillRect(x - 52 + q * 40 + r * 4, 422 + r * 40, 22, 22); }
    c.restore();
    c.strokeStyle = '#2b1b0e'; c.lineWidth = 6; c.strokeRect(x - 64, 288, 128, 236); c.beginPath(); c.moveTo(x, 288); c.lineTo(x, 524); c.stroke();
    C.paperPiece(C.tornRect2(x - 40, 258, 80, 24, 653 + x, 1), '#d6b66a', { shadow: false }); ntxt(c, 'ROOM ' + label, x, 270, 18, K.ink, 800, 'center');
    c.fillStyle = '#d6b66a'; c.beginPath(); c.arc(x + 76, 560, 8, 0, 7); c.fill();
  }
  function boardPiece(c, sw) {
    var sx = BOARD.x, sy = BOARD.y; C.rect(sx - 88, sy - 8, 176, 196, '#e9e1cc', 631, { rough: 1.5, shadow: false });
    for (var i = 0; i < 8; i++) {
      var cx2 = sx - 54 + (i % 4) * 36, cy2 = sy + 38 + Math.floor(i / 4) * 66; c.fillStyle = '#c9c0a8'; c.fillRect(cx2 - 11, cy2 - 22, 22, 44);
      var on = i === 0 ? 1 - sw[0] : i === 1 ? 1 - sw[1] : 0.5 + (i % 3 === 0 ? 0.5 : 0); c.fillStyle = on > 0.5 ? '#f3f0e3' : '#a9a28c'; c.fillRect(cx2 - 7, cy2 - 11 + (on > 0.5 ? -4 : 4) + (on > 0.5 ? -5 : 5), 14, 22);
    }
    c.fillStyle = K.maroon; c.beginPath(); c.arc(sx + 62, sy + 150, 12, 0, 7); c.fill(); ntxt(c, 'A', sx - 54, sy + 80, 14, K.ink, 800, 'center'); ntxt(c, 'B', sx - 18, sy + 80, 14, K.ink, 800, 'center');
  }
  function corridorState(t) {
    var s1 = C.ease(C.prog(t, B(6) - 0.05, B(6) + 0.05)), s2 = C.ease(C.prog(t, B(8) - 0.05, B(8) + 0.05));
    return { sw: [s2, s1], lit: [1 - s2, 1 - s1], dark: 0.34 * C.prog(t, B(8), B(10)) };
  }
  function corridorScene(c, t, cam, S) {
    var i, k12 = C.T12(t);
    C.cardboard(GROUND.green, 0.36);
    layer(cam, 0.55, function () {
      sheet(-420, -240, 2800, 1010, 1001, '#2d7a74', { dotA: 0.1, blur: 22 });
      for (i = 0; i < 7; i++) sheet(-260 + i * 340, -240, 170, 1010, 1010 + i, i % 2 ? '#318079' : '#2a726d', { shadow: false, dotA: 0.08, grain: 0.15 });
      sheet(-420, 474, 2800, 300, 1020, '#1b524f', { dotA: 0.2, blur: 18 });
    });
    layer(cam, 0.85, function () {
      sheet(-420, 770, 2800, 400, 1021, '#0e3a3c', { dotA: 0.2, blur: 20 });
      c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 3; for (i = -2; i < 18; i++) { c.beginPath(); c.moveTo(i * 130, 774); c.lineTo(i * 130 + (i * 130 - 960) * 0.4, 1100); c.stroke(); } for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-100, 800 + i * i * 20 + i * 24); c.lineTo(2020, 800 + i * i * 20 + i * 24); c.stroke(); }
      pc(150, 560, 190, 300, function (cc) { cc.fillStyle = '#d9a933'; cc.beginPath(); cc.moveTo(190, 840); cc.lineTo(260, 840); cc.lineTo(246, 700); cc.lineTo(204, 700); cc.closePath(); cc.fill(); cc.strokeStyle = '#6b4a2e'; cc.lineWidth = 8; cc.beginPath(); cc.moveTo(228, 700); cc.lineTo(250, 580); cc.stroke(); cc.fillStyle = '#e8e2d2'; cc.beginPath(); cc.ellipse(256, 574, 30, 14, 0.3, 0, 7); cc.fill(); });
      [[420, 1], [1300, Math.sin(k12 * 47) > -0.1 || Math.floor(k12 * 3) % 5 !== 3 ? 1 : 0.4]].forEach(function (L) { c.fillStyle = 'rgba(232,251,255,' + 0.95 * L[1] + ')'; c.fillRect(L[0] - 140, 70, 280, 12); });
      pc(DOORS[0] - 130, 226, 260, 560, function (cc) { doorPiece(cc, DOORS[0], S.lit[0], '3'); });
      pc(DOORS[1] - 130, 226, 260, 560, function (cc) { doorPiece(cc, DOORS[1], S.lit[1], '4'); });
      pc(780, 320, 140, 170, function (cc) { C.rect(790, 330, 120, 150, '#a7794a', 621, { rough: 2, shadow: false }); C.paperPiece(C.tornRect2(804, 346, 92, 52, 622, 1), K.cream, { shadow: false }); cc.fillStyle = 'rgba(31,27,24,0.5)'; for (var q = 0; q < 4; q++) cc.fillRect(812, 356 + q * 9, 76 - (q % 2) * 18, 3); C.paperPiece(C.tornRect2(808, 412, 84, 52, 623, 1), P.mustard, { shadow: false }); ntxt(cc, 'ROOMS', 850, 430, 18, K.ink, 800, 'center'); ntxt(cc, '3 · 4 EMPTY', 850, 450, 15, K.ink, 700, 'center'); });
    });
    layer(cam, 1, function () {
      pc(1190, 380, 200, 230, function (cc) { boardPiece(cc, S.sw); });
      pc(1550, 390, 90, 200, function (cc) { C.paperPiece(C.tornRect2(1572, 420, 46, 160, 641, 2), '#c2352b', { shadow: false }); cc.fillStyle = '#222'; cc.fillRect(1584, 404, 22, 22); cc.fillStyle = '#f4ead7'; cc.fillRect(1576, 480, 38, 40); });
      pc(1670, 480, 190, 300, function (cc) { cc.fillStyle = '#5b3a22'; cc.fillRect(1700, 640, 14, 120); cc.fillRect(1800, 640, 14, 120); cc.fillRect(1690, 630, 134, 14); cc.fillStyle = '#b5683f'; cc.beginPath(); cc.ellipse(1757, 590, 64, 56, 0, 0, 7); cc.fill(); cc.fillStyle = '#9d5530'; cc.beginPath(); cc.ellipse(1757, 540, 34, 10, 0, 0, 7); cc.fill(); });
      S.sun();
      // light from the doors spills on the floor and dies with the switch
      for (i = 0; i < 2; i++) if (S.lit[i] > 0.01) { var dx = DOORS[i]; c.save(); c.globalCompositeOperation = 'lighter'; var gr = c.createRadialGradient(dx, 400, 20, dx, 400, 320); gr.addColorStop(0, 'rgba(255,200,120,' + 0.22 * S.lit[i] + ')'); gr.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = gr; c.fillRect(dx - 320, 80, 640, 760); c.restore();
        c.save(); c.beginPath(); c.moveTo(dx - 100, 772); c.lineTo(dx + 100, 772); c.lineTo(dx + 270, 1040); c.lineTo(dx - 270, 1040); c.closePath(); var fg = c.createLinearGradient(0, 772, 0, 1040); fg.addColorStop(0, 'rgba(255,200,120,' + 0.3 * S.lit[i] + ')'); fg.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = fg; c.fill(); c.restore(); }
    });
    layer(cam, 1.4, function () { c.save(); c.globalAlpha *= 0.45; C.confetti(55, k12 * 0.5, K.amber, 12, [200, 100, 1500, 800]); c.restore(); });
    if (S.dark > 0) { c.save(); c.fillStyle = 'rgba(4,22,28,' + S.dark + ')'; c.fillRect(-10, -10, 1940, 1100); c.restore(); }
  }
  function sunCorridor(t) {
    var up1 = C.ease(C.prog(t, B(6) - 0.34, B(6) - 0.05)) * (1 - C.ease(C.prog(t, B(6) + 0.1, B(6) + 0.45))), face = step(t, [[-1, 'neutral'], [B(6), 'sad']]);
    var swy = mix(425, 452, C.ease(C.prog(t, B(6) - 0.06, B(6) + 0.05)));
    var tgt = [BOARD.x - 54, swy], rest = [1360, 640], R = [mix(rest[0], tgt[0], up1 > 0 ? Math.max(up1, 0.001) : 0), mix(rest[1], tgt[1], up1)];
    return function () { standingSticker(t, { x: 1405, y: 900, h: 640, flip: true }, { face: face, R: R, L: [1385, 720], look: [1, 0.2], tilt: 0.02, lean: 0.03 + 0.05 * up1, t: t }); };
  }
  DIR.smaller = {
    caps: ['2034. Loyal families *stay*.', 'Long days: more teachers than ever, results still *behind*.'],
    shots: [{ a: 0, b: B(3), k: 'wide' }, { a: B(3), b: B(5), k: 'chart' }, { a: B(5), b: B(7), k: 'corridor' }, { a: B(7), b: B(10), k: 'cface' }],
    cam: function (sh, t) {
      if (sh.k === 'wide') return camAt(t, sh, [1120, 540, 1.0], [1180, 520, 1.1]);
      if (sh.k === 'chart') return camAt(t, sh, [1500, 270, 1.35], [1530, 262, 1.5]);
      return camAt(t, sh, [1010, 540, 1.0], [1080, 540, 1.08]);
    },
    wallK: function (sh) { return sh.k === 'chart' ? 1 : 0.8; },
    ground: function (t, sh) { return sh.k === 'wide' ? GROUND.teal : sh.k === 'chart' ? GROUND.deep : GROUND.green; },
    clock: function (t) { return [7, 34 + 2 * t / 6.25]; },
    state: function (t) { return { on: 1, ring: 0, pull: 0, reach: 0, chairX: 1010 }; },
    sun: function (t, S) {
      var face = step(t, [[-1, 'neutral'], [B(2), 'sad']]), up = ramp(t, [[0, 0], [0.5, 1], [B(5), 1], [B(5) + 0.5, 0.6]]);
      var hand = [mix(1290, 1385, up), mix(560, 318, up)];
      return function () { standingSticker(t, { x: 1240, y: 860, h: 600, flip: false, lean: 0.05 }, { face: face, R: hand, L: [1262, 620], holdR: up > 0.5 ? 'letter' : null, look: [1, -0.2], tilt: -0.04 + 0.02 * Math.sin(t * 1.3) }); };
    },
    corridor: function (c, t, sh) {
      var cam = C.bump(C.drift(camAt(t, sh, [1010, 540, 1.0], [1080, 540, 1.08]), t), t), S = corridorState(t); S.sun = sunCorridor(t); corridorScene(c, t, cam, S);
    },
    stamps: [{ at: B(4), text: 'Loyal families', x: 1240, y: 700, size: 104, col: K.maroon, rot: -0.07, plate: [700, 170] }],
    face: null,
    events: [[0.25, 'pop'], [B(1) - 0.05, 'pop'], [B(3), 'swish'], [B(3) + 0.2, 'pop'], [B(3) + 0.35, 'popLow', 0], [B(3) + 0.5, 'pop'], [B(4) - 0.45, 'whooshIn'], [B(4), 'clank'], [B(5), 'swish'], [B(6), 'switch'], [B(7) - 0.03, 'swish'], [B(7), 'pop'], [B(8), 'switch'], [B(8), 'popLow', 0]]
  };
  function faceCorridor(c, t, lt) {
    var cam = C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.06 * C.prog(t, B(7), B(10)) }, t), t), k12 = C.T12(t), lit = 1 - C.ease(C.prog(t, B(8) - 0.05, B(8) + 0.05));
    C.withCam(cam, function () {
      C.cardboard(GROUND.green, 0.42);
      C.sunburst(250, 440, 160, 1800, 20, 'rgba(255,196,110,1)', 0.16 * lit, k12 * 0.05); C.sunburst(1050, 440, 240, 1800, 24, 'rgba(120,200,190,1)', 0.12, -k12 * 0.05);
      c.save(); c.translate(250, 520); c.rotate(-0.03); pc(-190, -390, 380, 780, function (g) { g.translate(-0, 0); g.save(); g.translate(250 - 250, 0); doorBig(g, lit); g.restore(); }); c.restore();
      var o = CAST.withTake({ face: 'neutral', look: [1, 0.25], t: t, armR: CAST.ARMS.down.armR, armL: CAST.ARMS.down.armL, tilt: 0.03, flip: true }, 'sag', t, B(8) - 0.4);
      bigSunanda(c, 1050, 440, 28, o);
      c.save(); c.globalCompositeOperation = 'lighter'; var gr = c.createRadialGradient(300, 440, 40, 300, 440, 900); gr.addColorStop(0, 'rgba(255,190,110,' + 0.30 * lit + ')'); gr.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = gr; c.fillRect(0, -100, 1500, 1300); c.restore();
      c.save(); c.fillStyle = 'rgba(4,22,28,' + 0.30 * C.prog(t, B(8), B(10)) + ')'; c.fillRect(-100, -100, 2200, 1300); c.restore();
    });
  }
  function doorBig(g, lit) { // a door seen close, its glass pane lit or dark (drawn at 0..380 × 0..780)
    C.rect(0, 0, 380, 780, '#3d2917', 701, { rough: 3, shadow: false }); C.rect(24, 24, 332, 732, '#7a5333', 702, { rough: 2, shadow: false, halftone: 0.5, dot: 'rgba(30,12,4,0.25)' });
    g.save(); g.beginPath(); g.rect(70, 80, 240, 340); g.clip(); g.fillStyle = '#0f2a33'; g.fillRect(70, 80, 240, 340); var lg = g.createLinearGradient(0, 80, 0, 420); lg.addColorStop(0, 'rgba(255,224,150,' + 0.95 * lit + ')'); lg.addColorStop(1, 'rgba(255,190,100,' + 0.85 * lit + ')'); g.fillStyle = lg; g.fillRect(70, 80, 240, 340);
    g.fillStyle = lit > 0.5 ? 'rgba(90,50,20,0.7)' : 'rgba(30,60,70,0.8)'; for (var r = 0; r < 3; r++) for (var q = 0; q < 3; q++) { g.fillRect(90 + q * 70 + r * 6, 250 + r * 56, 52, 18); g.fillRect(96 + q * 70 + r * 6, 268 + r * 56, 36, 30); } g.restore();
    g.strokeStyle = '#2b1b0e'; g.lineWidth = 10; g.strokeRect(70, 80, 240, 340); C.paperPiece(C.tornRect2(130, 456, 120, 40, 703, 1), '#d6b66a', { shadow: false }); ntxt(g, 'ROOM 3', 190, 478, 28, K.ink, 800, 'center');
  }
  DIR.smaller.face = faceCorridor;

  /* ---------- EMPTY: a lease notice, a half-blank wall, the first batch's photo comes off the nail ---------- */
  function insertLease(c, t, lt) {
    C.cardboard(GROUND.maroon, 0.42);
    var z = 1 + 0.1 * C.prog(lt, 0, B(2)), cam = C.shake(C.bump(C.drift({ x: 960, y: 540, z: z }, t), t), t, B(4));
    C.withCam(cam, function () {
      C.sunburst(760, 520, 140, 1800, 20, 'rgba(244,184,96,1)', 0.12, C.T12(t) * 0.05);
      c.save(); c.translate(720, 540); c.rotate(-0.045 + Math.sin(C.T12(t) * 1.6) * 0.003);
      pc(-400, -500, 800, 1080, function (g) {
        C.paperPiece(C.tornRect2(-390, -480, 780, 1080, 511, 3), '#f4ecd8', { dots: '#000', dotA: 0.05, shadow: false });
        ntxt(g, 'RANE PROPERTIES', -340, -410, 48, '#1f3d3a', 800); ntxt(g, 'Estates & leasing · Pune', -340, -366, 24, 'rgba(31,27,24,0.6)', 500); g.fillStyle = '#1f3d3a'; g.fillRect(-340, -338, 680, 4);
        ntxt(g, 'NOTICE OF NON-RENEWAL', -340, -280, 44, K.ink, 800); ntxt(g, 'To: Ms. Sunanda Joshi, Vidya Classes', -340, -214, 28, K.ink, 500); ntxt(g, 'Premises: Third floor, Shree Arcade, Pune', -340, -176, 28, K.ink, 500);
        var body = ['We write to inform you that the lease on the', 'third floor will not be renewed. Please vacate', 'the premises and return the keys by', '31 March 2035.', '', 'The ground and first floor leases are unchanged.'];
        for (var i = 0; i < body.length; i++) ntxt(g, body[i], -340, -104 + i * 44, 28, i === 3 ? K.maroon : K.ink, i === 3 ? 800 : 500);
        g.strokeStyle = 'rgba(31,27,24,0.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-320, 330); g.bezierCurveTo(-270, 290, -230, 360, -180, 320); g.bezierCurveTo(-140, 296, -110, 340, -60, 316); g.stroke(); ntxt(g, 'Authorised signatory', -340, 372, 22, 'rgba(31,27,24,0.6)', 500);
      }); c.restore();
      c.save(); c.translate(1500, 800); c.rotate(0.06); pc(-170, -90, 340, 180, function (g) { g.strokeStyle = '#1f1b18'; g.lineWidth = 8; g.beginPath(); g.arc(-60, 0, 62, 0, 7); g.arc(60, 0, 62, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-2, -6); g.lineTo(2, -6); g.stroke(); g.beginPath(); g.moveTo(122, -8); g.lineTo(165, -30); g.stroke(); g.fillStyle = 'rgba(190,225,240,0.35)'; g.beginPath(); g.arc(-60, 0, 58, 0, 7); g.arc(60, 0, 58, 0, 7); g.fill(); }); c.restore();
    });
    var ps = C.prog(t, B(4) - 0.12, B(4) + 0.12);
    stampPlate(c, 1300, 360, 640, 190, 0.09, ps); C.inkStamp('Lease ends', 1300, 360, ps, { size: 116, col: K.tealD, rot: 0.09, seed: 8 });
    if (t > B(4)) { c.save(); c.globalAlpha *= 1 - C.prog(t, B(4) + 0.3, B(5)); C.confetti(23, C.T12(t), K.amber, 14, [300, 80, 1400, 600]); c.restore(); }
  }
  DIR.empty = {
    caps: ['2034. Sunanda gives up the third *floor*.', 'She keeps one room, and the first batch *photo*.'],
    shots: [{ a: 0, b: B(3), k: 'wide' }, { a: B(3), b: B(5), k: 'insert' }, { a: B(5), b: B(7), k: 'photo' }, { a: B(7), b: B(10), k: 'face' }],
    cam: function (sh, t) { if (sh.k === 'wide') return camAt(t, sh, [990, 548, 1.0], [1040, 540, 1.1]); return camAt(t, sh, [1460, 430, 1.5], [1480, 426, 1.62]); },
    wallK: function (sh) { return sh.k === 'photo' ? 1 : 0.8; },
    ground: function (t, sh) { return sh.k === 'wide' ? GROUND.teal : GROUND.deep; },
    clock: function (t) { return [9, 8 + 2 * t / 6.25]; },
    state: function (t) { return { on: 1, ring: 0, pull: 0, reach: 0, chairX: t < B(5) ? SEAT.x : 1760, photoOn: true, held: t >= B(5) }; },
    sun: function (t, S) {
      if (t < B(5)) {
        var face = step(t, [[-1, 'sad'], [B(2), 'tired']]), look = step(t, [[-1, [0.7, 0.8]], [B(2), [0.2, 0.7]]]);
        return function () { seatedSticker(t, { face: face, lean: 0.06 }, { R: [1060, 566 + 3 * Math.sin(t * 1.1)], L: [1052, 680], holdR: 'letter', look: look, tilt: 0.05, t: t }); };
      }
      var F = photoPos(t), face2 = 'sad';
      return function () { standingSticker(t, { x: 1620, y: 870, h: 600, flip: true }, { face: face2, look: [1, 0.3], tilt: ramp(t, [[B(5), 0], [B(5) + 0.8, -0.04]]), R: [F.x - 100 + 4 * Math.sin(t * 2), F.y + 78], L: [F.x + 36, F.y + 96], t: t }); };
    },
    insert: insertLease,
    afterSun: function (c, t) {
      if (t < B(5)) return; var F = photoPos(t);
      c.save(); c.translate(F.x, F.y); c.rotate(F.r); c.translate(-F.x, -F.y); pc(F.x - 150, F.y - 120, 300, 240, function (cc) { framePiece(cc, F.x - 120, F.y - 90, 240, 180, function (x, y, w, h) { photo2009(cc, x, y, w, h); }, 453); }); c.restore();
      c.fillStyle = '#9a6648'; c.beginPath(); c.arc(F.x - 100, F.y + 78, 19, 0, 7); c.arc(F.x + 36, F.y + 96, 19, 0, 7); c.fill();
    },
    face: function (c, t, lt) {
      var cam = C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.06 * C.prog(t, B(7), B(10)) }, t), t), k12 = C.T12(t);
      C.withCam(cam, function () {
        faceBg(c, t, GROUND.deep, 1010, 440, 'rgba(217,169,51,1)', 0.18, k12 * 0.05);
        var o = CAST.withTake({ face: 'worried', look: [0.3, 0.8], t: t, R: [690, 800], L: [720, 880], tilt: 0.02, flip: true }, 'sag', t, B(8) - 0.4);
        if (t >= B(9) - 0.04) o.face = 'smile';
        bigSunanda(c, 1010, 440, 28, o);
        // the first batch photo, held at her chest
        c.save(); c.translate(430, 760); c.rotate(-0.05); pc(-290, -230, 580, 460, function (g) { framePiece(g, -260, -200, 520, 390, function (x, y, w, h) { photo2009(g, x, y, w, h); }, 453); }); c.restore();
      });
    },
    events: [[0.1, 'pop'], [B(1) - 0.05, 'pop'], [0.85, 'swish'], [1.0, 'swish'], [1.15, 'swish'], [B(3), 'swish'], [B(4) - 0.45, 'whooshIn'], [B(4), 'clank'], [B(5), 'swish'], [B(5) + 0.55, 'click'], [B(6) + 0.1, 'swish'], [B(7) - 0.03, 'swish'], [B(7), 'pop'], [B(8), 'popLow', 0]]
  };

  /* ================= THE SCENE ================= */
  function stampsFor(D, t, sh, cam0) { // ink stamps in screen space, each on its own cream plate; returns nothing, draws on C.ctx
    var c = C.ctx; (D.stamps || []).forEach(function (s) {
      var home = shotAt(s.at, D.shots); if (t >= home.b + 1e-6 || sh !== home) return;
      var p = C.prog(t, s.at - 0.12, s.at + 0.12); if (p <= 0) return;
      stampPlate(c, s.x, s.y, s.plate[0], s.plate[1], s.rot, p); C.inkStamp(s.text, s.x, s.y, p, { size: s.size, col: s.col, rot: s.rot, seed: 5 });
      if (t > s.at) { c.save(); c.globalAlpha *= 1 - C.prog(t, s.at + 0.3, s.at + 1.0); C.confetti(21, C.T12(t), K.amber, 16, [300, 80, 1400, 600]); c.restore(); }
    });
  }
  function drawOffice(c, t, road, E, D) {
    var sh = shotAt(t, D.shots), st = D.state ? D.state(t) : {}, cam;
    st.ground = D.ground ? D.ground(t, sh) : GROUND.teal; st.clock = D.clock(t); st.wallK = D.wallK ? D.wallK(sh) : 0.8;
    if (D.afterSun) st.afterSun = D.afterSun;
    if (sh.k === 'insert') D.insert(c, t, t - sh.a);
    else if (sh.k === 'face' || sh.k === 'cface') D.face(c, t, t - sh.a);
    else if (sh.k === 'corridor') D.corridor(c, t, sh);
    else {
      var sunFn = D.sun(t, st); st.sun = function () { sunFn(); };
      if (D.after) st.after = D.after;
      cam = C.bump(C.drift(D.cam ? D.cam(sh, t) : { x: 960, y: 540, z: 1 }, t), t);
      (D.stamps || []).forEach(function (s) { if (shotAt(s.at, D.shots) === sh) cam = C.shake(cam, t, s.at); });
      officeLayers(c, t, E, road, cam, st);
      stampsFor(D, t, sh, cam);
    }
    if (sh.k === 'corridor') stampsFor(D, t, sh, null);
    // the place banner pops on beat 1 and leaves with the first close-up cut
    var bp = C.prog(C.T12(t), B(1), B(1) + 0.3) * (1 - C.prog(t, B(5) - 0.08, B(5)));
    if (bp > 0) C.banner('Sunanda\'s office · 2034', 1250, 60, { size: 46, rot: -0.02, bg: K.cream, fg: K.ink, p: bp, seed: 9 });
  }
  PLACES.office = { dur: DUR, year: 2034, hud: 'year', draw: function (ctx, t, road) {
    C.use(ctx); var c = ctx, E = endOf(road), D = DIR[E]; c.save();
    drawOffice(c, t, road, E, D);
    cap(c, D.caps[0], t, 0.3, 3.0); cap(c, D.caps[1], t, 3.1, DUR - 0.2);
    c.restore();
  }, events: function (road) { return (DIR[endOf(road)].events || []).slice(); } };
  DIR.trusted.insert = insertTrusted; DIR.trusted.face = faceTrusted;
  DIR.trusted.events = [[0.12, 'zip', 1], [0.34, 'pop'], [B(1) - 0.05, 'pop'], [0.8, 'notify'], [B(3) - 0.03, 'swish'], [B(3), 'pop'], [B(3) + 0.3, 'popLow', 1], [B(3) + 0.7, 'notify'], [B(4) - 0.45, 'whooshIn'], [B(4), 'clank'], [B(5) - 0.03, 'swish'], [B(5), 'pop'], [B(6), 'notify'], [B(7) - 0.02, 'pop'], [B(8), 'swish'], [B(8) + 0.45, 'click'], [B(9), 'switch']];
  DIR.trusted.stamps = [{ at: B(4), text: 'Waiting list', x: 1010, y: 480, size: 120, col: K.maroon, rot: -0.08, plate: [700, 190] }];
})(typeof window !== 'undefined' ? window : globalThis);
