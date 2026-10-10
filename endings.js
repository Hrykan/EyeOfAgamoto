/* endings.js — the four 2036 films (end-build-retrain, end-build-cut, end-ban-retrain, end-ban-cut) + rewind (animotion v3).
   Each end clip is 12 s on the 96 bpm grid: flash from the 2034 office → wide classroom (title banner) → push-in to the key thing →
   big-face cameo with a four-beat take → the student count as a wall of heads + ink stamp (whooshIn → clank, camera shake) →
   pull-out → closing shot with ring, callout and the closing line. Cardboard ground per shot, cut-outs with white rims at three
   parallax depths. Pure functions of (t, road). Join: t < 0.05 draws the last frame of mid-<road> (the office) — never a hard-coded time. */
(function (root) {
  'use strict';
  var CLIPS = root.CLIPS = root.CLIPS || {};
  var P = C.PALETTE, W = 1920, H = 1080, END_DUR = 12, PI = Math.PI, BEAT = C.BEAT;
  function B(n) { return n * BEAT; }
  var K = { cream: '#f4ead7', ink: '#1f1b18', teal: '#2f7f7a', tealD: '#1d5552', mustard: '#d9a933', saffron: '#e0863e', maroon: '#8c2a2a', wood: '#8a5a3b', amber: '#f4b860' };
  var RIM = '#fffdf7';
  var TAGCOL = { trusted: K.teal, lean: K.saffron, smaller: K.mustard, empty: '#4b6fa8' };
  var STAMPCOL = { trusted: '#1d5552', lean: '#1d5552', smaller: '#8c5a1a', empty: '#2b3f66' };
  var ED = {                                   // per-ending look: a bold cardboard ground + the room's own light
    trusted: { ground: '#d9a933', ground2: '#f0c24f', wall: '#f3e6c8', floor: '#c99a6b', sky: ['#8fb6d8', '#f8d79a'], sun: 'rgba(255,236,170,1)', clock: [6, 55], tod: 'day' },
    lean: { ground: '#2f7f7a', ground2: '#3b948d', wall: '#e3ece8', floor: '#aab3a2', sky: ['#9fd0e6', '#e8f4ee'], sun: 'rgba(210,245,240,1)', clock: [9, 5], tod: 'day' },
    smaller: { ground: '#e0863e', ground2: '#eb9a55', wall: '#f1dcba', floor: '#b98f62', sky: ['#e9a77c', '#fbd9a0'], sun: 'rgba(255,214,150,1)', clock: [4, 40], tod: 'dusk' },
    empty: { ground: '#3d5a80', ground2: '#4f6f98', wall: '#d3d8de', floor: '#a98a6b', sky: ['#7f94c4', '#f2b9a6'], sun: 'rgba(255,190,170,1)', clock: [6, 5], tod: 'dawn' }
  };
  function endId(road) { return road.ending || (road.endingInfo && road.endingInfo.id) || 'smaller'; }

  /* ---------- helpers ---------- */
  function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, f) { return a + (b - a) * f; }
  function step(t, kf) { var v = kf[0][1]; for (var i = 0; i < kf.length; i++) if (t >= kf[i][0]) v = kf[i][1]; return v; }
  function ramp(t, kf) { if (t <= kf[0][0]) return kf[0][1]; for (var i = 0; i < kf.length - 1; i++) if (t < kf[i + 1][0]) return mix(kf[i][1], kf[i + 1][1], C.ease((t - kf[i][0]) / (kf[i + 1][0] - kf[i][0]))); return kf[kf.length - 1][1]; }
  function lcam(cam, k) { return { x: 960 + (cam.x - 960) * k, y: 540 + (cam.y - 540) * k, z: 1 + (cam.z - 1) * k }; }
  function layer(cam, k, fn) { C.withCam(lcam(cam, k), fn); }
  function pc(x, y, w, h, fn, o) { C.sticker(x, y, w, h, function (g) { g.translate(-x, -y); fn(g); }, Object.assign({ rim: RIM, rimW: 6 }, o || {})); }
  function sheet(x, y, w, h, seed, fill, o) { C.paperPiece(C.tornRect2(x, y, w, h, seed, 6), fill, Object.assign({ dots: '#000', dotA: 0.1, grain: 0.22 }, o || {})); }
  function ntxt(c, s, x, y, size, col, weight, align) { c.save(); c.font = (weight || 500) + ' ' + size + 'px ' + C.FONTS.label; c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); c.restore(); }
  function labelW(c, text, size, weight) { c.save(); c.font = (weight || 700) + ' ' + size + 'px ' + C.FONTS.label; var w = c.measureText(String(text).toUpperCase()).width; c.restore(); return w; }
  function shotAt(t, shots) { for (var i = 0; i < shots.length; i++) if (t < shots[i].b) return shots[i]; return shots[shots.length - 1]; }
  function camAt(t, sh, k0, k1) { var f = C.ease(C.clamp((t - sh.a) / (sh.b - sh.a), 0, 1)); return { x: mix(k0[0], k1[0], f), y: mix(k0[1], k1[1], f), z: mix(k0[2], k1[2], f) }; }
  function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }
  function pct(a, b) { return Math.round((a / b - 1) * 100); }

  /* two-link arm solver (as in places-sunanda.js): [shoulder, elbow] so the hand reaches world (tx, ty) */
  var L1 = 15.5, L2 = 14.5;
  function reach(f, tx, ty, far) {
    var s = f.h / 100, b = f.b || 1.0, fl = f.flip ? -1 : 1, hipY = f.pose === 'sit' ? 0 : -44, lean = f.lean || 0;
    var ux = (tx - f.x) / s * fl, uy = (ty - f.y) / s, dx = ux, dy = uy - hipY, cs = Math.cos(-lean), sn = Math.sin(-lean);
    var bx = dx * cs - dy * sn, by = hipY + dx * sn + dy * cs;
    var sx = (far ? -11 : 11) * b, sy = hipY - 28 + 1.5, vx = bx - sx, vy = by - sy, d = Math.hypot(vx, vy), dmax = L1 + L2 - 0.4;
    if (d > dmax) { vx *= dmax / d; vy *= dmax / d; d = dmax; }
    if (d < 7) { vx *= 7 / Math.max(d, 1e-3); vy *= 7 / Math.max(d, 1e-3); d = 7; }
    var th = Math.atan2(vx, vy), dl = Math.acos(cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), s1 = th - dl;
    var ex = sx + Math.sin(s1) * L1, ey = sy + Math.cos(s1) * L1, s2 = Math.atan2(sx + vx - ex, sy + vy - ey);
    return [s1, s2 - s1];
  }
  function actor(c, who, f, o) { // a named/extra character with hands aimed at world targets o.R / o.L
    var oo = Object.assign({ pose: f.pose || 'stand', flip: !!f.flip, lean: f.lean || 0, t: f.t }, o), ff = { x: f.x, y: f.y, h: f.h, pose: oo.pose, flip: oo.flip, lean: oo.lean };
    if (o.R) oo.armR = reach(ff, o.R[0], o.R[1], false);
    if (o.L) oo.armL = reach(ff, o.L[0], o.L[1], true);
    return CAST.draw(c, who, f.x, f.y, f.h, oo);
  }
  // a figure drawn huge so the head fills the frame: head centre (hx, hy), s = h/100
  function bigFigure(c, who, hx, hy, s, o) {
    var flip = o.flip !== false, pose = o.pose || 'stand', hipY = pose === 'sit' ? 0 : -44, headY = hipY - 44, f = { x: hx + (flip ? 1.5 * s : -1.5 * s), y: hy - headY * s, h: s * 100, pose: pose, flip: flip, t: o.t, lean: o.lean || 0 };
    return actor(c, who, f, Object.assign({ pivot: 'chest' }, o));
  }

  /* ================= THE 2036 CLASSROOM, CUT FROM PAPER ================= */
  var LAYOUT = { window: { x: 60, y: 110, w: 540, h: 410 }, board: { x: 660, y: 140, w: 640, h: 330 }, screen: { x: 990, y: 175, w: 280, h: 230 }, notice: { x: 1400, y: 140, w: 440, h: 330 } };
  var ROWS = [{ y: 620, s: 0.8 }, { y: 765, s: 0.96 }, { y: 910, s: 1.12 }], COLS = 8;
  function deskXY(r, c) { return { x: 215 + c * 212, y: ROWS[r].y, s: ROWS[r].s }; }
  function occupied(E, r, c) {
    if (E === 'smaller') return c < 4;
    if (E === 'empty') return r === 0 && (c === 2 || c === 3 || c === 4);
    return true;
  }
  function windowPiece(c, E, t) {
    var w = LAYOUT.window, d = ED[E], img = C.IMG('pune-night'), i, r;
    C.rect(w.x - 14, w.y - 14, w.w + 28, w.h + 28, K.wood, 3, { rough: 3, shadow: false });
    c.save(); c.beginPath(); c.rect(w.x, w.y, w.w, w.h); c.clip();
    if (E === 'empty' && img) { // dawn over Pune: the night photo, warmed
      var ir = img.naturalWidth / img.naturalHeight, ch = w.h, cw = ch * ir; c.filter = 'saturate(1.1) brightness(1.15)'; c.drawImage(img, w.x - (cw - w.w) * 0.55, w.y, cw, ch); c.filter = 'none';
      var gg = c.createLinearGradient(0, w.y, 0, w.y + w.h); gg.addColorStop(0, 'rgba(120,140,200,0.45)'); gg.addColorStop(1, 'rgba(255,170,150,0.35)'); c.fillStyle = gg; c.fillRect(w.x, w.y, w.w, w.h);
    } else {
      var g = c.createLinearGradient(0, w.y, 0, w.y + w.h); g.addColorStop(0, d.sky[0]); g.addColorStop(1, d.sky[1]); c.fillStyle = g; c.fillRect(w.x, w.y, w.w, w.h);
      c.fillStyle = 'rgba(255,248,214,0.9)'; c.beginPath(); c.arc(w.x + 400 + Math.sin(C.T12(t) * 0.3) * 4, w.y + (d.tod === 'dusk' ? 250 : 110), 44, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(w.x + 160 + Math.sin(C.T12(t) * 0.25) * 14, w.y + 90, 70, 20, 0, 0, 7); c.fill();
      r = C.rand(9); var bx = w.x - 10;
      while (bx < w.x + w.w) { var bw = 40 + r() * 46, bh = 70 + r() * 150; c.fillStyle = ['#2f7f7a', '#1d5552', '#4a6d6a'][(bx | 0) % 3]; c.fillRect(bx, w.y + w.h - bh, bw, bh);
        if (r() > 0.5) { c.fillStyle = 'rgba(255,240,200,.6)'; for (var wy = w.y + w.h - bh + 12; wy < w.y + w.h - 14; wy += 24) c.fillRect(bx + 8, wy, 8, 10); } bx += bw + 3; }
    }
    c.restore();
    c.fillStyle = K.wood; c.fillRect(w.x + w.w / 2 - 5, w.y, 10, w.h); c.fillRect(w.x, w.y + w.h * 0.45, w.w, 9);
  }
  function boardPiece(c, E, t) {
    var b = LAYOUT.board; C.rect(b.x - 12, b.y - 12, b.w + 24, b.h + 24, K.wood, 4, { rough: 3, shadow: false }); C.rect(b.x, b.y, b.w, b.h, '#26433f', 5, { halftone: 0.2, shadow: false });
    c.save(); c.globalAlpha *= 0.85; ntxt(c, 'PHYSICS · MOTION', b.x + 30, b.y + 40, 40, K.cream, 700); ntxt(c, 'v = u + at', b.x + 30, b.y + 110, 46, K.cream, 500); ntxt(c, 'F = m a', b.x + 30, b.y + 190, 46, K.cream, 500);
    c.strokeStyle = K.cream; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x + 30, b.y + 240); c.quadraticCurveTo(b.x + 160, b.y + 215, b.x + 280, b.y + 250); c.stroke();
    if (E === 'empty') { var line = 'A body at rest stays at rest', n = Math.floor(line.length * C.prog(t, B(16) + 0.15, B(16) + 1.6)); ntxt(c, line.slice(0, n), b.x + 30, b.y + 290, 36, '#fff6dc', 500); }
    c.restore();
  }
  // the AI "struggle map": cells spring in; `dots` = 60 student dots instead of the heat grid (lean)
  function screenPiece(c, E, t, t0, dots) {
    var s = LAYOUT.screen, i, j; C.rect(s.x, s.y, s.w, s.h, '#16302d', 6, { rough: 2, shadow: false });
    ntxt(c, dots ? 'one screen · 60 students' : 'struggle map', s.x + 16, s.y + 20, 20, K.cream, 500);
    var k = C.T12(t);
    if (dots) {
      for (i = 0; i < 60; i++) { var p = C.prog(t, t0 + i * 0.008, t0 + i * 0.008 + 0.2), cx = s.x + 28 + (i % 10) * 25, cy = s.y + 56 + Math.floor(i / 10) * 28; if (p > 0) C.popIn(cx, cy, p, function () { c.fillStyle = i % 9 === 4 ? '#f4b860' : '#8fd8ff'; c.beginPath(); c.arc(cx, cy, 8, 0, 7); c.fill(); c.fillRect(cx - 9, cy + 8, 18, 6); }); }
      return;
    }
    for (j = 0; j < 4; j++) for (i = 0; i < 6; i++) {
      var p2 = C.prog(t, t0 + (j * 6 + i) * 0.012, t0 + (j * 6 + i) * 0.012 + 0.2), v = Math.sin(i * 1.7 + j * 2.3 + k * 0.9), cx2 = s.x + 34 + i * 42, cy2 = s.y + 60 + j * 45;
      if (p2 > 0) C.popIn(cx2, cy2, p2, function () { c.fillStyle = v > 0.4 ? P.green : v > -0.3 ? P.mustard : P.coral; c.fillRect(cx2 - 18, cy2 - 19, 36, 38); });
    }
  }
  function fmtINR(f) { return '₹' + (Math.round(f / 500) * 500).toLocaleString('en-IN'); }
  function noticePiece(c, E, t, road) {
    var n = LAYOUT.notice; C.rect(n.x - 10, n.y - 10, n.w + 20, n.h + 20, K.wood, 8, { rough: 3, shadow: false }); C.rect(n.x, n.y, n.w, n.h, '#c19460', 9, { shadow: false });
    var notes = [[1430, 170, 120, 90, K.cream, -3], [1580, 180, 110, 130, K.mustard, 4], [1720, 165, 100, 100, K.cream, -2], [1440, 300, 130, 110, P.coral, 3], [1600, 330, 150, 100, K.cream, -4], [1740, 320, 90, 120, K.teal, 2]];
    if (E === 'lean') notes.splice(1, 4);
    notes.forEach(function (p, q) { c.save(); c.translate(p[0] + p[2] / 2, p[1] + p[3] / 2); c.rotate(p[5] * PI / 180); C.paperPiece(C.tornRect2(-p[2] / 2, -p[3] / 2, p[2], p[3], 20 + q, 2), p[4], { shadow: false }); c.fillStyle = K.ink; c.globalAlpha *= 0.5; for (var i = 0; i < 4; i++) c.fillRect(-p[2] / 2 + 12, -p[3] / 2 + 18 + i * 16, p[2] - 24 - (i % 2) * 20, 4); c.restore(); });
    if (E === 'lean') feeCard(c, road, t);
  }
  function feeCard(c, road, t) { // lean: the fee drops; the number is a thing on the notice board
    var f0 = Agamoto.at(road, 2026).fees, f1 = Agamoto.at(road, 2036).fees, p = C.prog(t, B(16) + 0.05, B(16) + 0.5);
    c.save(); c.translate(1630, 300); c.rotate(-0.03); C.paperPiece(C.tornRect2(-160, -120, 320, 240, 806, 3), K.cream, { shadow: false }); ntxt(c, 'FEES', -128, -92, 28, K.maroon, 800);
    ntxt(c, fmtINR(f0), -128, -40, 44, 'rgba(31,27,24,0.45)', 800); c.strokeStyle = K.maroon; c.lineWidth = 6; c.beginPath(); c.moveTo(-136, -38); c.lineTo(-136 + 170 * C.easeOut(p), -42); c.stroke();
    c.save(); C.popIn(-10, 50, p, function () { ntxt(c, fmtINR(f1), -128, 46, 72 * C.countScale(1, 0, 1, 1, 1), K.tealD, 800); }); c.restore();
    c.fillStyle = K.teal; c.beginPath(); c.moveTo(110, 20); c.lineTo(140, 20); c.lineTo(140, 70); c.lineTo(160, 70); c.lineTo(125, 105); c.lineTo(90, 70); c.lineTo(110, 70); c.closePath(); c.fill(); c.restore();
  }
  function clockPiece(c, hr, mn, t) {
    var x = 1350, y = 90, r = 44; c.fillStyle = K.wood; c.beginPath(); c.arc(x, y, r + 7, 0, 7); c.fill(); c.fillStyle = '#efe5cd'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = K.ink; c.lineWidth = 2.5; for (var i = 0; i < 12; i++) { var a = i * PI / 6; c.beginPath(); c.moveTo(x + Math.sin(a) * (r - 5), y - Math.cos(a) * (r - 5)); c.lineTo(x + Math.sin(a) * (r - 10), y - Math.cos(a) * (r - 10)); c.stroke(); }
    var ha = (hr % 12 + mn / 60) * PI / 6, ma = mn * PI / 30, sa = Math.floor(t) * PI / 30 * 6 / 6 * 6; c.lineCap = 'round'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ha) * 22, y - Math.cos(ha) * 22); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ma) * 34, y - Math.cos(ma) * 34); c.stroke();
    c.strokeStyle = '#a8482a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(sa) * 36, y - Math.cos(sa) * 36); c.stroke();
  }
  function deskRow(c, E, r, t, o) { // one row of desks with their students, as a single cut-out
    var sc = ROWS[r].s, y0 = ROWS[r].y;
    pc(40, y0 - 230 * sc, 1860, 330 * sc, function (g) {
      for (var cc = 0; cc < COLS; cc++) {
        var d = deskXY(r, cc), i = r * COLS + cc, n = occupied(E, r, cc) ? (E === 'lean' ? 2 : 1) : 0, who;
        for (var q = 0; q < n; q++) {
          who = 'extra:' + (100 + i * 3 + q); var face = ['smile', 'neutral', 'focused', 'smile', 'neutral'][(i + q) % 5];
          if (o && o.cameo && o.cameo(r, cc, q)) continue;
          CAST.draw(g, who, d.x + (q ? 52 : (n > 1 ? -36 : 0)) * sc, d.y - 6 * sc, 265 * sc, Object.assign({ pose: 'sit', face: face, t: t + i * 0.7, flip: (i + q) % 2 === 1, look: [0.2 * ((i + q) % 3 - 1), 0.5] }, (i + q) % 3 === 0 ? CAST.ARMS.write : {}));
        }
        C.paperPiece(C.tornRect2(d.x - 75 * sc, d.y - 26 * sc, 150 * sc, 20 * sc, 40 + i, 1.5), '#c08652', { shadow: false });
        C.paperPiece(C.tornRect2(d.x - 69 * sc, d.y - 6 * sc, 138 * sc, 44 * sc, 70 + i, 2), K.wood, { shadow: false, dots: '#1e0c04', dotA: 0.15 });
      }
    });
  }

  // camera that centres layer k on (x, y) at zoom z (so a cut-out on the wall layer can be framed exactly)
  function camTo(x, y, z, k) { k = k || 0.8; return { x: 960 + (x - 960) / k, y: 540 + (y - 540) / k, z: 1 + (z - 1) / k }; }

  /* ---------- who is in the room (stickers, drawn between the desk rows) ---------- */
  function figure(c, who, f, o) { // a standing person as a cut-out
    pc(f.x - 190, f.y - f.h * 1.08, 380, f.h * 1.16, function (g) { actor(g, who, Object.assign({ pose: 'stand', t: f.t }, f), o); });
  }
  function people(E, t) { // [{layer: -1 behind row 0 | 0 | 1 | 2, draw(c)}]
    var L = [], k = C.T12(t);
    if (E === 'trusted') {
      L.push({ layer: -1, draw: function (c) { figure(c, 'sunanda', { x: 800, y: 600, h: 270, flip: false, t: t }, Object.assign({ face: 'talk', holdR: 'chalk' }, CAST.ARMS.point)); } });
      L.push({ layer: 0, draw: function (c) { figure(c, 'extra:2', { x: 1010, y: 700, h: 290, flip: true, lean: 0.14, t: t }, { face: 'smile', armR: [0.45, 0.8] }); } });
      L.push({ layer: 0, draw: function (c) { figure(c, 'extra:7', { x: 270, y: 705, h: 285, flip: false, lean: 0.12, t: t }, { face: 'smile', armR: [0.4, 0.9] }); } });
      L.push({ layer: 1, draw: function (c) { figure(c, 'extra:5', { x: 470, y: 850, h: 310, flip: false, lean: 0.14, t: t }, { face: 'smile', armR: [0.4, 0.9] }); } });
      L.push({ layer: 1, draw: function (c) { figure(c, 'aarav', { x: 1330, y: 815, h: 335, flip: true, lean: 0.12, t: t }, { face: 'smile', holdR: 'tablet', glow: 1, R: [1262, 650], L: [1285, 700] }); } });
      L.push({ layer: 1, draw: function (c) { figure(c, 'meera', { x: 1500, y: 812, h: 320, flip: true, t: t }, Object.assign({ face: 'smile' }, CAST.ARMS.hips)); } });
    } else if (E === 'lean') {
      L.push({ layer: -1, draw: function (c) { figure(c, 'extra:2', { x: 1130, y: 600, h: 290, flip: false, t: t }, Object.assign({ face: 'focused', holdR: 'tablet', glow: 1 }, CAST.ARMS.point)); } });
    } else if (E === 'smaller') {
      L.push({ layer: -1, draw: function (c) { figure(c, 'meera', { x: 760, y: 600, h: 285, flip: false, t: t }, Object.assign({ face: 'talk', holdR: 'chalk' }, CAST.ARMS.point)); } });
    } else {
      L.push({ layer: -1, draw: function (c) { figure(c, 'sunanda', { x: 900, y: 600, h: 280, flip: false, t: t }, Object.assign({ face: 'talk', holdR: 'chalk' }, CAST.ARMS.point)); } });
    }
    return L;
  }
  function meeraDesk(c) { // lean: the teachers' table, Meera's chair pushed in, her name strip left behind
    C.paperPiece(C.tornRect2(1480, 640, 340, 40, 801, 3), K.wood, { shadow: false }); C.paperPiece(C.tornRect2(1500, 680, 300, 150, 802, 3), '#6a4a30', { shadow: false });
    C.paperPiece(C.tornRect2(1540, 560, 90, 80, 803, 2), '#3a4f6a', { shadow: false }); C.paperPiece(C.tornRect2(1660, 450, 140, 190, 804, 2), '#8c6a4a', { shadow: false });
    C.paperPiece(C.tornRect2(1520, 600, 190, 38, 805, 2), K.cream, { shadow: false }); ntxt(c, 'MEERA D. · CHEMISTRY', 1615, 619, 22, K.ink, 800, 'center');
  }

  /* ---------- the lit room: far wall · wall pieces · desks and people · near dust ---------- */
  function roomLayers(c, t, E, road, cam, S) {
    var d = ED[E], k12 = C.T12(t), i, ppl = people(E, t);
    C.cardboard(d.ground, 0.34);
    layer(cam, 0.55, function () {
      sheet(-420, -240, 2800, 830, 901, d.wall, { dotA: 0.08, blur: 22 });
      for (i = 0; i < 7; i++) sheet(-260 + i * 340, -240, 170, 830, 910 + i, i % 2 ? mixHex(d.wall, '#ffffff', 0.15) : mixHex(d.wall, '#000000', 0.05), { shadow: false, dotA: 0.06, grain: 0.15 });
      sheet(-420, 520, 2800, 44, 902, K.wood, { dotA: 0.2, blur: 10 }); sheet(-420, 556, 2800, 700, 903, d.floor, { dotA: 0.18, blur: 18 });
      C.sunburst(330, 330, 80, 1900, 22, d.sun, E === 'empty' ? 0.16 : 0.12, k12 * 0.04);
    });
    layer(cam, S.wallK || 0.8, function () {
      pc(30, 80, 600, 470, function (cc) { windowPiece(cc, E, t); });
      pc(630, 110, 700, 390, function (cc) { boardPiece(cc, E, t); });
      if (E === 'trusted' || E === 'lean') pc(960, 150, 340, 290, function (cc) { screenPiece(cc, E, t, S.screenT0, E === 'lean'); });
      pc(1380, 120, 480, 370, function (cc) { noticePiece(cc, E, t, road); });
      pc(1285, 30, 130, 130, function (cc) { clockPiece(cc, ED[E].clock[0], ED[E].clock[1] + 8 * t / 12, t); });
      if (E === 'lean') pc(1460, 420, 380, 430, function (cc) { meeraDesk(cc); });
    });
    layer(cam, 1, function () {
      function drawLayer(n) { ppl.forEach(function (p) { if (p.layer === n) p.draw(c); }); }
      drawLayer(-1); deskRow(c, E, 0, t); drawLayer(0); deskRow(c, E, 1, t); drawLayer(1); deskRow(c, E, 2, t); drawLayer(2);
      if (E === 'smaller' || E === 'empty') { c.save(); c.globalAlpha *= 0.55; C.confetti(81, k12 * 0.3, '#fff6dc', 20, [900, 560, 900, 420]); c.restore(); }   // dust in the empty half
    });
    layer(cam, 1.4, function () {
      var sw = Math.sin(k12 * 0.8) * 0.03; c.save(); c.translate(-40, 1060); c.rotate(-0.15 + sw);
      for (i = 0; i < 4; i++) { c.save(); c.rotate(-0.1 + i * 0.32); C.paperPiece([[0, 0], [90, -70], [260, -30], [330, 40], [190, 30], [60, 40]].map(function (q) { return [q[0] * 0.8, q[1] * 0.8]; }), i % 2 ? '#1c6a58' : '#14554a', { dots: '#000', dotA: 0.2, blur: 18 }); c.restore(); } c.restore();
      c.save(); c.globalAlpha *= 0.4; C.confetti(33, k12 * 0.5, '#ffffff', 10, [100, 80, 1700, 800]); c.restore();
    });
  }
  function mixHex(a, b, f) { var A = parseInt(a.slice(1), 16), Bb = parseInt(b.slice(1), 16), r = mix(A >> 16 & 255, Bb >> 16 & 255, f), g = mix(A >> 8 & 255, Bb >> 8 & 255, f), bl = mix(A & 255, Bb & 255, f); return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(bl) + ')'; }

  /* ---------- the corridor at dawn (empty): one lit door among closed ones ---------- */
  function doorSticker(c, x, lit, label, st) {
    C.rect(x - 112, 236, 224, 540, '#3d2917', 650 + x, { rough: 3, shadow: false }); C.rect(x - 100, 250, 200, 520, '#7a5333', 651 + x, { rough: 2, shadow: false, halftone: 0.5, dot: 'rgba(30,12,4,0.25)' }); C.rect(x - 78, 560, 156, 180, '#6a4627', 652 + x, { rough: 2, shadow: false });
    c.save(); c.beginPath(); c.rect(x - 64, 288, 128, 236); c.clip(); c.fillStyle = '#16303a'; c.fillRect(x - 64, 288, 128, 236);
    if (lit) { var lg = c.createLinearGradient(0, 288, 0, 524); lg.addColorStop(0, 'rgba(255,224,160,0.96)'); lg.addColorStop(1, 'rgba(255,196,130,0.9)'); c.fillStyle = lg; c.fillRect(x - 64, 288, 128, 236);
      // inside: the board, Sunanda, three students at the front desks
      c.fillStyle = '#26433f'; c.fillRect(x - 56, 296, 112, 54); CAST.draw(c, 'sunanda', x - 20, 470, 190, { pose: 'stand', face: 'talk', t: st, blink: false, armR: CAST.ARMS.point.armR, holdR: 'chalk' });
      for (var q = 0; q < 3; q++) { CAST.draw(c, 'extra:' + (200 + q), x - 40 + q * 36, 520, 100, { pose: 'sit', face: 'focused', t: st + q, blink: false, flip: q % 2 }); c.fillStyle = '#8a5a3b'; c.fillRect(x - 56 + q * 36, 500, 34, 6); }
    } else { c.fillStyle = 'rgba(40,70,85,0.9)'; for (var r = 0; r < 3; r++) for (var q2 = 0; q2 < 3; q2++) c.fillRect(x - 56 + q2 * 40 + r * 4, 420 + r * 34, 30, 14); }
    c.restore();
    c.strokeStyle = '#2b1b0e'; c.lineWidth = 6; c.strokeRect(x - 64, 288, 128, 236); c.beginPath(); c.moveTo(x, 288); c.lineTo(x, 524); c.stroke();
    C.paperPiece(C.tornRect2(x - 44, 256, 88, 26, 653 + x, 1), lit ? K.mustard : '#d6c9a8', { shadow: false }); ntxt(c, label, x, 269, 18, K.ink, 800, 'center');
    if (!lit) { c.save(); c.translate(x, 600); c.rotate(((x / 7) % 5 - 2) * 0.02); C.paperPiece(C.tornRect2(-52, -34, 104, 68, 660 + x, 2), K.cream, { shadow: false }); ntxt(c, 'BATCH', 0, -14, 20, K.ink, 800, 'center'); ntxt(c, 'CLOSED', 0, 12, 24, K.maroon, 800, 'center'); c.restore(); c.fillStyle = '#9aa0a6'; c.beginPath(); c.arc(x + 70, 640, 9, 0, 7); c.fill(); c.fillRect(x + 62, 646, 16, 14); }
  }
  var DOORX = [250, 520, 790, 1060, 1330, 1600];
  function roomsBoard(c, t, t0, nUse) { // the 40 rooms of 2026, nUse still in use (students 2036 / students 2026): a pictogram
    C.paperPiece(C.tornRect2(0, 0, 420, 330, 701, 3), K.cream, { shadow: false }); ntxt(c, 'ROOMS IN USE', 210, 30, 28, K.ink, 800, 'center'); ntxt(c, nUse + ' of 40', 210, 62, 24, K.maroon, 800, 'center');
    for (var i = 0; i < 40; i++) { var p = C.prog(t, t0 + i * 0.008, t0 + i * 0.008 + 0.15), cx = 30 + (i % 8) * 46, cy = 100 + Math.floor(i / 8) * 44, on = i < nUse; if (p > 0) C.popIn(cx + 16, cy + 18, p, function () { c.fillStyle = on ? K.mustard : 'rgba(31,27,24,0.22)'; c.fillRect(cx, cy, 32, 36); c.fillStyle = on ? '#fff3c8' : 'rgba(31,27,24,0.3)'; c.fillRect(cx + 6, cy + 6, 20, 14); }); }
  }
  function corridor2036(c, t, cam, S) {
    var i, k12 = C.T12(t); C.cardboard(ED.empty.ground, 0.38);
    layer(cam, 0.55, function () {
      sheet(-420, -240, 3200, 1010, 1001, '#cfd6e0', { dotA: 0.08, blur: 22 });
      for (i = 0; i < 9; i++) sheet(-260 + i * 340, -240, 170, 1010, 1010 + i, i % 2 ? '#d9dee6' : '#c6cdd9', { shadow: false, dotA: 0.06, grain: 0.15 });
      sheet(-420, 474, 3200, 300, 1020, '#8d9ab4', { dotA: 0.2, blur: 18 }); sheet(-420, 770, 3200, 400, 1021, '#a98a6b', { dotA: 0.2, blur: 20 });
      C.sunburst(1330, 420, 100, 1900, 20, 'rgba(255,196,130,1)', 0.16, k12 * 0.04);
    });
    layer(cam, 0.85, function () {
      for (i = 0; i < 6; i++) { var xx = DOORX[i], lit = i === 4; pc(xx - 130, 226, 260, 560, function (cc) { doorSticker(cc, xx, lit, 'ROOM ' + (i + 1), t); }); }
      pc(60, 280, 460, 360, function (cc) { cc.save(); cc.translate(70, 290); roomsBoard(cc, t, S.t0 || 0.2, S.nUse); cc.restore(); });
    });
    layer(cam, 1, function () {
      c.save(); c.globalCompositeOperation = 'lighter'; var gr = c.createRadialGradient(1330, 400, 20, 1330, 400, 420); gr.addColorStop(0, 'rgba(255,200,130,0.28)'); gr.addColorStop(1, 'rgba(255,200,130,0)'); c.fillStyle = gr; c.fillRect(900, 0, 900, 900); c.restore();
      c.save(); c.beginPath(); c.moveTo(1230, 772); c.lineTo(1430, 772); c.lineTo(1600, 1040); c.lineTo(1060, 1040); c.closePath(); var fg = c.createLinearGradient(0, 772, 0, 1040); fg.addColorStop(0, 'rgba(255,200,130,0.32)'); fg.addColorStop(1, 'rgba(255,200,130,0)'); c.fillStyle = fg; c.fill(); c.restore();
    });
    layer(cam, 1.4, function () { c.save(); c.globalAlpha *= 0.5; C.confetti(55, k12 * 0.5, '#fff6dc', 12, [200, 100, 1500, 800]); c.restore(); });
  }

  /* ================= THE FILMS ================= */
  var DIR = {};
  var TAKE_AT = B(10) - 0.32;                                  // the take's pop lands on beat 10 (6.25 s)
  function take(base, kind, t) { return CAST.withTake(base, kind, t, TAKE_AT); }
  function faceBg(c, t, ground, hx, hy, sun, a) { C.cardboard(ground, 0.42); C.sunburst(hx, hy, 240, 1900, 24, sun, a, C.T12(t) * 0.05); }
  function nameTag(c, text, x, y, size, bg, fg, t, a) { var p = C.prog(C.T12(t), a, a + 0.3); if (p > 0) C.banner(text, x, y, { size: size, rot: -0.02, bg: bg || K.cream, fg: fg || K.ink, p: p, seed: 9 }); }

  /* ---------- cameos: a big face and a four-beat take ---------- */
  function cameoTrusted(c, t, road) {
    var cam = C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.05 * C.prog(t, B(8), B(11)) }, t), t);
    C.withCam(cam, function () {
      faceBg(c, t, ED.trusted.ground2, 1100, 440, 'rgba(255,240,190,1)', 0.22);
      bigFigure(c, 'meera', 1560, 480, 18, { flip: true, face: step(t, [[-1, 'smile'], [B(10) + 0.1, 'grin']]), t: t, armR: [0.5, 1.4], armL: CAST.ARMS.hips.armL });
      var o = take({ face: 'smile', look: [0.8, 0.6], t: t, flip: false, holdR: 'tablet', glow: 1, R: [900, 910], L: [740, 960], tilt: 0.02 }, 'joy', t);
      bigFigure(c, 'aarav', 620, 520, 24, o);
    });
    nameTag(c, 'Aarav Kale · 24 · Saturday mentor', 900, 92, 52, K.cream, K.ink, t, B(8) + 0.12);
    nameTag(c, 'batch of 2030', 1290, 176, 34, K.teal, '#fff', t, B(8) + 0.4);
  }
  function emptyChair(c) { // Meera's chair pushed in and her name strip left on the table (cut-out, lean cameo)
    C.paperPiece(C.tornRect2(20, 560, 520, 50, 811, 3), K.wood, { shadow: false }); C.paperPiece(C.tornRect2(50, 610, 460, 240, 812, 3), '#6a4a30', { shadow: false });
    C.paperPiece(C.tornRect2(150, 300, 120, 270, 813, 3), '#3a4f6a', { shadow: false }); C.paperPiece(C.tornRect2(130, 520, 200, 50, 814, 3), '#2c3e56', { shadow: false });
    c.save(); c.translate(270, 500); c.rotate(-0.06); C.paperPiece(C.tornRect2(-210, -34, 420, 68, 815, 2), K.cream, { shadow: false }); ntxt(c, 'MEERA D. · CHEMISTRY', 0, 2, 32, K.ink, 800, 'center'); c.restore();
    c.fillStyle = 'rgba(210,225,225,0.8)'; c.beginPath(); c.moveTo(420, 470); c.lineTo(470, 470); c.lineTo(462, 556); c.lineTo(428, 556); c.closePath(); c.fill(); c.fillStyle = '#a8682f'; c.fillRect(428, 500, 34, 50);
  }
  function cameoLean(c, t, road) {
    var cam = C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.05 * C.prog(t, B(8), B(11)) }, t), t);
    C.withCam(cam, function () {
      faceBg(c, t, ED.lean.ground2, 1180, 440, 'rgba(210,245,240,1)', 0.2);
      pc(-40, 260, 700, 640, function (g) { emptyChair(g); });
      var o = take({ face: 'worried', look: step(t, [[-1, [1, 0.1]], [B(10) - 0.05, [0.4, 0.2]]]), t: t, flip: true, armR: CAST.ARMS.down.armR, armL: CAST.ARMS.down.armL, tilt: 0.02 }, 'worry', t);
      bigFigure(c, 'extra:2', 1220, 470, 27, o);
    });
    nameTag(c, 'One teacher · one screen', 1080, 112, 52, K.cream, K.ink, t, B(8) + 0.12);
    nameTag(c, 'Meera left in 2027', 330, 196, 32, K.maroon, '#fff', t, B(8) + 0.4);
  }
  function cameoSmaller(c, t, road) {
    var cam = C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.05 * C.prog(t, B(8), B(11)) }, t), t);
    C.withCam(cam, function () {
      faceBg(c, t, ED.smaller.ground2, 760, 440, 'rgba(255,236,190,1)', 0.2);
      for (var q = 0; q < 3; q++) (function (q) { c.save(); pc(1280 + q * 210 - 120, 560 - q * 20, 300, 520, function (g) { CAST.draw(g, 'extra:' + (310 + q), 1280 + q * 210, 1280 - q * 20, 900, { pose: 'sit', face: q === 1 ? 'smile' : 'focused', t: t + q, flip: true, look: [0.8, 0.2] }); }); c.restore(); })(q);
      var o = take({ face: 'talk', look: [0.5, 0.2], t: t, flip: false, R: [1230, 900], L: [700, 900], tilt: 0.02 }, 'laugh', t);
      if (t < TAKE_AT) o.face = 'talk';
      bigFigure(c, 'meera', 760, 470, 28, o);
    });
    nameTag(c, 'Meera D. · still teaching', 800, 112, 52, K.cream, K.ink, t, B(8) + 0.12);
  }
  function cameoEmpty(c, t, road) {
    var cam = C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.05 * C.prog(t, B(8), B(11)) }, t), t);
    C.withCam(cam, function () {
      faceBg(c, t, ED.empty.ground2, 1000, 440, 'rgba(255,190,170,1)', 0.2);
      for (var q = 0; q < 3; q++) (function (q) { pc(100 + q * 170, 700 - q * 8, 190, 330, function (g) { CAST.draw(g, 'extra:' + (210 + q), 190 + q * 170, 1100 - q * 8, 520, { pose: 'sit', face: 'focused', t: t + q, flip: false, look: [0.6, 0.3] }); }); })(q);
      var o = take({ face: 'tired', look: [0.9, -0.2], t: t, flip: false, holdR: 'chalk', R: [1480, 520], L: [1000, 960], tilt: 0.0 }, 'realize', t);
      bigFigure(c, 'sunanda', 1000, 460, 28, o);
    });
    nameTag(c, 'The 6 a.m. batch · 3 students', 960, 112, 50, K.cream, K.ink, t, B(8) + 0.12);
  }

  /* ---------- the count, as a wall of heads ---------- */
  function numbersShot(c, t, E, road) {
    var d = ED[E], N = Math.round(Agamoto.at(road, 2036).students), base = Math.round(Agamoto.at(road, 2026).students), maxN = Math.max(N, base), rows = 34, cols = Math.ceil(maxN / rows), sp = Math.min(17, 1500 / cols);
    var lt = t - B(11), k12 = C.T12(t), cam = C.shake(C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.04 * C.prog(lt, 0, B(2)) }, t), t), t, B(13));
    C.cardboard(d.ground2, 0.4);
    C.withCam(cam, function () {
      C.sunburst(960, 460, 140, 1900, 24, d.sun, 0.2, k12 * 0.05);
      var w = cols * sp, h = rows * sp, x0 = 960 - w / 2, y0 = 190, pal = [K.teal, K.saffron, K.mustard, '#4b6fa8', P.coral];
      pc(x0 - 20, y0 - 20, w + 40, h + 40, function (g) {
        C.paperPiece(C.tornRect2(x0 - 14, y0 - 14, w + 28, h + 28, 901, 4), K.cream, { shadow: false });
        for (var col = 0; col < 7; col++) {
          g.beginPath();
          for (var i = 0; i < maxN; i++) {
            var colr = i < N ? (i >= base ? 5 : (Math.imul(i + 1, 2654435761) >>> 16) % 5) : 6; if (colr !== col) continue;
            var p = C.prog(lt, 0.02 + (i / maxN) * 0.95, 0.02 + (i / maxN) * 0.95 + 0.12); if (p <= 0) continue;
            var x = x0 + (i % cols) * sp + sp / 2, y = y0 + Math.floor(i / cols) * sp + sp / 2, k = Math.min(1, C.back(p)) * sp / 15;
            g.moveTo(x + 3.4 * k, y - 2 * k); g.arc(x, y - 2 * k, 3.4 * k, 0, 7); g.moveTo(x + 5 * k, y + 4.4 * k); g.ellipse(x, y + 4.4 * k, 5 * k, 3.2 * k, 0, 0, 7);
          }
          g.fillStyle = col < 5 ? pal[col] : col === 5 ? '#ffb43a' : 'rgba(31,27,24,0.2)'; g.fill();
        }
      });
      // the count climbs and its type grows with it
      var n = Math.round(N * C.prog(lt, 0.02, 1.1));
      if (lt > 0.0) C.banner('≈ ' + fmt(n) + ' students', 960, 105, { size: Math.round(66 * C.countScale(n, 0, N, 0.85, 1.35)), rot: -0.02, bg: K.cream, fg: K.ink, p: C.prog(lt, 0, 0.15), seed: 4 });
    });
    // the verdict slams on beat 13
    var delta = pct(N, base), dtxt = (delta >= 0 ? 'up ' : 'down ') + Math.abs(delta) + '%', ps = C.prog(t, B(13) - 0.12, B(13) + 0.12);
    if (ps > 0) { c.save(); c.translate(960, 790); c.rotate(-0.05); var pw = labelW(c, fmt(N) + ' students · ' + dtxt, 84, 800) + 120; c.scale(C.back(C.clamp(ps * 3)), C.back(C.clamp(ps * 3))); pc(-pw / 2, -85, pw, 170, function (g) { C.paperPiece(C.tornRect2(-pw / 2, -85, pw, 170, 61, 5), '#f4ead7', { shadow: false }); }); c.restore();
      C.inkStamp(fmt(N) + ' students · ' + dtxt, 960, 790, ps, { size: 84, col: STAMPCOL[E], rot: -0.05, seed: 5 }); }
    var pf = C.prog(C.T12(t), B(13) + 0.35, B(13) + 0.6); if (pf > 0) C.banner((road.endings[E] || 0) + ' of ' + (road.n || 10) + ' futures end here', 1470, 905, { size: 40, rot: 0.03, bg: TAGCOL[E], fg: E === 'smaller' ? K.ink : '#fff', p: pf, seed: 6 });
  }

  /* ---------- closing shots ---------- */
  function queueShot(c, t, road) { // trusted: parents queue at the door to enrol
    var lt = t - B(16), cam = C.bump(C.drift({ x: 960, y: 540, z: 1 + 0.06 * C.prog(lt, 0, 2.0) }, t), t), k12 = C.T12(t), i;
    C.cardboard(ED.trusted.ground2, 0.36);
    layer(cam, 0.6, function () {
      sheet(-420, -240, 2800, 940, 1101, '#f3e6c8', { dotA: 0.08, blur: 22 }); sheet(-420, 640, 2800, 700, 1102, '#c99a6b', { dotA: 0.18, blur: 18 });
      C.sunburst(1560, 330, 80, 1900, 22, 'rgba(255,236,170,1)', 0.14, k12 * 0.04);
      pc(1380, 100, 420, 560, function (g) { C.rect(1390, 110, 400, 540, '#6a4627', 1103, { rough: 3, shadow: false }); C.rect(1414, 134, 352, 492, '#ffe6a8', 1104, { rough: 2, shadow: false }); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(1430, 150, 150, 460); });
    });
    layer(cam, 0.85, function () { C.popIn(1090, 200, C.prog(lt, 0.05, 0.3), function () { C.banner('Enrolment', 1090, 200, { size: 64, rot: 0.02, bg: K.teal, fg: '#fff', seed: 7 }); }); });
    layer(cam, 1, function () {
      var props = ['sweets', 'phone', 'bag', null, 'sweets', 'phone'];
      for (i = 0; i < 6; i++) {
        var x = 1280 - i * 215 + (i === 0 ? 0 : 0), y = 985, h = 560 + (i % 3) * 30, sh = (lt > 0.1 + i * 0.05) ? 0 : 0;
        (function (i, x, y, h) { var st = C.T12(t), bob = Math.sin(st * 4 + i) * 0.02; pc(x - 190, y - h * 1.06, 380, h * 1.14, function (g) { var o = { pose: 'stand', face: i % 2 ? 'smile' : 'neutral', t: t + i, flip: false, lean: 0.03 + bob, look: [0.8, 0.1] }; if (props[i]) { o.holdR = props[i]; o.armR = [0.9, 1.1]; o.glow = 0; } else o.armR = CAST.ARMS.down.armR; CAST.draw(g, 'extra:' + (300 + i * 3 + 1), x, y, h, o); }); })(i, x, y, h);
      }
      // the table: a register and a pen
      pc(1230, 720, 400, 260, function (g) { C.paperPiece(C.tornRect2(1240, 840, 380, 130, 1105, 3), K.wood, { shadow: false }); C.paperPiece(C.tornRect2(1250, 800, 360, 44, 1106, 3), '#c08652', { shadow: false }); C.paperPiece(C.tornRect2(1290, 768, 160, 34, 1107, 2), K.maroon, { shadow: false }); ntxt(g, 'ENROLMENT', 1370, 786, 22, K.cream, 800, 'center'); });
    });
  }
  function ringAndCallout(c, t, text, ring, callout, t0, bg) {
    var pr = C.prog(t, t0, t0 + 0.3); if (pr > 0) C.markRing2(ring[0], ring[1], ring[2], ring[3], pr, { w: 8 });
    var pc2 = C.prog(t, t0 + 0.2, t0 + 0.6); if (pc2 > 0) C.callout(text, callout[0], callout[1], callout[2], callout[3], pc2, { size: 38, rot: -2, bg: bg || K.mustard });
  }

  /* ---------- the direction of each ending: six shots, cuts on the beat ---------- */
  function shots6() { return [{ a: 0, b: B(3), k: 'wide' }, { a: B(3), b: B(8), k: 'key' }, { a: B(8), b: B(11), k: 'cameo' }, { a: B(11), b: B(14), k: 'numbers' }, { a: B(14), b: B(16), k: 'pull' }, { a: B(16), b: END_DUR + 1, k: 'close' }]; }
  function wideCam(t) { var z = t < 0.9 ? mix(1.8, 1.0, C.easeOut(C.prog(t, 0, 0.9))) : mix(1.0, 1.06, C.prog(t, 0.9, B(3))); return { x: 960, y: 540, z: z }; }
  function pullCam(sh, t, from) { return camAt(t, sh, from, [960, 540, 1.0]); }
  DIR.trusted = {
    shots: shots6(), cameo: cameoTrusted,
    cam: function (sh, t) { if (sh.k === 'wide') return wideCam(t); if (sh.k === 'key') return camAt(t, sh, [camTo(1130, 295, 1.7).x, camTo(1130, 295, 1.7).y, camTo(1130, 295, 1.7).z], [camTo(1130, 295, 1.9).x, camTo(1130, 295, 1.9).y, camTo(1130, 295, 1.9).z]); return pullCam(sh, t, [1400, 790, 1.7]); },
    ring: [960, 520, 380, 330], callout: [1500, 290, 1290, 430], closeRing: [840, 760, 660, 340], closeCallout: [420, 300, 560, 470]
  };
  DIR.lean = {
    shots: shots6(), cameo: cameoLean,
    cam: function (sh, t) { if (sh.k === 'wide') return wideCam(t); if (sh.k === 'key') return camAt(t, sh, [camTo(1130, 295, 1.7).x, camTo(1130, 295, 1.7).y, camTo(1130, 295, 1.7).z], [camTo(1130, 295, 1.9).x, camTo(1130, 295, 1.9).y, camTo(1130, 295, 1.9).z]); if (sh.k === 'close') return camAt(t, sh, [camTo(1630, 320, 1.9).x, camTo(1630, 320, 1.9).y, camTo(1630, 320, 1.9).z], [camTo(1630, 320, 2.05).x, camTo(1630, 320, 2.05).y, camTo(1630, 320, 2.05).z]); return pullCam(sh, t, [1150, 560, 1.6]); },
    ring: [960, 520, 380, 330], callout: [1500, 290, 1290, 430], closeRing: [960, 500, 560, 380], closeCallout: [420, 300, 700, 440]
  };
  DIR.smaller = {
    shots: shots6(), cameo: cameoSmaller,
    cam: function (sh, t) { if (sh.k === 'wide') return wideCam(t); if (sh.k === 'key') return camAt(t, sh, [520, 740, 1.35], [540, 735, 1.5]); if (sh.k === 'close') return camAt(t, sh, [1450, 760, 1.4], [1470, 760, 1.5]); return pullCam(sh, t, [520, 720, 1.5]); },
    ring: [980, 600, 700, 330], callout: [1540, 330, 1640, 520], closeRing: [900, 640, 620, 340], closeCallout: [420, 280, 640, 480]
  };
  DIR.empty = {
    shots: shots6(), cameo: cameoEmpty, scene: function (sh) { return sh.k === 'wide' || sh.k === 'key' ? 'corridor' : 'room'; },
    cam: function (sh, t) {
      if (sh.k === 'wide') { var z = t < 0.9 ? mix(1.7, 1.0, C.easeOut(C.prog(t, 0, 0.9))) : 1.0; return { x: mix(900, 1060, C.prog(t, 0.9, B(3))), y: 540, z: z }; }
      if (sh.k === 'key') { var a = camTo(1330, 440, 2.3, 0.85), b = camTo(1330, 440, 2.6, 0.85); return camAt(t, sh, [a.x, a.y, a.z], [b.x, b.y, b.z]); }
      if (sh.k === 'close') return camAt(t, sh, [900, 470, 1.8], [915, 470, 1.95]);
      return pullCam(sh, t, [900, 720, 1.5]);
    },
    ring: [960, 500, 260, 340], callout: [440, 330, 720, 450], closeRing: [900, 560, 460, 480], closeCallout: [1500, 300, 1210, 440]
  };

  /* ---------- the film ---------- */
  function caption(c, text, p, y, seed) {
    if (p <= 0) return;
    c.save(); c.font = 'italic 54px ' + C.FONTS.serif; var w = c.measureText(text.replace(/\*/g, '')).width; c.restore();
    var size = Math.min(54, Math.floor(54 * 1640 / Math.max(w + 70, 1))); C.caption(text, [], p, y, { size: size, seed: seed });
  }
  function drawEnd(c, t, road) {
    C.use(c);
    var m = CLIPS['mid-' + road.id] || CLIPS['c2-' + road.id];
    if (t < 0.05 && m && m.draw) { m.draw(c, m.dur, road); C.use(c); return; }          // the join: the last frame of the 2034 office
    var E = endId(road), D = DIR[E], info = road.endingInfo, sh = shotAt(t, D.shots), cam, S = { screenT0: B(3) + 0.05, wallK: 0.8, nUse: Math.round(40 * Agamoto.at(road, 2036).students / Agamoto.at(road, 2026).students) }, i;
    c.save();
    if (sh.k === 'cameo') D.cameo(c, t, road);
    else if (sh.k === 'numbers') numbersShot(c, t, E, road);
    else if (sh.k === 'close' && E === 'trusted') { queueShot(c, t, road); ringAndCallout(c, t, info.callouts[1], D.closeRing, D.closeCallout, B(16) + 0.1); }
    else {
      cam = C.bump(C.drift(D.cam(sh, t), t), t);
      if (D.scene && D.scene(sh) === 'corridor') { corridor2036(c, t, cam, S); if (sh.k === 'key') ringAndCallout(c, t, info.callouts[0], D.ring, D.callout, B(5)); }
      else {
        roomLayers(c, t, E, road, cam, S);
        if (sh.k === 'key') ringAndCallout(c, t, info.callouts[0], D.ring, D.callout, B(5));
        if (sh.k === 'close') ringAndCallout(c, t, info.callouts[1], D.closeRing, D.closeCallout, B(16) + 0.1);
      }
    }
    // the title: year and label as cardboard banners that pop on beat 1 and ride up out of frame at the first cut
    if (t < B(3)) {
      var ex = C.ease(C.prog(t, B(3) - 0.3, B(3))), tx = -ex * 640;
      c.save(); c.translate(0, tx);
      C.banner('2036', 960, 250, { size: 200, rot: -0.03, bg: K.cream, fg: K.ink, p: C.prog(C.T12(t), B(1), B(1) + 0.3), seed: 21 });
      C.banner(info.label, 960, 440, { size: 62, rot: 0.02, bg: TAGCOL[E], fg: E === 'smaller' ? K.ink : '#fff', p: C.prog(C.T12(t), B(1) + 0.2, B(1) + 0.5), seed: 22 }); c.restore();
    } else if (sh.k === 'key' || sh.k === 'pull' || sh.k === 'close') C.banner('2036 · ' + info.label, 1480, 60, { size: 34, rot: -0.01, bg: TAGCOL[E], fg: E === 'smaller' ? K.ink : '#fff', p: C.prog(C.T12(t), B(3), B(3) + 0.3), seed: 23 });
    // narration
    if (t >= 0.9 && t < 4.95) caption(c, info.glimpse[0], C.prog(t, 0.95, 2.4), 850, 11);
    if (t >= 5.0 && t < 7.45) caption(c, info.glimpse[1], C.prog(t, 5.15, 6.8), 850, 12);
    if (t >= 10.0) caption(c, info.line, C.prog(t, 10.1, 11.5), 850, 13);
    // the time jump: a white flash from the 2034 office
    var fa = t < 0.05 ? 0 : t < 0.12 ? C.prog(t, 0.05, 0.12) : Math.pow(1 - C.prog(t, 0.12, 0.9), 1.5);
    C.flash(fa);
    c.restore();
  }
  // sound: every visible event gets a sound; whooshIn rides up into the stamp and the clank lands on it (beat 13)
  function endEvents(road) {
    var E = endId(road), ev = [[0.04, 'whoosh'], [0.12, 'pop'], [B(1) - 0.04, 'pop'], [B(1) + 0.18, 'pop'], [B(3) - 0.03, 'swish'], [B(3), 'clack'], [B(3) + 0.12, 'zip', 1], [B(3) + 0.3, 'zip', 2], [B(5), 'click'], [B(5) + 0.3, 'pop'],
      [B(8) - 0.03, 'swish'], [B(8), 'clack'], [B(10), 'pop'], [B(11) - 0.03, 'swish'], [B(11), 'clack'], [B(11) + 0.1, 'zip', 1], [B(11) + 0.28, 'zip', 2],
      [B(13) - 0.45, 'whooshIn'], [B(13), 'clank'], [B(13) + 0.35, 'pop'], [B(14) - 0.03, 'swish'], [B(14), 'clack'], [B(16) - 0.03, 'swish'], [B(16), 'clack'], [B(16) + 0.15, 'click'], [B(17) + 0.1, 'pop']];
    if (E === 'empty') ev.push([0.9, 'tick'], [B(3) + 0.5, 'creak']);
    return ev;
  }
  ['build-retrain', 'build-cut', 'ban-retrain', 'ban-cut'].forEach(function (r) {
    CLIPS['end-' + r] = { dur: END_DUR, draw: drawEnd, events: endEvents,
      year: function (t) { return 2034 + 2 * C.easeOut(C.prog(t, 0.05, 0.9)); },                  // the HUD year runs 2034 → 2036 across the flash
      hud: function (t) { return t < 0.12 ? 'year' : 'full'; } };
  });

  /* ---------- the classroom set (scenes.js) is what the rewind runs back through ---------- */
  function hasSet() { return !!(root.SET && root.SET.config && root.SET.draw); }
  function fbConfig(road, Y) {
    var v = Agamoto.at(road, Y);
    return { year: Y, students: v.students, teachers: v.teachers, seated: Math.round(v.students / 50), teacherFigs: Math.round(v.teachers / 4), ai: road.c1 === 'build' && Y >= 2026.6, mentors: road.c2 === 'retrain' && Y >= 2027.6, light: 0.5, cards: [] };
  }
  function baseCfg(road, Y) { return hasSet() ? SET.config(road, Y) : fbConfig(road, Y); }
  function drawRoom(c, cfg, t, dur) { if (hasSet()) { SET.draw(c, cfg, t, dur); C.use(c); } else { c.fillStyle = K.cream; c.fillRect(0, 0, W, H); } }
  function motes(c, t, n, alpha) { // (kept for the rewind's scraps) a few drifting paper motes
    var r = C.rand(77); c.save();
    for (var i = 0; i < n; i++) { var x0 = r() * W, y0 = r() * H, rr = 2 + r() * 4; c.globalAlpha = alpha * (0.5 + 0.5 * r()); c.fillStyle = i % 3 === 0 ? P.saffron : P.cream; c.beginPath(); c.arc(x0 + 34 * C.amb(t, END_DUR, i), y0 + 24 * C.amb(t, END_DUR, i * 1.7), rr, 0, 6.283); c.fill(); }
    c.restore();
  }
  /* ---------- rewind ---------- */
  var off = null;
  function offscreen() {
    if (off || typeof document === 'undefined') return off;
    off = document.createElement('canvas'); off.width = W; off.height = H; return off;
  }
  function vhs(c, src, t, amt) {
    var r = C.rand(1 + Math.floor(t * 24)), i;
    c.drawImage(src, 0, 0, W, H);
    // tracking bands displaced sideways
    for (i = 0; i < 7; i++) {
      var sy = Math.floor(r() * H), sh = 10 + Math.floor(r() * 70), dx = (r() - 0.5) * 140 * amt;
      c.drawImage(src, 0, sy, W, sh, dx, sy, W, sh);
    }
    // RGB-ish ghosts
    c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.16 * amt; c.drawImage(src, 9 * amt, 0, W, H); c.drawImage(src, -9 * amt, 2, W, H);
    c.restore();
    // scanlines
    c.save(); c.fillStyle = 'rgba(20,10,0,' + (0.10 * amt).toFixed(3) + ')';
    for (var y = (Math.floor(t * 30) % 2); y < H; y += 4) c.fillRect(0, y, W, 2);
    // bright tracking bar
    var by = (1 - ((t * 1.6) % 1)) * H; c.fillStyle = 'rgba(255,255,255,' + (0.18 * amt).toFixed(3) + ')'; c.fillRect(0, by, W, 26);
    c.restore();
  }
  function rewindScene(c, road, t, Y) {
    var cfg = baseCfg(road, Y), tt = (3 - t) * (4 / 3);
    var jit = t > 0.3 && t < 2.8 ? 1 : 0, sh = jit * (C.amb(t, 3, 0, 9) * 5), z = 1 + 0.03 * Math.sin(t * 7) * jit;
    C.withCam({ x: 960 + sh, y: 540, z: z }, function () { drawRoom(c, cfg, tt, 4); C.use(c); });
  }
  function drawRewind(c, t, road) {
    C.use(c);
    var endc = CLIPS['end-' + road.id];
    var amt = C.clamp(C.prog(t, 0.02, 0.25)) * (1 - C.prog(t, 2.55, 2.95));
    var Y = 2036 - 10 * C.ease(C.prog(t, 0.2, 2.8));
    if (t >= 2.97) { // exact REST-2026
      c.fillStyle = P.cream; c.fillRect(0, 0, W, H);
      var r0 = Agamoto.road('build-retrain'); C.withCam(C.REST, function () { drawRoom(c, baseCfg(r0, 2026), 0, 4); C.use(c); }); return;
    }
    if (t <= 0 && endc) { endc.draw(c, 12, road); C.use(c); return; }
    var dst = c, src = offscreen();
    if (src && amt > 0) { dst = src.getContext('2d'); dst.setTransform(1, 0, 0, 1, 0, 0); dst.clearRect(0, 0, W, H); }
    C.use(dst);
    dst.save();
    dst.fillStyle = P.cream; dst.fillRect(0, 0, W, H);
    if (t < 0.5 && endc) { endc.draw(dst, 12 - 6 * C.easeIn(C.prog(t, 0, 0.5)), road); C.use(dst); }
    else rewindScene(dst, road, t, Y);
    // streaks and flying scraps (backwards: right to left, a fast stream)
    var r = C.rand(404), i, sp = C.clamp(C.prog(t, 0.1, 0.5)) * (1 - C.prog(t, 2.6, 2.95));
    dst.save();
    for (i = 0; i < 26; i++) {
      var y0 = r() * H, len = 120 + r() * 380, v = 900 + r() * 1400, x = ((r() * (W + 800) - v * t * 0.9) % (W + 800) + (W + 800)) % (W + 800) - 400;
      dst.globalAlpha = 0.28 * sp; dst.fillStyle = i % 4 === 0 ? P.saffron : P.paper; dst.fillRect(x, y0, len, 3 + r() * 5);
    }
    for (i = 0; i < 16; i++) {
      var sx = r() * (W + 600), sy = r() * H, sv = 500 + r() * 900, sz = 24 + r() * 50, sr = r() * 6;
      var px = (((sx - sv * t) % (W + 600)) + (W + 600)) % (W + 600) - 300, py = sy + 60 * Math.sin(t * 4 + i);
      dst.save(); dst.globalAlpha = sp; dst.translate(px, py); dst.rotate(sr - t * (6 + i % 5)); C.paper(C.torn(-sz / 2, -sz / 2, sz, sz * 0.7, 300 + i, 4), [P.paper, P.saffron, P.teal, P.mustard, P.coral][i % 5], { lift: 3, blur: 6 }); dst.restore();
    }
    dst.restore();
    // flipping year counter
    var ca = C.clamp(C.prog(t, 0.05, 0.3)) * (1 - C.prog(t, 2.55, 2.9));
    if (ca > 0) {
      var s = 2036 - Y, k = Math.floor(s + 1e-9), fr = s - k, shown = fr < 0.5 ? 2036 - k : 2036 - k - 1, sy2 = Math.max(0.06, Math.abs(Math.cos(Math.PI * fr)));
      dst.save(); dst.globalAlpha = ca; dst.translate(1480, 500); dst.rotate(2 * Math.PI / 180);
      C.paper(C.torn(-250, -170, 500, 340, 31, 5), P.paper, { halftone: 0.3, lift: 10 });
      C.label('« REWIND «', 0, -135, 34, P.coral, 'center', 800);
      dst.save(); dst.scale(1, sy2); dst.font = '800 230px ' + C.FONTS.label; dst.fillStyle = P.ink; dst.textAlign = 'center'; dst.textBaseline = 'middle'; dst.fillText(String(shown), 0, 10); dst.restore();
      dst.fillStyle = P.ink; dst.fillRect(-230, 8, 460, 3); dst.restore();
    }
    dst.restore();
    if (dst !== c) { C.use(c); vhs(c, src, t, amt); }
  }
  CLIPS.rewind = { dur: 3, draw: drawRewind };

  /* ---------- states ---------- */
  root.ENDINGS = {
    // the first frame of end-<road> is the last frame of mid-<road>: Sunanda's office, 2034 (the HUD year chip, then the flash)
    startState: function (id, road) {
      if (id === 'rewind') return root.ENDINGS.endState('end-' + road.id, road);
      return { cam: { x: 960, y: 540, z: 1 }, year: 2034, shot: 'OFFICE', cards: [] };
    },
    endState: function (id, road) {
      if (id === 'rewind') return { cam: { x: 960, y: 540, z: 1 }, year: 2026, shot: 'REST', cards: [] };
      var E = endId(road), D = DIR[E], sh = D.shots[D.shots.length - 1], cam = E === 'trusted' ? { x: 960, y: 540, z: 1.06 } : D.cam(sh, END_DUR);
      return { cam: { x: cam.x, y: cam.y, z: cam.z }, year: 2036, shot: 'END', cards: [] };
    }
  };
})(typeof window !== 'undefined' ? window : this);
var ENDINGS = window.ENDINGS;
