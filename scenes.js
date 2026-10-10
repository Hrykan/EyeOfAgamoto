/* scenes.js — the classroom set (SET) + clips prologue, wait-1/2, c1-*, c2-*. Pure draw functions. */
(function (root) {
  'use strict';
  var P = C.PALETTE, TAU = Math.PI * 2, CL = C.clamp;
  var CLIPS = root.CLIPS = root.CLIPS || {};
  var SET = root.SET = {};
  var SCENES = root.SCENES = {};

  /* ---------- helpers ---------- */
  function hx(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mx(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function rgb(a, al) { return al == null ? 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')' : 'rgba(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ',' + al + ')'; }
  var SKY = [[2026, '#eaa07f', '#fbd9a0'], [2027, '#f0b872', '#fde3a8'], [2028, '#d9d79a', '#fbe9b8'], [2029, '#eeaa9a', '#fbd3b0'], [2030, '#9fcdd0', '#fbe6bd'], [2033, '#f3b27f', '#fddcaa'], [2036, '#b8c9de', '#fbdcb4']]
    .map(function (k) { return { y: k[0], top: hx(k[1]), hor: hx(k[2]) }; });
  function skyAt(y) {
    if (y <= SKY[0].y) return SKY[0];
    for (var i = 0; i < SKY.length - 1; i++) { var a = SKY[i], b = SKY[i + 1]; if (y <= b.y) { var f = C.ease((y - a.y) / (b.y - a.y)); return { top: mx(a.top, b.top, f), hor: mx(a.hor, b.hor, f) }; } }
    return SKY[SKY.length - 1];
  }
  function lerp(a, b, f) { return a + (b - a) * f; }

  /* ---------- layout ---------- */
  var ROWS = [{ y: 596, h: 98 }, { y: 664, h: 112 }, { y: 736, h: 128 }, { y: 812, h: 146 }, { y: 890, h: 166 }];
  var SLOTS = [], RANK = [], ORDER = [];
  ROWS.forEach(function (r, ri) {
    var base = 95 + (ri % 2) * 65;
    for (var ci = 0; ci < 14; ci++) { var x = base + ci * 130; if (Math.abs(x - 960) < 85 || x > 1860) continue; SLOTS.push({ i: SLOTS.length, x: x, y: r.y, h: r.h, r: ri, c: ci }); }
  });
  (function () {
    var idx = SLOTS.map(function (_, i) { return i; }), r = C.rand(91);
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp; }
    idx.forEach(function (s, rk) { RANK[s] = rk; }); ORDER = idx;
  })();
  var TPOS = [];
  (function () {
    // 4 lecturers at the main board, the rest spread through the aisles between desk rows (each pointing at a desk)
    [735, 850, 1075, 1190].forEach(function (x, i) { TPOS.push({ x: x, y: 556, h: 165, tier: 0, p: i, aisle: -1 }); });
    var AY = [628, 700, 774, 850], cand = [[], [], [], []];
    for (var a = 0; a < 4; a++) { var base = 95 + ((a + 1) % 2) * 65; for (var ci = 0; ci < 14; ci++) { var x = base + ci * 130 + 65; if (Math.abs(x - 960) < 90 || x < 70 || x > 1850) continue; cand[a].push(x); } }
    var used = [[], [], [], []];
    for (var k = 0; k < 44; k++) {
      var aa = k % 4, u = (k * 0.6180339887 + 0.13) % 1, tx = 110 + u * 1700, best = null, bd = 1e9;
      cand[aa].forEach(function (cx) { if (used[aa].some(function (ux) { return Math.abs(ux - cx) < 120; })) return; var d = Math.abs(cx - tx); if (d < bd) { bd = d; best = cx; } });
      if (best == null) continue; used[aa].push(best);
      TPOS.push({ x: best, y: AY[aa], h: 150 + (AY[aa] - 556) * 0.12, tier: 1 + aa, p: 10 + k, aisle: aa });
    }
  })();
  var STRUG = []; (function () { var r = C.rand(404); for (var i = 0; i < 90; i++) STRUG.push(r() < 0.13); })();
  var L = SET.layout = {
    window: { x: 60, y: 110, w: 540, h: 410 }, board: { x: 660, y: 140, w: 640, h: 330 }, screen: { x: 940, y: 160, w: 350, h: 290 },
    notice: { x: 1400, y: 140, w: 440, h: 330 }, sunanda: { x: 960, y: 650 }, basket: { x: 175, y: 575 },
    desks: SLOTS.map(function (s) { return { x: s.x, y: s.y }; })
  };
  SET.dotPos = function (i) { return { x: L.screen.x + 36 + (i % 10) * 31, y: L.screen.y + 78 + Math.floor(i / 10) * 26 }; };
  SET.struggling = function (n) { var o = []; for (var i = 0; i < n; i++) if (STRUG[i]) o.push(i); return o; };
  SET.slots = SLOTS; SET.rank = RANK; SET.order = ORDER; SET.teacherSlots = TPOS;

  /* ---------- config ---------- */
  SET.config = function (road, yf) {
    var v = Agamoto.at(road, yf);
    return {
      year: yf, students: v.students, teachers: v.teachers, fees: v.fees, results: v.results,
      seated: Math.round(v.students / 50), teacherFigs: Math.round(v.teachers / 4),
      ai: road.c1 === 'build' && yf >= 2026.6, mentors: road.c2 === 'retrain' && yf >= 2027.5, ban: road.c1 === 'ban' && yf >= 2026.6,
      light: CL((yf - 2026) / 10), c1: road.c1, c2: road.c2,
      cards: (yf >= 2026.999 ? [road.c1] : []).concat(yf >= 2029.999 ? [road.c2] : [])
    };
  };

  /* ---------- figure wrapper (ambient sway, seamless) ---------- */
  function fig(x, y, h, pose, o, flip, ph, a, t, dur) {
    var c = C.ctx, sw = C.amb(t, dur, ph);
    c.save(); if (a < 1) c.globalAlpha *= Math.max(0, a);
    c.translate(x, y - (sw * 0.5 + 0.5) * 1.6); c.rotate(sw * 0.012);
    C.figure(0, 0, h, pose, o, flip, 0);
    c.restore();
  }
  function glowRect(c, x, y, w, h, rot, col, glow, al) {
    c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(rot); c.shadowColor = glow; c.shadowBlur = 14; c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h);
    c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, Math.max(2, h * 0.18)); c.restore();
  }

  /* ---------- static base (cached) ---------- */
  var baseCache = null;
  function drawBase(c) {
    var prev = C.ctx; C.use(c);
    // wall
    C.paper(C.torn(-20, -20, 1960, 590, 3, 6), '#efe2c8', { shadow: false, halftone: 0.35 });
    C.paper(C.torn(-20, 470, 1960, 100, 4, 5), '#e0cca3', { shadow: false });
    // floor
    C.paper(C.torn(-20, 548, 1960, 560, 5, 6), '#c99a6b', { shadow: false, halftone: 0.5, dot: 'rgba(90,50,20,0.14)' });
    c.save(); c.strokeStyle = 'rgba(90,50,20,0.16)'; c.lineWidth = 2;
    [585, 640, 705, 785, 880, 990].forEach(function (y) { c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y + 3); c.stroke(); });
    c.restore();
    C.paper(C.torn(-20, 530, 1960, 24, 6, 3), '#8a5a3b', { lift: 3 });
    // blackboard
    C.rect(648, 128, 664, 354, '#8a5a3b', 12, { rough: 3 });
    C.paper(C.torn(666, 146, 628, 318, 13, 3), '#26433f', { halftone: 0.3, dot: 'rgba(255,255,255,0.05)', shadow: false });
    c.save(); c.fillStyle = 'rgba(255,255,255,0.78)'; c.font = 'italic 46px ' + C.FONTS.serif;
    c.fillText('F = m a', 690, 210); c.fillText('v = u + a t', 690, 275); c.font = 'italic 36px ' + C.FONTS.serif; c.fillText('Q3.  ∫ x² dx', 690, 335);
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(700, 440); c.quadraticCurveTo(790, 340, 880, 440); c.stroke();
    c.beginPath(); c.moveTo(700, 440); c.lineTo(880, 440); c.stroke(); c.restore();
    C.rect(690, 468, 260, 12, '#b88a5c', 14, { rough: 2 });
    // clock (7:00)
    c.save(); c.translate(980, 88); c.shadowColor = 'rgba(40,25,10,.3)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
    c.fillStyle = P.paper; c.beginPath(); c.arc(0, 0, 38, 0, TAU); c.fill(); c.shadowColor = 'transparent';
    c.lineWidth = 5; c.strokeStyle = P.wood; c.stroke(); c.strokeStyle = P.ink; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -26); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(-13, 19); c.stroke(); c.restore();
    // notice board
    C.rect(1388, 128, 464, 354, '#8a5a3b', 15, { rough: 3 });
    C.paper(C.torn(1402, 142, 436, 326, 16, 3), '#c89a62', { halftone: 0.55, dot: 'rgba(90,50,20,0.22)', shadow: false });
    C.label('Notice board', 1620, 158, 20, P.inkSoft, 'center', 700);
    c.save(); c.translate(1418, 214); c.rotate(-0.12); C.paper(C.torn(-16, -22, 34, 44, 17, 2), '#fbf5e8', { lift: 2, blur: 5 }); c.restore();
    c.save(); c.translate(1820, 300); c.rotate(0.1); C.paper(C.torn(-14, -24, 30, 48, 18, 2), '#f2c48d', { lift: 2, blur: 5 }); c.restore();
    c.save(); c.translate(1520, 455); c.rotate(-0.03); C.paper(C.torn(-70, -12, 140, 24, 19, 2), '#fbf5e8', { lift: 2, blur: 5 }); C.label('Fees due 10th', 0, 0, 16, P.inkSoft, 'center', 600); c.restore();
    C.use(prev);
  }
  function getBase() {
    if (baseCache) return baseCache;
    if (typeof document === 'undefined') return null;
    var cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; drawBase(cv.getContext('2d')); baseCache = cv; return cv;
  }

  /* ---------- window with Pune skyline ---------- */
  function drawWindow(c, cfg, t, dur) {
    var W = L.window, sky = skyAt(cfg.year);
    c.save(); c.beginPath(); c.rect(W.x, W.y, W.w, W.h); c.clip();
    var g = c.createLinearGradient(0, W.y, 0, W.y + W.h); g.addColorStop(0, rgb(sky.top)); g.addColorStop(1, rgb(sky.hor)); c.fillStyle = g; c.fillRect(W.x, W.y, W.w, W.h);
    var sx = 470 + C.amb(t, dur, 0) * 6, sy = 340 + C.amb(t, dur, 1) * 3;
    var rg = c.createRadialGradient(sx, sy, 0, sx, sy, 210); rg.addColorStop(0, 'rgba(255,244,200,0.95)'); rg.addColorStop(0.2, 'rgba(255,236,170,0.55)'); rg.addColorStop(1, 'rgba(255,230,160,0)');
    c.fillStyle = rg; c.fillRect(W.x, W.y, W.w, W.h); c.fillStyle = '#fff6d6'; c.beginPath(); c.arc(sx, sy, 30, 0, TAU); c.fill();
    // clouds
    c.fillStyle = 'rgba(255,250,235,0.7)';
    [[160, 190, 1], [380, 150, 0.8], [520, 235, 0.7]].forEach(function (k, i) {
      var cx = k[0] + C.amb(t, dur, i * 2) * 14, cy = k[1], s = k[2];
      c.beginPath(); c.ellipse(cx, cy, 60 * s, 16 * s, 0, 0, TAU); c.ellipse(cx - 30 * s, cy + 4, 34 * s, 12 * s, 0, 0, TAU); c.ellipse(cx + 36 * s, cy + 3, 38 * s, 12 * s, 0, 0, TAU); c.fill();
    });
    function hills(base, amp, col, ph) {
      c.fillStyle = col; c.beginPath(); c.moveTo(W.x, W.y + W.h);
      for (var x = W.x; x <= W.x + W.w + 20; x += 20) c.lineTo(x, base - amp * Math.sin(x * 0.011 + ph) - amp * 0.6 * Math.sin(x * 0.027 + ph * 2));
      c.lineTo(W.x + W.w + 20, W.y + W.h); c.closePath(); c.fill();
    }
    hills(400, 28, rgb(mx(sky.hor, hx('#8aa3a6'), 0.55)), 1); hills(448, 16, rgb(mx(sky.hor, hx('#6f8a7d'), 0.55)), 2.4);
    var dark = rgb(mx(sky.hor, hx('#6d5a58'), 0.72)), mid = rgb(mx(sky.hor, hx('#7a5f55'), 0.78));
    // temple shikhara
    c.fillStyle = dark; c.fillRect(112, 470, 64, 50);
    c.beginPath(); c.moveTo(116, 472); c.bezierCurveTo(118, 430, 130, 395, 144, 340); c.bezierCurveTo(158, 395, 170, 430, 172, 472); c.closePath(); c.fill();
    c.beginPath(); c.arc(144, 336, 6, 0, TAU); c.fill(); c.fillRect(143, 316, 2, 22);
    c.fillStyle = 'rgba(255,255,255,0.12)'; for (var tr = 0; tr < 5; tr++) c.fillRect(124 + tr * 1, 460 - tr * 24, 40 - tr * 2, 3);
    // Shaniwar Wada gate
    c.fillStyle = mid; c.fillRect(250, 450, 190, 70);
    for (var m = 0; m < 13; m++) { c.beginPath(); c.moveTo(250 + m * 14.6, 450); c.lineTo(257 + m * 14.6, 438); c.lineTo(264 + m * 14.6, 450); c.fill(); }
    c.fillRect(296, 396, 98, 124); for (var m2 = 0; m2 < 5; m2++) { c.beginPath(); c.moveTo(296 + m2 * 20, 396); c.lineTo(306 + m2 * 20, 380); c.lineTo(316 + m2 * 20, 396); c.fill(); }
    c.beginPath(); c.arc(262, 440, 14, 0, TAU); c.arc(428, 440, 14, 0, TAU); c.fill();
    c.fillStyle = '#3a2b28'; c.beginPath(); c.moveTo(326, 520); c.lineTo(326, 460); c.arc(345, 460, 19, Math.PI, 0); c.lineTo(364, 520); c.closePath(); c.fill();
    c.fillStyle = 'rgba(224,134,62,0.75)'; for (var sp = 0; sp < 4; sp++) c.fillRect(331 + sp * 9, 478, 3, 3);
    // towers
    var grow = 0.85 + 0.15 * CL((cfg.year - 2026) / 4);
    [[470, 34, 170], [512, 40, 120], [556, 40, 210 * grow]].forEach(function (k, i) {
      c.fillStyle = rgb(mx(sky.hor, hx('#8a7b7a'), 0.7 - i * 0.05)); c.fillRect(k[0], 520 - k[2], k[1], k[2]);
      c.fillStyle = 'rgba(255,240,190,0.55)'; for (var wy = 520 - k[2] + 14; wy < 506; wy += 20) for (var wx = k[0] + 6; wx < k[0] + k[1] - 8; wx += 12) c.fillRect(wx, wy, 5, 8);
    });
    // birds
    c.strokeStyle = 'rgba(60,45,40,0.7)'; c.lineWidth = 2;
    [[250, 220], [285, 205], [320, 232]].forEach(function (b, i) {
      var bx = b[0] + C.amb(t, dur, i) * 24, by = b[1] + C.amb(t, dur, i + 2) * 8, fl = C.amb(t, dur, i * 3, 4) * 4;
      c.beginPath(); c.moveTo(bx - 9, by - fl); c.quadraticCurveTo(bx - 4, by - 5 + fl, bx, by); c.quadraticCurveTo(bx + 4, by - 5 + fl, bx + 9, by - fl); c.stroke();
    });
    c.restore();
    // frame
    C.rect(46, 96, 568, 26, '#8a5a3b', 21, { rough: 2 }); C.rect(44, 514, 584, 28, '#b88a5c', 22, { rough: 2 });
    C.rect(46, 98, 26, 444, '#8a5a3b', 23, { rough: 2 }); C.rect(588, 98, 26, 444, '#8a5a3b', 24, { rough: 2 });
    C.rect(322, 112, 16, 404, '#8a5a3b', 25, { rough: 2, shadowAlpha: 0.18 }); C.rect(66, 300, 530, 14, '#8a5a3b', 26, { rough: 2, shadowAlpha: 0.18 });
  }

  /* ---------- board content: AI screen / NO-AI sign ---------- */
  function drawScreen(c, N, amt, t, dur) {
    var S = L.screen, f = C.easeOut(amt), cx = S.x + S.w / 2, cy = S.y + S.h / 2;
    c.save(); c.translate(cx, cy); c.scale(0.8 + 0.2 * f, 0.8 + 0.2 * f); c.translate(-cx, -cy); c.globalAlpha *= CL(amt * 1.6);
    C.paper(C.torn(S.x, S.y, S.w, S.h, 31, 3), '#17262d', { lift: 8 });
    C.label('AI tutor · struggle map', S.x + 22, S.y + 28, 24, '#bfece4', 'left', 700);
    var n = Math.min(80, Math.round(N));
    for (var i = 0; i < n; i++) {
      var p = SET.dotPos(i), da = CL(amt * 2.2 - i / Math.max(1, n)); if (da <= 0) continue;
      var st = STRUG[i], pulse = st ? 1 + 0.25 * C.amb(t, dur, i) : 1;
      c.save(); c.globalAlpha *= da; c.shadowColor = st ? 'rgba(255,111,89,0.95)' : 'rgba(85,214,190,0.5)'; c.shadowBlur = st ? 16 : 6; c.fillStyle = st ? '#ff6f59' : '#55d6be';
      c.beginPath(); c.arc(p.x, p.y, 8 * pulse, 0, TAU); c.fill(); c.restore();
    }
    c.fillStyle = '#ff6f59'; c.beginPath(); c.arc(S.x + 26, S.y + S.h - 22, 6, 0, TAU); c.fill(); C.label('Needs help', S.x + 38, S.y + S.h - 22, 18, '#e8dcc3', 'left', 600);
    c.fillStyle = '#55d6be'; c.beginPath(); c.arc(S.x + 170, S.y + S.h - 22, 6, 0, TAU); c.fill(); C.label('On track', S.x + 182, S.y + S.h - 22, 18, '#e8dcc3', 'left', 600);
    c.restore();
  }
  function drawSign(c, amt, t, dur) {
    var f = C.back(CL(amt)), cx = 1115, cy = 305;
    c.save(); c.translate(cx, cy); c.scale(0.5 + 0.5 * f, 0.5 + 0.5 * f); c.rotate(-0.04); c.globalAlpha *= CL(amt * 3);
    C.paper(C.torn(-140, -135, 280, 290, 33, 3), P.paper, { lift: 8, halftone: 0.3 });
    C.label('AI', 0, 0, 130, P.ink, 'center', 800);
    c.strokeStyle = P.coral; c.lineWidth = 16; c.beginPath(); c.arc(0, 0, 92, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-65, -65); c.lineTo(65, 65); c.stroke();
    C.label('No AI in class', 0, 122, 28, P.inkSoft, 'center', 800);
    c.restore();
  }

  /* ---------- desk, devices ---------- */
  function drawDesk(c, s) {
    var k = s.h / 100;
    C.paper(C.torn(s.x - 37 * k, s.y - 27 * k, 74 * k, 9 * k, s.i + 5, 1.2), '#b9855a', { lift: 3, blur: 6, shadowAlpha: 0.2 });
    C.paper(C.torn(s.x - 33 * k, s.y - 18 * k, 66 * k, 34 * k, s.i + 9, 1.5), '#9a6a45', { shadow: false });
  }
  function drawBasket(c, n, t, dur) {
    var B = L.basket, k = 1;
    c.save(); c.translate(B.x, B.y);
    for (var i = 0; i < n; i++) glowRect(c, -42 + (i % 7) * 14, -30 - Math.floor(i / 7) * 6 + Math.sin(i * 2.1) * 3, 11, 20, (i % 5 - 2) * 0.22, '#8fd8ff', 'rgba(143,216,255,0.9)', 0.9);
    C.paper([[-62, -26], [62, -26], [50, 22], [-50, 22]], '#b88a4a', { lift: 4, blur: 8 });
    c.strokeStyle = 'rgba(90,55,20,0.45)'; c.lineWidth = 2; for (var w = -40; w <= 40; w += 16) { c.beginPath(); c.moveTo(w, -24); c.lineTo(w * 0.85, 20); c.stroke(); }
    C.label('phones', 0, 40, 18, P.inkSoft, 'center', 700);
    c.restore();
  }
  function drawBox(c, x, y, w) {
    C.paper(C.torn(x - w / 2, y - w * 0.4, w, w * 0.8, 77, 2), '#c9a36b', { lift: 3, blur: 6, stroke: '#8a6a3b', lw: 2 });
  }

  /* ---------- choice cards ---------- */
  function cardLabel(slot, kind) {
    var d = Agamoto.company().decisions[slot], o = d.options.filter(function (q) { return q.id === kind; })[0];
    return o ? o.label : kind;
  }
  function drawCard(c, slot, kind, age) {
    var cy = slot === 0 ? 235 : 375, rot = slot === 0 ? -3 : 2, f = CL(age / 0.2), sc = 1 + 0.22 * (1 - C.easeOut(f)), sq = 1 - 0.1 * Math.sin(Math.PI * f);
    c.save(); c.translate(1610, cy); c.rotate(rot * Math.PI / 180); c.scale(sc, sc * sq);
    var fill = slot === 0 ? P.saffron : P.teal;
    C.paper(C.torn(-180, -60, 360, 120, 40 + slot, 3), fill, { lift: 4 + 12 * (1 - f), blur: 10 + 10 * (1 - f), halftone: 0.4, dot: 'rgba(31,27,24,0.12)' });
    var txt = slot === 0 ? P.ink : P.paper, label = cardLabel(slot, kind).toUpperCase(), size = 40;
    c.font = '800 ' + size + 'px ' + C.FONTS.label; while (c.measureText(label).width > 310 && size > 20) { size -= 2; c.font = '800 ' + size + 'px ' + C.FONTS.label; }
    C.label(slot === 0 ? 'Choice 1 · 2026' : 'Choice 2 · 2027', -150, -36, 20, slot === 0 ? P.inkSoft : '#cfe9e5', 'left', 700);
    C.label(label, 0, 12, size, txt, 'center', 800);
    c.fillStyle = '#b33a2f'; c.beginPath(); c.arc(0, -52, 10, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(-3, -55, 3, 0, TAU); c.fill();
    c.restore();
  }

  /* ---------- the set ---------- */
  SET.draw = function (ctx, cfg, t, dur) {
    var c = ctx; C.use(c); dur = dur || 4; t = t || 0;
    var base = getBase(); if (base) c.drawImage(base, 0, 0, 1920, 1080); else drawBase(c);
    drawWindow(c, cfg, t, dur);
    var aiA = cfg.aiAmt != null ? cfg.aiAmt : (cfg.ai ? 1 : 0), banA = cfg.banAmt != null ? cfg.banAmt : (cfg.ban ? 1 : 0);
    var phoneA = cfg.phoneAmt != null ? cfg.phoneAmt : ((cfg.ai || cfg.ban) ? 0 : 1), mentA = cfg.mentAmt != null ? cfg.mentAmt : (cfg.mentors ? 1 : 0);
    var N = Math.min(SLOTS.length, cfg.students / 50), F = Math.min(TPOS.length, cfg.teachers / 4), sky = skyAt(cfg.year);
    if (aiA > 0) drawScreen(c, N, aiA, t, dur);
    if (banA > 0) drawSign(c, banA, t, dur);
    // light shafts
    c.save(); var sa = 0.11 + 0.025 * C.amb(t, dur, 0.6), sg = c.createLinearGradient(100, 520, 900, 1000);
    sg.addColorStop(0, rgb(sky.hor, sa * 1.8)); sg.addColorStop(1, rgb(sky.hor, 0)); c.fillStyle = sg;
    c.beginPath(); c.moveTo(100, 520); c.lineTo(310, 520); c.lineTo(1250, 1000); c.lineTo(640, 1000); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(350, 520); c.lineTo(560, 520); c.lineTo(1600, 1000); c.lineTo(1150, 1000); c.closePath(); c.globalAlpha = 0.7; c.fill(); c.restore();

    var items = [];
    // students
    SLOTS.forEach(function (s) {
      var rank = RANK[s.i], a = CL(N - rank), ov = cfg.seatFn ? cfg.seatFn(s.i, rank, s, t) : null;
      var states = ov ? (Array.isArray(ov) ? ov : [ov]) : (a > 0.002 ? [{ a: a, x: s.x, y: s.y, pose: 'sit', flip: s.i % 3 === 0 }] : []);
      items.push({ y: s.y, fn: function () {
        var o = C.outfitFor(s.i), devA = 0;
        states.forEach(function (st) { if (st.a > 0.002) { fig(st.x, st.y, s.h, st.pose || 'sit', o, st.flip, s.i * 0.7, st.a, t, dur); if ((st.pose || 'sit') === 'sit') devA = Math.max(devA, st.a); } });
        drawDesk(c, s);
        if (devA > 0.01) {
          var k = s.h / 100, pa = cfg.phoneFn ? cfg.phoneFn(s.i, rank, t) : phoneA;
          if (aiA > 0.01) glowRect(c, s.x - 10 * k, s.y - 33 * k, 26 * k, 16 * k, -0.12, '#7be7d4', 'rgba(120,240,215,0.85)', devA * aiA);
          if (pa > 0.01) glowRect(c, s.x + 16 * k, s.y - 40 * k, 8 * k, 15 * k, 0.15, '#8fd8ff', 'rgba(143,216,255,0.9)', devA * pa);
        }
      } });
    });
    // teachers
    var Fc = Math.ceil(F - 0.001), occ = [];
    if (mentA > 0) { occ = SLOTS.filter(function (s) { return RANK[s.i] < Math.round(N); }).sort(function (a, b) { return a.r - b.r || a.c - b.c; }); }
    for (var i = 0; i < Math.min(TPOS.length, Fc + 1); i++) (function (i) {
      var tp = TPOS[i], a = CL(F - i), ov = cfg.teachFn ? cfg.teachFn(i, tp, t) : null;
      if (ov && ov.a != null) a = ov.a;
      if (a < 0.003) return;
      var x = tp.x, y = tp.y, h = tp.h, pose = 'point-at-board', flip = tp.aisle < 0 ? tp.x > 960 : (i % 2 === 0);
      if (mentA > 0 && occ.length) {
        var s = occ[Math.min(occ.length - 1, Math.floor((i + 0.5) * occ.length / Math.max(1, Fc)))], e = C.ease(mentA);
        x = lerp(tp.x, s.x + 60, e); y = lerp(tp.y, s.y + 6, e); h = lerp(tp.h, s.h * 0.98, e); flip = e > 0.5 ? true : flip;
        pose = e >= 0.98 ? (i % 2 ? 'lean-in-to-group' : 'sit') : (e > 0.02 ? 'lean-in-to-group' : pose);
      }
      var o = C.outfitFor(i + 3); if (i % 3 === 0) { o.saree = true; o.dupatta = P.saffron; } o.glasses = i % 4 === 1;
      items.push({ y: y, fn: function () { fig(x, y, h, pose, o, flip, i * 0.9 + 1, a, t, dur); } });
    })(i);
    // Sunanda
    items.push({ y: L.sunanda.y, fn: function () { fig(L.sunanda.x, L.sunanda.y, 240, mentA > 0.5 ? 'stand' : 'point-at-board', C.SUNANDA, false, 0.3, 1, t, dur); } });
    // basket
    var bn = cfg.basketN != null ? cfg.basketN : (banA > 0.99 ? 14 : 0);
    if (banA > 0 || bn > 0) items.push({ y: L.basket.y, fn: function () { drawBasket(c, bn, t, dur); } });
    if (cfg.extra) cfg.extra(items);
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it) { it.fn(); });
    // morning tint
    c.save(); c.globalAlpha = 0.07; c.fillStyle = rgb(sky.hor); c.fillRect(0, 0, 1920, 1080); c.restore();
    // pinned cards
    var ages = cfg.cardAge || [];
    (cfg.cards || []).forEach(function (k, i) { var age = ages[i] == null ? 9 : ages[i]; if (age >= 0) drawCard(c, i, k, age); });
  };

  /* ---------- clip helpers ---------- */
  var REST = C.REST;
  function view(c, cam, fn) { C.withCam(cam, fn); }
  function fade(t, a, b, fi, fo) { return C.clamp((t - a) / (fi || 0.4)) * C.clamp((b - t) / (fo || 0.5)); }
  function cap(c, text, emph, t, a, b, y) {
    if (t < a || t > b) return; c.save(); c.globalAlpha = fade(t, a, b, 0.05, 0.45); C.caption(text, emph, C.prog(t, a, a + Math.max(1, (b - a) * 0.55)), y || 880); c.restore();
  }
  function roadYear(id) { return id === 'prologue' || id === 'wait-1' ? 2026 : 2027; }

  /* ---------- prologue ---------- */
  CLIPS.prologue = { dur: 15, draw: function (ctx, t, road) {
    C.use(ctx); var dur = 15, cfg = SET.config(road, 2026), nSeats = Math.round(cfg.students / 50);
    cfg.seatFn = function (si, rank, s) {
      if (rank >= nSeats) return null;
      var a0 = 0.2 + (rank / nSeats) * 5.2 + C.rand(1000 + rank)() * 0.25, f = (t - a0) / 1.5;
      if (f >= 1) return null; if (f <= 0) return { a: 0 };
      var sx = s.x < 960 ? -90 : 2010, e = C.easeOut(f), x = lerp(sx, s.x, e), y = lerp(s.y + 40, s.y + 26 * s.h / 100, 0.5 + 0.5 * e), fl = sx > s.x;
      var sitA = CL((f - 0.78) / 0.2);
      return [{ a: 1 - sitA, x: x, y: s.y + 26 * s.h / 100, pose: 'stand', flip: fl }, { a: sitA, x: x, y: s.y, pose: 'sit', flip: s.i % 3 === 0 }];
    };
    cfg.phoneFn = function (si, rank) { return C.prog(t, 6.2 + (rank / Math.max(1, nSeats)) * 1.4, 6.8 + (rank / Math.max(1, nSeats)) * 1.4); };
    var asker = ORDER[Math.min(nSeats - 1, 6)], as = SLOTS[asker];
    var cam = C.track(t, [{ t: 0, x: 960, y: 540, z: 1 }, { t: 8.4, x: 960, y: 540, z: 1 }, { t: 10, x: 960, y: 520, z: 1.45 }, { t: 11.8, x: 960, y: 520, z: 1.45 }, { t: 14, x: 960, y: 540, z: 1 }]);
    C.withCam(cam, function () {
      cfg.extra = function (items) {
        var b = C.prog(t, 8.7, 9.2);
        if (b > 0 && t < 11.6) items.push({ y: 2000, fn: function () {
          var c = ctx; c.save(); c.globalAlpha *= fade(t, 8.7, 11.6, 0.25, 0.4); c.translate(as.x + 30, as.y - 0.9 * as.h); c.scale(0.6 + 0.4 * C.back(b), 0.6 + 0.4 * C.back(b));
          C.paper(C.torn(-34, -28, 68, 56, 51, 2), P.paper, { lift: 4 }); C.label('?', 0, 2, 44, P.coral, 'center', 800); c.restore();
        } });
      };
      SET.draw(ctx, cfg, t, dur);
      var np = C.prog(t, 6.6, 7.4);
      if (np > 0 && t < 9.4) { ctx.save(); ctx.globalAlpha *= fade(t, 6.6, 9.4, 0.3, 0.5); C.callout('Free AI tutor · any topic · any language', 560, 470, 500, 600, np, { size: 30, bg: P.mustard, rot: -2 }); ctx.restore(); }
    });
    cap(ctx, 'Pune, 2026. Vidya Classes opens at seven.', [], t, 0.3, 4.6);
    cap(ctx, 'Every phone now holds a *free* AI tutor.', [], t, 5.2, 8.4);
    cap(ctx, '“Ma\'am, why come to class?”', ['why'], t, 8.8, 11.9);
    cap(ctx, 'Sunanda has one year to answer.', [], t, 12.0, 13.9);
  } };

  /* ---------- waits ---------- */
  CLIPS['wait-1'] = { dur: 4, draw: function (ctx, t, road) {
    C.use(ctx); var cfg = SET.config(road, 2026); C.withCam(REST, function () { SET.draw(ctx, cfg, t, 4); });
  } };
  CLIPS['wait-2'] = { dur: 4, draw: function (ctx, t, road) {
    C.use(ctx); var cfg = SET.config(road, 2027); C.withCam(REST, function () { SET.draw(ctx, cfg, t, 4); });
  } };

  /* ---------- c1 ---------- */
  function c1Year(t) { return 2026 + C.ease(C.prog(t, 1.5, 13.5)); }
  CLIPS['c1-build'] = { dur: 15, draw: function (ctx, t, road) {
    C.use(ctx); var dur = 15, cfg = SET.config(road, c1Year(t));
    cfg.cards = ['build']; cfg.cardAge = [t - 0.6];
    cfg.aiAmt = C.ease(C.prog(t, 3.8, 6.2)); cfg.phoneAmt = 1 - C.prog(t, 2.6, 4.4); cfg.ai = true;
    cfg.phoneFn = null; var tabAmt = C.prog(t, 2.6, 4.4);
    var nS = Math.round(cfg.students / 50);
    var cam = C.track(t, [{ t: 0, x: 960, y: 540, z: 1 }, { t: 2.5, x: 960, y: 540, z: 1 }, { t: 5.2, x: 1100, y: 430, z: 1.35 }, { t: 10.5, x: 1100, y: 430, z: 1.35 }, { t: 13.6, x: 960, y: 540, z: 1 }]);
    C.withCam(cam, function () {
      SET.draw(ctx, cfg, t, dur);
      var sg = SET.struggling(nS).slice(0, 3), rp = C.prog(t, 7.2, 8.4);
      sg.forEach(function (i, k) { var p = SET.dotPos(i); ctx.save(); ctx.globalAlpha *= fade(t, 7.2, 11.8, 0.1, 0.5); C.ring(p.x, p.y, 18, 17, CL(rp * 1.5 - k * 0.2), P.coral, 4); ctx.restore(); });
      if (sg.length && t > 7.8 && t < 11.8) { var p0 = SET.dotPos(sg[0]); ctx.save(); ctx.globalAlpha *= fade(t, 7.8, 11.8, 0.3, 0.5); C.callout('Teacher sees who struggles', 1050, 505, p0.x, p0.y + 14, C.prog(t, 7.8, 8.8), { size: 28, bg: P.mustard }); ctx.restore(); }
    });
    cap(ctx, 'Every student gets an AI tutor, in every class.', [], t, 1.0, 4.6);
    cap(ctx, 'And the teacher sees, at a glance, who is *struggling*.', [], t, 7.0, 11.0);
    cap(ctx, '2027. The room hums.', [], t, 11.3, 13.4);
  } };
  CLIPS['c1-ban'] = { dur: 15, draw: function (ctx, t, road) {
    C.use(ctx); var dur = 15, cfg = SET.config(road, c1Year(t)), v1 = Agamoto.at(road, 2027), v0 = Agamoto.at(road, 2026);
    cfg.cards = ['ban']; cfg.cardAge = [t - 0.6]; cfg.ban = true;
    cfg.students = lerp(v0.students, v1.students, C.ease(C.prog(t, 7, 10)));
    cfg.banAmt = C.prog(t, 5.6, 6.3);
    cfg.phoneFn = function (si, rank) { var s0 = 2 + (rank % 13) / 13 * 3.4; return 1 - C.prog(t, s0, s0 + 0.4); };
    cfg.basketN = Math.floor(14 * C.prog(t, 2.6, 6.2));
    var nS0 = Math.round(v0.students / 50), nS1 = Math.round(v1.students / 50);
    var cam = C.track(t, [{ t: 0, x: 960, y: 540, z: 1 }, { t: 1.8, x: 960, y: 540, z: 1 }, { t: 3.2, x: 520, y: 620, z: 1.3 }, { t: 6.4, x: 520, y: 620, z: 1.3 }, { t: 8.6, x: 960, y: 540, z: 1 }]);
    C.withCam(cam, function () {
      cfg.extra = function (items) {
        // phones flying into the basket
        for (var k = 0; k < 14; k++) (function (k) {
          var rank = (k * 3) % Math.max(1, nS0), s = SLOTS[ORDER[rank]], s0 = 2 + (rank % 13) / 13 * 3.4, f = (t - s0) / 0.8;
          if (f > 0 && f < 1) items.push({ y: 3000, fn: function () { var e = C.easeIn(f), x = lerp(s.x, L.basket.x, e), y = lerp(s.y - 0.4 * s.h, L.basket.y - 30, e) - Math.sin(Math.PI * f) * 80; glowRect(ctx, x, y, 12, 21, f * 6, '#8fd8ff', 'rgba(143,216,255,0.9)', 1); } });
        })(k);
        // leavers
        for (var q = 0; q < 3; q++) (function (q) {
          var rank = nS0 - 1 - q; if (rank < 0) return; var s = SLOTS[ORDER[rank]], w0 = 7.4 + q * 0.5, f = (t - w0) / 3;
          if (f > 0 && f < 1) items.push({ y: s.y + 1, fn: function () { var e = C.ease(f), x = lerp(s.x, 2050, e), y = lerp(s.y + 26 * s.h / 100, s.y + 60, e); fig(x, y, s.h * 1.05, 'stand', C.outfitFor(s.i), false, q, CL(v0.students / 50 - rank) * (1 - C.prog(f, 0.75, 1)), t, dur); } });
        })(q);
      };
      cfg.seatFn = function (si, rank, s) {
        if (rank >= nS1 && rank < nS0 && nS0 - 1 - rank < 3) {
          var q = nS0 - 1 - rank, w0 = 7.4 + q * 0.5, a0 = CL(v0.students / 50 - rank), a1 = CL(v1.students / 50 - rank);
          if (t < w0) return { a: a0, x: s.x, y: s.y, pose: 'sit', flip: s.i % 3 === 0 };
          return { a: a1 * C.prog(t, w0 + 3, w0 + 4), x: s.x, y: s.y, pose: 'sit', flip: s.i % 3 === 0 };
        }
        return null;
      };
      SET.draw(ctx, cfg, t, dur);
      var sp = C.prog(t, 5.4, 6.2); if (sp > 0 && t < 7.4) { ctx.save(); ctx.globalAlpha *= fade(t, 5.4, 7.4, 0.1, 0.5); C.stamp('No AI', 1115, 520, sp, { size: 70, rot: -5 }); ctx.restore(); }
    });
    cap(ctx, 'Phones go into the basket. AI stays outside.', [], t, 1.0, 5.0);
    cap(ctx, 'A few families *leave*, for places that teach with it.', [], t, 7.6, 11.4);
    cap(ctx, '2027. A quieter room.', [], t, 11.6, 13.4);
  } };

  /* ---------- c2 ---------- */
  function luckOverlay(ctx, t, road) {
    var Y = [[2028, 4, 6.5, 620, 330], [2029, 7.5, 10, 1080, 360], [2030, 10.5, 13, 860, 300]];
    Y.forEach(function (k, i) {
      var ev = road.luck.filter(function (l) { return l.year === k[0]; })[0], a = k[1], b = k[2] + 1.1;
      if (t < a || t > b) return;
      ctx.save(); ctx.globalAlpha *= fade(t, a, b, 0.2, 0.5);
      if (ev && ev.hit) C.headline(k[0], ev.headline, k[3], k[4], C.prog(t, a, a + 1.2), ev.sign, 3 + i * 2);
      else { C.paper(C.torn(760, 150, 400, 56, 61 + i, 3), P.paper, { lift: 4 }); C.label(k[0] + ' · a quiet year', 960, 178, 32, P.inkSoft, 'center', 700); }
      ctx.restore();
    });
  }
  function c2(kind) {
    return { dur: 15, draw: function (ctx, t, road) {
      C.use(ctx); var dur = 15, year = 2027 + 3 * C.prog(t, 1, 14), cfg = SET.config(road, year), cutRoad = road.c2 === 'cut';
      cfg.cards = [road.c1, road.c2]; cfg.cardAge = [9, t - 0.6]; cfg.ban = road.c1 === 'ban'; cfg.ai = road.c1 === 'build';
      var camKeys = cutRoad
        ? [{ t: 0, x: 960, y: 540, z: 1 }, { t: 2, x: 960, y: 540, z: 1 }, { t: 3.5, x: 900, y: 560, z: 1.2 }, { t: 7.5, x: 900, y: 560, z: 1.2 }, { t: 10, x: 960, y: 540, z: 1 }]
        : [{ t: 0, x: 960, y: 540, z: 1 }, { t: 2.5, x: 960, y: 540, z: 1 }, { t: 4, x: 960, y: 740, z: 1.3 }, { t: 9, x: 960, y: 740, z: 1.3 }, { t: 12, x: 960, y: 540, z: 1 }];
      var v0 = Agamoto.at(road, 2027), v1 = Agamoto.at(road, 2030), F0 = Math.min(TPOS.length, v0.teachers / 4), F1 = Math.min(TPOS.length, v1.teachers / 4);
      var nLeave = cutRoad ? Math.min(6, Math.max(0, Math.ceil(F0 - 0.001) - Math.floor(F1 + 0.001))) : 0, firstLeave = Math.ceil(F0 - 0.001) - nLeave;
      if (cutRoad) {
        cfg.teachFn = function (i) { if (i >= firstLeave && i < firstLeave + nLeave) return { a: t < 2.6 + (i - firstLeave) * 0.6 ? CL(F0 - i) : 0 }; return null; };
      } else { cfg.mentAmt = C.prog(t, 2.8, 6.6); }
      C.withCam(C.track(t, camKeys), function () {
        cfg.extra = function (items) {
          for (var q = 0; q < nLeave; q++) (function (q) {
            var tp = TPOS[firstLeave + q], w0 = 2.6 + q * 0.6, f = (t - w0) / 3.2; if (f <= 0 || f >= 1) return;
            items.push({ y: tp.y + 1, fn: function () {
              var dir = tp.x < 960 ? -1 : 1, e = C.ease(f), x = lerp(tp.x, dir < 0 ? -100 : 2020, e), y = lerp(tp.y, tp.y + 90, e), o = C.outfitFor(firstLeave + q + 3);
              fig(x, y, tp.h, 'stand', o, dir < 0, q, CL(F0 - firstLeave - q) * (1 - C.prog(f, 0.85, 1)), t, dur); drawBox(ctx, x + dir * 8, y - tp.h * 0.4, 34);
            } });
          })(q);
        };
        SET.draw(ctx, cfg, t, dur);
        if (cutRoad) {
          var tp = C.prog(t, 3, 4.2), fo = fade(t, 3, 12.6, 0.4, 0.6);
          if (tp > 0 && fo > 0) { var fee = Agamoto.at(road, year).fees, ty = lerp(120, 205, C.back(tp)); ctx.save(); ctx.globalAlpha *= fo; ctx.strokeStyle = P.inkSoft; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1350, 0); ctx.lineTo(1350, ty - 30); ctx.stroke();
            ctx.translate(1350, ty); ctx.rotate(0.05 * C.amb(t, dur, 1)); C.paper(C.torn(-52, -30, 104, 70, 71, 2), P.mustard, { lift: 5 }); C.label('Fees ↓', 0, -12, 20, P.ink, 'center', 700); C.label('₹' + (Math.round(fee / 500) * 500).toLocaleString('en-IN'), 0, 14, 28, P.ink, 'center', 800); ctx.restore(); }
        } else {
          var mp = C.prog(t, 5.5, 6.6); if (mp > 0 && t < 10.5) { ctx.save(); ctx.globalAlpha *= fade(t, 5.5, 10.5, 0.3, 0.5); C.callout('Mentors · small groups', 1000, 500, 1000, 700, mp, { size: 30, bg: P.mustard }); ctx.restore(); }
        }
      });
      if (cutRoad) { cap(ctx, 'Fewer teachers. Lower fees.', [], t, 1.0, 4.4); cap(ctx, 'The boxes go out; the rooms *thin*.', [], t, 5.0, 8.4); }
      else { cap(ctx, 'AI explains. Teachers become *mentors*.', [], t, 1.0, 4.6); cap(ctx, 'Small groups. Parents who call back.', [], t, 5.2, 8.4); }
      luckOverlay(ctx, t, road);
    } };
  }
  ['ban-cut', 'ban-retrain', 'build-cut', 'build-retrain'].forEach(function (r) { CLIPS['c2-' + r] = c2(r); });

  /* ---------- states ---------- */
  SCENES.startState = function (id, road) {
    var c1 = road && road.c1 ? road.c1 : 'build';
    if (id === 'prologue') return { cam: REST, year: 2026, shot: 'START', cards: [] };
    if (id === 'wait-1' || /^c1-/.test(id)) return { cam: REST, year: 2026, shot: 'REST', cards: [] };
    if (id === 'wait-2' || /^c2-/.test(id)) return { cam: REST, year: 2027, shot: 'REST', cards: [c1] };
    return { cam: REST, year: 2026, shot: 'REST', cards: [] };
  };
  SCENES.endState = function (id, road) {
    var c1 = road && road.c1 ? road.c1 : (id === 'c1-ban' ? 'ban' : 'build');
    if (id === 'prologue' || id === 'wait-1') return { cam: REST, year: 2026, shot: 'REST', cards: [] };
    if (/^c1-/.test(id)) return { cam: REST, year: 2027, shot: 'REST', cards: [id.slice(3)] };
    if (id === 'wait-2') return { cam: REST, year: 2027, shot: 'REST', cards: [c1] };
    if (/^c2-/.test(id)) { var p = id.slice(3).split('-'); return { cam: REST, year: 2030, shot: 'REST', cards: [p[0], p[1]] }; }
    return { cam: REST, year: 2026, shot: 'REST', cards: [] };
  };
})(this);
