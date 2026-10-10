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
  // one teacher figure per TDIV teachers: this is one room of many, so 80 teachers show as 4 figures, not a crowd of 20
  var TDIV = 20; SET.TDIV = TDIV;
  // Aarav (cast.js) always sits at the same desk, in his blue shirt, so the classroom and the other places share him
  var AARAV_FIG = { body: '#3f6fa8', skin: '#8d5a3c', hair: '#1b1714', legs: '#2c3442' }; SET.aaravSlot = function () { return ORDER[6]; };

  /* ---------- config ---------- */
  SET.config = function (road, yf) {
    var v = Agamoto.at(road, yf);
    return {
      year: yf, students: v.students, teachers: v.teachers, fees: v.fees, results: v.results,
      seated: Math.round(v.students / 50), teacherFigs: Math.round(v.teachers / TDIV),
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
  function cardLabel(slot, kind, c1) {
    var o = Agamoto.option(slot, kind, c1);
    return o && o.label ? o.label : kind;
  }
  function drawCard(c, slot, kind, age, c1) {
    var cy = slot === 0 ? 235 : 375, rot = slot === 0 ? -3 : 2, f = CL(age / 0.2), sc = 1 + 0.22 * (1 - C.easeOut(f)), sq = 1 - 0.1 * Math.sin(Math.PI * f);
    c.save(); c.translate(1610, cy); c.rotate(rot * Math.PI / 180); c.scale(sc, sc * sq);
    var fill = slot === 0 ? P.saffron : P.teal;
    C.paper(C.torn(-180, -60, 360, 120, 40 + slot, 3), fill, { lift: 4 + 12 * (1 - f), blur: 10 + 10 * (1 - f), halftone: 0.4, dot: 'rgba(31,27,24,0.12)' });
    var txt = slot === 0 ? P.ink : P.paper, label = cardLabel(slot, kind, c1).toUpperCase(), size = 40;
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
    var N = Math.min(SLOTS.length, cfg.students / 50), F = Math.min(TPOS.length, cfg.teachers / TDIV), sky = skyAt(cfg.year);
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
        var o = s.i === ORDER[6] ? AARAV_FIG : C.outfitFor(s.i), devA = 0;
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
    (cfg.cards || []).forEach(function (k, i) { var age = ages[i] == null ? 9 : ages[i]; if (age >= 0) drawCard(c, i, k, age, cfg.cards[0]); });
  };

  /* ---------- clip helpers ---------- */
  var REST = C.REST;
  function view(c, cam, fn) { C.withCam(cam, fn); }
  function fade(t, a, b, fi, fo) { return C.clamp((t - a) / (fi || 0.4)) * C.clamp((b - t) / (fo || 0.5)); }
  function cap(c, text, emph, t, a, b, y) {
    if (t < a || t > b) return; c.save(); c.globalAlpha = fade(t, a, b, 0.05, 0.45); C.caption(text, emph, C.prog(t, a, a + Math.max(1, (b - a) * 0.55)), y || 880); c.restore();
  }
  function roadYear(id) { return id === 'prologue' || id === 'wait-1' ? 2026 : 2027; }

  /* ---------- prologue (animotion grammar: hook ≤ 3 s, push-through, close-ups with takes, pull-out to REST) ---------- */
  // 24 beats at 96 bpm. 0–2.5 hook: a phone tutor slams onto a saffron sunburst, FREE stamp on beat 3 ·
  // push-through ▸ 2.5–6.25 the classroom fills, a students tag counts up · cut ▸ 6.25–8.75 Aarav asks ·
  // cut ▸ 8.75–11.25 Sunanda's take (worry → resolve), ONE YEAR stamp · cut ▸ 11.25–15 pull-out to REST (the wait-1 frame).
  var B = C.BEAT;
  function chatPhone(c, x, y, w, h, t, t0) {     // a phone with an AI-tutor chat typing in (local time from t0)
    var lt = t - t0;
    c.save(); c.fillStyle = '#1f1b18'; c.beginPath(); c.roundRect(x, y, w, h, 46); c.fill();
    c.fillStyle = '#f4ead7'; c.beginPath(); c.roundRect(x + 18, y + 22, w - 36, h - 44, 30); c.fill();
    c.fillStyle = P.tealDark; c.beginPath(); c.roundRect(x + 18, y + 22, w - 36, 92, [30, 30, 0, 0]); c.fill();
    C.label('AI tutor · free', x + 50, y + 70, 30, '#f4ead7', 'left', 800);
    c.fillStyle = '#7be7d4'; c.beginPath(); c.arc(x + w - 60, y + 68, 10, 0, TAU); c.fill();
    var q = 'Explain torque, in Marathi', n = Math.round(q.length * CL((lt - 0.25) / 0.6));
    if (n > 0) { c.fillStyle = '#d6efe9'; c.beginPath(); c.roundRect(x + w - 40 - 330, y + 150, 330, 74, 22); c.fill(); C.label(q.slice(0, n), x + w - 60, y + 196, 25, P.ink, 'right', 600); }
    var r1 = C.back(CL((lt - 0.85) / 0.25)), r2 = C.back(CL((lt - 1.1) / 0.25));
    if (r1 > 0) { c.save(); c.translate(x + 40, y + 252); c.scale(r1, r1); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(0, 0, 360, 150, 22); c.fill();
      c.font = '30px ' + C.FONTS.deva; c.fillStyle = P.ink; c.fillText('बल × अंतर = टॉर्क', 22, 58);
      c.strokeStyle = P.saffron; c.lineWidth = 6; c.beginPath(); c.moveTo(30, 112); c.lineTo(320, 96); c.stroke(); c.fillStyle = P.tealDark; c.beginPath(); c.moveTo(160, 104); c.lineTo(146, 132); c.lineTo(174, 132); c.closePath(); c.fill(); c.restore(); }
    if (r2 > 0) { c.save(); c.translate(x + 40, y + 420); c.scale(r2, r2); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(0, 0, 300, 70, 22); c.fill(); C.label('Want a quiz? ✓', 22, 46, 28, P.tealDark, 'left', 700); c.restore(); }
    c.restore();
  }
  function bust(c, who, x, y, w, h, o, flip) {     // a CAST close-up as a scissor-cut sticker; o = CAST options (h, face, …)
    C.sticker(x, y, w, h, function (g) { CAST.draw(g, who, o.cx, o.cy, o.h, o); }, { res: 1, rimW: 9, dots: false });
  }
  CLIPS.prologue = { dur: 15, draw: function (ctx, t, road) {
    C.use(ctx); var dur = 15, c = ctx;
    // ---------- 1. hook (0 → 2.5), push-through at 2.5 ----------
    function hook() {
      C.cardboard('#e9a23b');
      C.sunburst(960, 470, 140, 1500, 22, '#f6d58a', 0.55, C.T12(t) * 0.08);
      var pp = C.prog(t, 0.12, 0.42);
      C.popIn(960, 470, pp, function () { C.sticker(960 - 230, 70, 460, 800, function (g) { chatPhone(g, 0, 0, 460, 800, t, 0); }, { res: 1, rimW: 10 }); });
      C.banner('A tutor in every phone', 960, 120, { size: 70, p: C.prog(C.T12(t), 0.3, 0.6), rot: -0.02, bg: '#fffdf7', seed: 21 });
      C.inkStamp('Free', 1350, 600, C.prog(t, 3 * B - 0.12, 3 * B + 0.38), { size: 120, col: P.tealDark, rot: -0.16, seed: 9 });
      C.confetti(5, t, '#fff3d6', 12, [0, 120, 1920, 760]);
    }
    // ---------- 2. the classroom fills (2.5 → 6.25) and 5. the pull-out (11.25 → 15) ----------
    function room(camKeys) {
      var cfg = SET.config(road, 2026), nSeats = Math.round(cfg.students / 50);
      cfg.seatFn = function (si, rank, s) {
        var a0 = 2.55 + (rank / nSeats) * 2.4 + C.rand(1000 + rank)() * 0.2, f = (t - a0) / 1.1;
        if (f >= 1) return null; if (f <= 0) return { a: 0 };
        var sx = s.x < 960 ? -90 : 2010, e = C.easeOut(f), x = lerp(sx, s.x, e), fl = sx > s.x, sitA = CL((f - 0.78) / 0.2);
        return [{ a: 1 - sitA, x: x, y: s.y + 26 * s.h / 100, pose: 'stand', flip: fl }, { a: sitA, x: x, y: s.y, pose: 'sit', flip: s.i % 3 === 0 }];
      };
      cfg.phoneFn = function (si, rank) { return C.prog(t, 4.4 + (rank / Math.max(1, nSeats)) * 1.2, 4.7 + (rank / Math.max(1, nSeats)) * 1.2); };
      var cam = C.track(t, camKeys);
      if (t < 14.4) cam = C.drift(cam, t);
      C.withCam(cam, function () { SET.draw(ctx, cfg, t, dur); });
      return nSeats;
    }
    var push = 0, out = 0;
    if (t < 2.5) {
      if (t > 2.5 - 0.26) { var u = 1 - (2.5 - t) / 0.26; C.pushFx(1 + 0.24 * u * u, 14 * u * u, hook); } else hook();
      cap(c, 'Pune, 2026. Every phone holds a *free* AI tutor.', [], t, 0.3, 2.45, 880);
      return;
    }
    if (t < 6.25) {
      var drawRoom = function () { room([{ t: 2.5, x: 960, y: 540, z: 1.0 }, { t: 6.25, x: 960, y: 520, z: 1.07 }]); };
      if (t < 2.5 + 0.32) { var v = C.easeOut((t - 2.5) / 0.32); C.pushFx(lerp(1.22, 1, v), 14 * (1 - v), drawRoom); } else drawRoom();
      var seated = 0, nS = Math.round(SET.config(road, 2026).students / 50);
      for (var k = 0; k < nS; k++) { var a0 = 2.55 + (k / nS) * 2.4 + C.rand(1000 + k)() * 0.2; if (t > a0 + 1.0) seated++; }
      var count = Math.round(2000 * seated / nS), tp = C.prog(C.T12(t), 2.9, 3.2);
      if (tp > 0) { c.save(); c.translate(1500, 210); c.rotate(0.03); var ks = C.countScale(count, 0, 2000, 0.85, 1.25) * C.back(tp); c.scale(ks, ks);
        C.paperPiece(C.tornRect2(-190, -62, 380, 124, 77, 4, 'tb'), '#fffdf7', { sy: 8 }); C.label(count.toLocaleString('en-IN') + ' students', 0, 12, 52, P.tealDark, 'center', 800); c.restore(); }
      C.banner('Vidya Classes · est. 2009', 640, 170, { size: 56, p: C.prog(C.T12(t), 2.8, 3.1), rot: -0.025, seed: 33 });
      cap(c, 'Vidya Classes opens at seven: two thousand *students*.', [], t, 2.75, 6.2, 880);
      return;
    }
    // ---------- 3. Aarav asks (6.25 → 8.75) ----------
    if (t < 8.75) {
      C.cardboard('#2f7f7a'); C.zigzag(120, 980, 1800, 16, '#3d9a93', 9, 40); C.confetti(8, t, '#7fc7bf', 10, [0, 0, 1920, 900]);
      var o = { face: 'smile', t: t, look: [0.4, 0], armR: [2.0, 1.6], holdR: 'phone', glow: 1, pivot: 'chest' };
      o = CAST.withTake(o, 'realize', t, 6.25 + B - 0.3);
      if (t > 7.0 && t < 8.1) o.face = 'talk';
      var lift = C.lerp(30, 0, C.easeOut(C.prog(t, 6.25, 6.6)));
      bust(c, 'aarav', 300, 60 + lift, 980, 1080, Object.assign(o, { cx: 470, cy: 2680, h: 2600 }));
      var bp = C.prog(C.T12(t), 7.0, 7.25);
      if (bp > 0) C.popIn(1430, 330, bp, function () {
        C.paperPiece(C.tornRect2(1080, 200, 700, 250, 61, 5), '#fffdf7', { sy: 9 });
        c.save(); c.fillStyle = '#fffdf7'; c.beginPath(); c.moveTo(1150, 430); c.lineTo(1080, 520); c.lineTo(1240, 440); c.closePath(); c.fill(); c.restore();
        c.save(); c.font = 'italic 64px ' + C.FONTS.serif; c.fillStyle = P.ink; c.textAlign = 'center'; c.fillText('“Ma\'am, why', 1430, 310); c.fillText('come to class?”', 1430, 390); c.restore();
        C.markUnder(1250, 1610, 412, C.prog(t, 7.4, 7.9), P.saffron, 7);
      });
      C.banner('Aarav · 14 · Class 9', 640, 150, { size: 50, p: C.prog(C.T12(t), 6.4, 6.65), rot: -0.03, seed: 45, bg: '#e3b23c' });
      cap(c, 'Aarav, 14, has the answer on his phone.', [], t, 6.4, 8.7, 880);
      return;
    }
    // ---------- 4. Sunanda's take (8.75 → 11.25) ----------
    if (t < 11.25) {
      C.cardboard('#8c2a2a'); C.sunburst(1250, 420, 120, 1300, 18, '#a8463c', 0.6, -C.T12(t) * 0.06);
      var so = { t: t, look: [-0.35, 0], face: 'neutral', flip: true, pivot: 'chest' };
      so = t < 10.0 ? CAST.withTake(so, 'worry', t, 15 * B - 0.32) : CAST.withTake(so, 'resolve', t, 17 * B - 0.32);
      bust(c, 'sunanda', 700, 50, 1000, 1080, Object.assign(so, { cx: 500, cy: 2700, h: 2600 }));
      var cp = C.prog(C.T12(t), 9.2, 9.5);
      if (cp > 0) C.popIn(420, 520, cp, function () {
        C.sticker(240, 330, 340, 380, function (g) { g.fillStyle = '#fffdf7'; g.fillRect(0, 0, 340, 380); g.fillStyle = P.coral; g.fillRect(0, 0, 340, 90);
          C.label('Calendar', 170, 58, 40, '#fffdf7', 'center', 800); C.label('2026', 170, 230, 150, P.ink, 'center', 800); C.label('Jan → Dec', 170, 320, 40, P.inkSoft, 'center', 700); }, { res: 1, rimW: 8 });
      });
      C.inkStamp('One year', 430, 760, C.prog(t, 17 * B - 0.12, 17 * B + 0.38), { size: 78, col: '#fffdf7', rot: -0.1, bg: '#8c2a2a', seed: 13 });
      cap(c, '“Why come to class?” Sunanda has one *year* to answer.', [], t, 8.9, 11.2, 880);
      return;
    }
    // ---------- 5. pull-out to REST (the frame wait-1 starts on) ----------
    room([{ t: 11.25, x: 980, y: 430, z: 1.55 }, { t: 12.0, x: 980, y: 430, z: 1.55 }, { t: 14.4, x: 960, y: 540, z: 1 }]);
    cap(c, 'Every choice from here plays out in ten *futures*.', [], t, 11.6, 14.3, 880);
  } };
  /* ---------- waits ---------- */
  CLIPS['wait-1'] = { dur: 4, draw: function (ctx, t, road) {
    C.use(ctx); var cfg = SET.config(road, 2026); C.withCam(REST, function () { SET.draw(ctx, cfg, t, 4); });
  } };
  CLIPS['wait-2'] = { dur: 4, draw: function (ctx, t, road) {
    C.use(ctx); var cfg = SET.config(road, 2027); C.withCam(REST, function () { SET.draw(ctx, cfg, t, 4); });
  } };

  /* ---------- reaction close-up (animotion: a two- to three-beat cut-in between story shots) ---------- */
  function closeUp(c, t, o) {
    C.cardboard(o.ground); if (o.burst) C.sunburst(o.bx || 1300, o.by || 420, 120, 1400, 20, o.burst, 0.55, C.T12(t) * 0.07 * (o.spin || 1));
    C.confetti(o.seed || 3, t, o.dots || '#fff3d6', 10, [0, 0, 1920, 900]);
    var co = CAST.withTake(Object.assign({ t: t, face: 'neutral', pivot: 'chest' }, o.cast), o.take, t, o.t0);
    var lift = C.lerp(26, 0, C.easeOut(C.prog(t, o.from, o.from + 0.35)));
    C.sticker(o.x, 50 + lift, 1000, 1080, function (g) { CAST.draw(g, o.who, 500, 2700, 2600, co); if (o.extra) o.extra(g); }, { res: 1, rimW: 9, dots: false });
    if (o.banner) C.banner(o.banner, o.bannerX || 640, 150, { size: 50, p: C.prog(C.T12(t), o.from + 0.12, o.from + 0.4), rot: -0.03, seed: 51, bg: o.bannerBg || '#fffdf7' });
  }

  /* ---------- c1 ---------- */
  function c1Year(t) { return 2026 + C.ease(C.prog(t, 1.5, 13.5)); }
  CLIPS['c1-build'] = { dur: 15, draw: function (ctx, t, road) {
    C.use(ctx); var dur = 15, cfg = SET.config(road, c1Year(t));
    cfg.cards = ['build']; cfg.cardAge = [t - 0.6];
    cfg.aiAmt = C.ease(C.prog(t, 3.8, 6.2)); cfg.phoneAmt = 1 - C.prog(t, 2.6, 4.4); cfg.ai = true;
    cfg.phoneFn = null; var tabAmt = C.prog(t, 2.6, 4.4);
    var nS = Math.round(cfg.students / 50);
    var cam = C.track(t, [{ t: 0, x: 960, y: 540, z: 1 }, { t: 2.5, x: 960, y: 540, z: 1 }, { t: 5.2, x: 1100, y: 430, z: 1.35 }, { t: 10.5, x: 1100, y: 430, z: 1.35 }, { t: 21 * B, x: 1040, y: 470, z: 1.2 }, { t: 14.4, x: 960, y: 540, z: 1 }]);
    C.withCam(cam, function () {
      SET.draw(ctx, cfg, t, dur);
      var sg = SET.struggling(nS).slice(0, 3), rp = C.prog(t, 7.2, 8.4);
      sg.forEach(function (i, k) { var p = SET.dotPos(i); ctx.save(); ctx.globalAlpha *= fade(t, 7.2, 11.8, 0.1, 0.5); C.ring(p.x, p.y, 18, 17, CL(rp * 1.5 - k * 0.2), P.coral, 4); ctx.restore(); });
      if (sg.length && t > 7.8 && t < 11.8) { var p0 = SET.dotPos(sg[0]); ctx.save(); ctx.globalAlpha *= fade(t, 7.8, 11.8, 0.3, 0.5); C.callout('Teacher sees who struggles', 1050, 505, p0.x, p0.y + 14, C.prog(t, 7.8, 8.8), { size: 28, bg: P.mustard }); ctx.restore(); }
    });
    if (t >= 18 * B && t < 21 * B) {       // cut-in: Aarav with the institute tablet, a joy take on beat 19
      closeUp(ctx, t, { ground: '#2f7f7a', burst: '#3d9a93', who: 'aarav', x: 380, from: 18 * B, take: 'joy', t0: 19 * B - 0.3, seed: 12,
        cast: { look: [0.5, 0.4], armL: [1.0, 1.2], armR: [1.1, 1.0], holdR: 'tablet', glow: 1 }, banner: 'Aarav · practising with AI', bannerBg: '#e3b23c' });
      var sp = C.prog(t, 19 * B - 0.12, 19 * B + 0.38); C.inkStamp('3 mistakes → 0', 1460, 620, sp, { size: 68, col: '#fffdf7', bg: '#2f7f7a', rot: -0.08, seed: 17 });
    }
    cap(ctx, 'Every student gets an AI tutor, in every class.', [], t, 1.0, 4.6);
    cap(ctx, 'And the teacher sees, at a glance, who is *struggling*.', [], t, 7.0, 11.0);
    cap(ctx, '2027. The room *hums*.', [], t, 11.4, 13.0, 880);
  } };
  CLIPS['c1-ban'] = { dur: 15, draw: function (ctx, t, road) {
    C.use(ctx); var dur = 15, cfg = SET.config(road, c1Year(t)), v1 = Agamoto.at(road, 2027), v0 = Agamoto.at(road, 2026);
    cfg.cards = ['ban']; cfg.cardAge = [t - 0.6]; cfg.ban = true;
    cfg.students = lerp(v0.students, v1.students, C.ease(C.prog(t, 7, 10)));
    cfg.banAmt = C.prog(t, 5.6, 6.3);
    cfg.phoneFn = function (si, rank) { var s0 = 2 + (rank % 13) / 13 * 3.4; return 1 - C.prog(t, s0, s0 + 0.4); };
    cfg.basketN = Math.floor(14 * C.prog(t, 2.6, 6.2));
    var nS0 = Math.round(v0.students / 50), nS1 = Math.round(v1.students / 50);
    var cam = C.track(t, [{ t: 0, x: 960, y: 540, z: 1 }, { t: 1.8, x: 960, y: 540, z: 1 }, { t: 3.2, x: 520, y: 620, z: 1.3 }, { t: 6.4, x: 520, y: 620, z: 1.3 }, { t: 8.6, x: 960, y: 540, z: 1 }, { t: 21 * B, x: 1300, y: 600, z: 1.25 }, { t: 14.4, x: 960, y: 540, z: 1 }]);
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
    if (t >= 18 * B && t < 21 * B) {       // cut-in: Aarav looks at the empty desks, a sag take on beat 19
      closeUp(ctx, t, { ground: '#8c6a3b', burst: '#9c7a4a', who: 'aarav', x: 380, from: 18 * B, take: 'sag', t0: 19 * B - 0.4, seed: 14, spin: -1,
        cast: { look: [-0.6, 0.2] }, banner: 'Aarav · phone in the basket', bannerBg: '#e3b23c' });
      var sp2 = C.prog(t, 19 * B - 0.12, 19 * B + 0.38); C.inkStamp('3 seats empty', 1460, 620, sp2, { size: 68, col: '#fffdf7', bg: '#8c6a3b', rot: -0.08, seed: 19 });
    }
    cap(ctx, 'Phones go into the basket. AI stays outside.', [], t, 1.0, 5.0);
    cap(ctx, 'A few families *leave*, for places that teach with it.', [], t, 7.6, 11.2);
    cap(ctx, '2027. A quieter *room*.', [], t, 11.4, 13.0, 880);
  } };

  /* ---------- c2 ---------- */
  // class27-<road>: the 2027 classroom beat right after the second vote (7 s). chapters.js opens c2-<road> with it,
  // then tears into the 2027–2030 places. The luck events now have their own scenes, so no overlay here.
  var CAP27 = {
    'build-cut': ['AI explains, so fewer teachers. Fees come *down*.', 'Some teachers carry out their boxes.'],
    'ban-cut': ['Fees drop to fight the free *apps*.', 'Some teachers carry out their boxes.'],
    'build-retrain': ['AI explains. Teachers become *mentors*.', 'Small groups. Parents who get a call back.'],
    'ban-retrain': ['No AI in class. Teachers become *mentors*.', 'Small groups, no screens. Parents kept close.']
  };
  function class27(kind) {
    return { dur: 7.5, year: 2027, draw: function (ctx, t, road) {
      C.use(ctx); var dur = 7.5, year = 2027, cfg = SET.config(road, year), cutRoad = road.c2 === 'cut';
      cfg.cards = [road.c1, road.c2]; cfg.cardAge = [9, t - 0.6]; cfg.ban = road.c1 === 'ban'; cfg.ai = road.c1 === 'build'; cfg.mentors = false;
      var camKeys = cutRoad
        ? [{ t: 0, x: 960, y: 540, z: 1 }, { t: 1.2, x: 960, y: 540, z: 1 }, { t: 2.4, x: 900, y: 560, z: 1.2 }, { t: 7.5, x: 875, y: 566, z: 1.25 }]
        : [{ t: 0, x: 960, y: 540, z: 1 }, { t: 1.6, x: 960, y: 540, z: 1 }, { t: 3.0, x: 960, y: 740, z: 1.3 }, { t: 7.5, x: 978, y: 746, z: 1.35 }];
      var v0 = Agamoto.at(road, 2027), v1 = Agamoto.at(road, 2030), F0 = Math.min(TPOS.length, v0.teachers / TDIV), F1 = Math.min(TPOS.length, v1.teachers / TDIV);
      var nLeave = cutRoad ? Math.min(6, Math.max(1, Math.ceil(F0 - 0.001) - Math.floor(F1 + 0.001))) : 0, firstLeave = Math.ceil(F0 - 0.001) - nLeave;
      if (cutRoad) {
        cfg.teachFn = function (i) { if (i >= firstLeave && i < firstLeave + nLeave) return { a: t < 2.0 + (i - firstLeave) * 0.5 ? CL(F0 - i) : 0 }; return null; };
      } else { cfg.mentAmt = C.prog(t, 1.8, 4.6); }
      C.withCam(C.track(t, camKeys), function () {
        cfg.extra = function (items) {
          for (var q = 0; q < nLeave; q++) (function (q) {
            var tp = TPOS[firstLeave + q], w0 = 2.0 + q * 0.5, f = (t - w0) / 3.2; if (!tp || f <= 0 || f >= 1) return;
            items.push({ y: tp.y + 1, fn: function () {
              var dir = tp.x < 960 ? -1 : 1, e = C.ease(f), x = lerp(tp.x, dir < 0 ? -100 : 2020, e), y = lerp(tp.y, tp.y + 90, e), o = C.outfitFor(firstLeave + q + 3);
              fig(x, y, tp.h, 'stand', o, dir < 0, q, CL(F0 - firstLeave - q) * (1 - C.prog(f, 0.85, 1)), t, dur); drawBox(ctx, x + dir * 8, y - tp.h * 0.4, 34);
            } });
          })(q);
        };
        SET.draw(ctx, cfg, t, dur);
        if (cutRoad) {
          var tp = C.prog(t, 2.2, 3.2);
          if (tp > 0) { var fee = Agamoto.at(road, 2028).fees, ty = lerp(120, 205, C.back(tp)); ctx.save(); ctx.strokeStyle = P.inkSoft; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1350, 0); ctx.lineTo(1350, ty - 30); ctx.stroke();
            ctx.translate(1350, ty); ctx.rotate(0.05 * C.amb(t, dur, 1)); C.paper(C.torn(-52, -30, 104, 70, 71, 2), P.mustard, { lift: 5 }); C.label('Fees ↓', 0, -12, 20, P.ink, 'center', 700); C.label('₹' + (Math.round(fee / 500) * 500).toLocaleString('en-IN'), 0, 14, 28, P.ink, 'center', 800); ctx.restore(); }
        } else {
          var mp = C.prog(t, 3.6, 4.6); if (mp > 0) { C.callout(road.c1 === 'ban' ? 'Mentors · no screens' : 'Mentors · small groups', 1000, 500, 1000, 700, mp, { size: 30, bg: P.mustard }); }
        }
      });
      var cp = CAP27[road.id] || CAP27['build-retrain'];
      cap(ctx, cp[0], [], t, 0.9, 3.9); cap(ctx, cp[1], [], t, 4.1, 7.4);
    } };
  }
  ['ban-cut', 'ban-retrain', 'build-cut', 'build-retrain'].forEach(function (r) { CLIPS['class27-' + r] = class27(r); });

  /* ---------- sound events (sound.js → groove.js): one sound per visible action ---------- */
  // the hook and the close-ups show only the year chip; the dashboard returns in the classroom (and at the wait-1 join)
  CLIPS.prologue.hud = function (t) { return t < 2.5 || (t >= 6.25 && t < 11.25) ? 'year' : 'full'; };
  CLIPS.prologue.events = function () {
    var ev = [[0.12, 'pop'], [0.32, 'swish']];
    for (var i = 0; i < 6; i++) ev.push([0.3 + i * 0.1, 'click']);                          // typing the question
    ev.push([0.85, 'pop'], [1.1, 'popLow', 1], [3 * B - 0.45, 'whooshIn'], [3 * B, 'clank'], [2.5 - 0.18, 'whoosh']);   // FREE slams on beat 3
    for (var j = 0; j < 8; j++) ev.push([2.7 + j * 0.34, 'step']);                          // the room fills
    ev.push([2.8, 'pop'], [2.95, 'pop']);
    for (var k = 0; k < 6; k++) ev.push([4.45 + k * 0.2, 'blip', k]);                       // phones light up
    ev.push([6.25, 'swish'], [6.27, 'clack'], [11 * B, 'pop'], [7.0, 'pop'], [8.75, 'swish'], [8.77, 'clack'], [9.2, 'popLow', 0], [17 * B - 0.45, 'whooshIn'], [17 * B, 'clank'], [11.25, 'swish'], [11.27, 'clack']);
    return ev;
  };
  CLIPS['c1-build'].hud = function (t) { return t >= 18 * B && t < 21 * B ? 'year' : 'full'; };
  CLIPS['c1-ban'].hud = CLIPS['c1-build'].hud;
  CLIPS['c1-build'].events = function () {
    var ev = [[0.62, 'clonk'], [2.5, 'swish']];
    for (var i = 0; i < 5; i++) ev.push([2.7 + i * 0.32, 'blip', i]);                       // tablets replace phones
    ev.push([3.9, 'switch'], [7.2, 'popLow', 0], [7.45, 'popLow', 1], [7.7, 'popLow', 2], [7.85, 'pop'], [18 * B, 'swish'], [18 * B + 0.02, 'clack'], [19 * B, 'pop'], [19 * B - 0.45, 'whooshIn'], [19 * B + 0.02, 'clank'], [21 * B, 'swish'], [21 * B + 0.02, 'clack']);
    return ev;
  };
  CLIPS['c1-ban'].events = function () {
    var ev = [[0.62, 'clonk'], [1.8, 'swish']];
    for (var k = 0; k < 14; k++) { var rank = (k * 3) % 40, s0 = 2 + (rank % 13) / 13 * 3.4; ev.push([s0 + 0.78, 'drip']); }   // phones land in the basket
    ev.push([4.95, 'whooshIn'], [5.6, 'clank']);                                             // NO AI stamp: riser peaks on the slam
    for (var q = 0; q < 6; q++) ev.push([7.6 + q * 0.5, 'step']);                            // a few families walk out
    ev.push([18 * B, 'swish'], [18 * B + 0.02, 'clack'], [19 * B - 0.45, 'whooshIn'], [19 * B, 'clank'], [21 * B, 'swish'], [21 * B + 0.02, 'clack']);
    return ev;
  };
  ['ban-cut', 'ban-retrain', 'build-cut', 'build-retrain'].forEach(function (r) {
    CLIPS['class27-' + r].events = function (road) {
      var ev = [[0.62, 'clonk']];
      if (road.c2 === 'cut') { ev.push([2.4, 'swish'], [2.55, 'pop']); for (var i = 0; i < 6; i++) ev.push([2.2 + i * 0.45, 'step']); }
      else { ev.push([3.0, 'swish']); for (var j = 0; j < 4; j++) ev.push([1.9 + j * 0.5, 'zip', j]); ev.push([3.75, 'pop']); }
      return ev;
    };
  });

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
    if (/^class27-/.test(id)) { var p = id.slice(8).split('-'); return { cam: REST, year: 2027, shot: 'CLASS27', cards: [p[0], p[1]] }; }
    return { cam: REST, year: 2026, shot: 'REST', cards: [] };
  };
})(this);
