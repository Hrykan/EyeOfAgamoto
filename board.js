/* board.js — the board view and the people the board's decisions reach.
   BOARD: the Vidya Classes boardroom, where every decision is taken (a wall screen shows the agenda and the numbers,
          and is the window the board watches the impact through).
   HOME:  a family at home: the fee bill, the report card, what the parents say.
   BATCH: 2036, where four students of the 2026 batch ended up.
   All draw in world space (1920×1080) through C (collage.js), pure functions of (cfg, t, dur). Needs engine.js. */
(function (root) {
  'use strict';
  var P = C.PALETTE, TAU = Math.PI * 2;
  var SCREEN = { x: 640, y: 96, w: 640, h: 360 };          // 16:9: at zoom 3 it fills the frame exactly
  var SLOTS = [{ cx: 1610, cy: 235, rot: -3, fill: P.saffron, ink: P.ink }, { cx: 1610, cy: 375, rot: 2, fill: P.teal, ink: P.paper }];
  var MEMBERS = [
    { x: 330, name: 'R. Kulkarni', role: 'Finance', o: { body: '#4b6fa8', skin: '#a8714f', hair: '#2a2420', glasses: true }, ph: 0.4 },
    { x: 640, name: 'M. Deshpande', role: 'Parents', o: { body: '#7d5a8c', skin: '#c48a63', hair: '#211c19', bun: true, dupatta: '#d9a933' }, ph: 1.3 },
    { x: 960, name: 'Sunanda Joshi', role: 'Chair', o: C.SUNANDA, ph: 2.1, chair: true },
    { x: 1280, name: 'A. Shaikh', role: 'Teachers', o: { body: '#2f7f7a', skin: '#8d5a3c', hair: '#cfc8bd' }, ph: 3.0 },
    { x: 1590, name: 'Priya N.', role: 'Students', o: { body: '#e2664f', skin: '#b57e5a', hair: '#211c19', braid: true }, ph: 4.2 }
  ];
  function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmtN(v) { return Math.round(v).toLocaleString('en-IN'); }
  function money(v) { return '₹' + (Math.round(v / 500) * 500).toLocaleString('en-IN'); }
  function optLabel(slot, kind, road) {
    if (slot === 1 && kind === 'custom' && road && road.option2) return road.option2.label;
    var o = Agamoto.option(slot, kind, road ? road.c1 : null); return o && o.label ? o.label : kind;
  }
  function wrap(c, text, x, y, maxW, lh, align) {
    var words = String(text).split(' '), line = '', lines = [];
    words.forEach(function (w) { var tt = line ? line + ' ' + w : w; if (c.measureText(tt).width > maxW && line) { lines.push(line); line = w; } else line = tt; });
    lines.push(line); c.textAlign = align || 'left';
    lines.forEach(function (l, i) { c.fillText(l, x, y + i * lh); });
    return lines.length;
  }
  // morning light by year: 2026 dawn peach → 2036 clear gold
  function sky(year) { var f = cl((year - 2026) / 10, 0, 1); return { top: mix('#f2b48a', '#f5d58c', f), low: mix('#f7dcb8', '#fbecc6', f) }; }
  function mix(a, b, f) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return 'rgb(' + pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * f); }).join(',') + ')';
  }

  /* ---------------------------------------------------------------- BOARD */
  function drawCard(c, slot, label, age) {
    var s = SLOTS[slot], f = cl(age / 0.2, 0, 1), sc = 1 + 0.22 * (1 - C.easeOut(f)), sq = 1 - 0.1 * Math.sin(Math.PI * f);
    c.save(); c.translate(s.cx, s.cy); c.rotate(s.rot * Math.PI / 180); c.scale(sc, sc * sq);
    C.paper(C.torn(-180, -60, 360, 120, 40 + slot, 3), s.fill, { lift: 4 + 12 * (1 - f), blur: 10 + 10 * (1 - f), halftone: 0.4, dot: 'rgba(31,27,24,0.12)' });
    var txt = String(label).toUpperCase(), size = 40;
    c.font = '800 ' + size + 'px ' + C.FONTS.label; while (c.measureText(txt).width > 310 && size > 20) { size -= 2; c.font = '800 ' + size + 'px ' + C.FONTS.label; }
    C.label(slot === 0 ? 'Decision 1 · 2026' : 'Decision 2 · 2027', -150, -36, 20, slot === 0 ? P.inkSoft : '#cfe9e5', 'left', 700);
    C.label(txt, 0, 12, size, s.ink, 'center', 800);
    c.fillStyle = '#b33a2f'; c.beginPath(); c.arc(0, -52, 10, 0, TAU); c.fill();
    c.restore();
  }
  function drawWindow(c, year, t, dur) {
    var x = 60, y = 110, w = 500, h = 360, k = sky(year);
    C.rect(x - 18, y - 18, w + 36, h + 36, P.wood, 91, { lift: 6 });
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, k.top); g.addColorStop(1, k.low);
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = 'rgba(255,240,200,0.9)'; c.beginPath(); c.arc(x + 360, y + 120 + 6 * C.amb(t, dur, 0.5), 34, 0, TAU); c.fill();
    // Pune: hills, a temple shikhara, the old gate, new towers (more towers in later years)
    c.fillStyle = '#c99c7a'; c.beginPath(); c.moveTo(x, y + 270); c.quadraticCurveTo(x + 140, y + 200, x + 280, y + 260); c.quadraticCurveTo(x + 400, y + 215, x + w, y + 255); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.fill();
    c.fillStyle = '#8e6a55';
    c.beginPath(); c.moveTo(x + 70, y + h); c.lineTo(x + 70, y + 250); c.lineTo(x + 100, y + 150); c.lineTo(x + 130, y + 250); c.lineTo(x + 130, y + h); c.fill();
    c.fillRect(x + 160, y + 250, 120, 110); for (var i = 0; i < 5; i++) c.fillRect(x + 160 + i * 26, y + 238, 14, 14);
    var towers = 3 + Math.floor(cl((year - 2026) / 3, 0, 3));
    for (var j = 0; j < towers; j++) { var tx = x + 300 + j * 46, th = 120 + ((j * 37) % 70); c.fillStyle = j % 2 ? '#9a7b66' : '#a9897a'; c.fillRect(tx, y + h - th, 34, th);
      c.fillStyle = 'rgba(255,236,190,0.55)'; for (var r = 0; r < th / 22 - 1; r++) c.fillRect(tx + 7, y + h - th + 10 + r * 22, 8, 8); }
    c.restore();
    c.fillStyle = P.wood; c.fillRect(x + w / 2 - 6, y, 12, h); c.fillRect(x, y + h / 2 - 6, w, 12);
  }
  function drawScreen(c, cfg, t, dur) {
    var S = SCREEN;
    C.paper([[S.x - 22, S.y - 22], [S.x + S.w + 22, S.y - 22], [S.x + S.w + 22, S.y + S.h + 22], [S.x - 22, S.y + S.h + 22]], '#1d1915', { lift: 8, blur: 18 });
    var sc = cfg.screen || { kind: 'agenda' };
    if (sc.kind === 'frame' && sc.img) { c.drawImage(sc.img, S.x, S.y, S.w, S.h); return; }
    var g = c.createLinearGradient(0, S.y, 0, S.y + S.h); g.addColorStop(0, '#22403c'); g.addColorStop(1, '#162a27');
    c.fillStyle = g; c.fillRect(S.x, S.y, S.w, S.h);
    var road = cfg.road, n = cfg.agenda || 0, year = n === 0 ? 2026 : n === 1 ? 2027 : 2036;
    C.label('Board meeting · ' + year, S.x + 32, S.y + 38, 22, '#bfece4', 'left', 700);
    c.save(); c.globalAlpha = 0.6 + 0.4 * (0.5 + 0.5 * C.amb(t, dur, 1.1)); c.fillStyle = '#ff6f59'; c.beginPath(); c.arc(S.x + S.w - 34, S.y + 38, 7, 0, TAU); c.fill(); c.restore();
    var head = n === 2 ? 'The 2036 report' : 'Agenda ' + (n + 1);
    var q = n === 0 ? Agamoto.question(0) : n === 1 ? Agamoto.question(1, road && road.c1) : (road && road.endingInfo ? road.endingInfo.label : '');
    C.label(head, S.x + 32, S.y + 84, 20, '#e0863e', 'left', 800);
    c.font = 'italic 40px ' + C.FONTS.serif; c.fillStyle = '#f4ead7'; c.textBaseline = 'alphabetic';
    var lines = wrap(c, q, S.x + 32, S.y + 132, S.w - 64, 44, 'left');
    if (n === 0) { c.font = 'italic 24px ' + C.FONTS.serif; c.fillStyle = '#bfd8d3'; wrap(c, 'A free AI tutor now explains any topic, in any language.', S.x + 32, S.y + 132 + lines * 44 + 4, S.w - 64, 28); }
    // the numbers, and how they moved since the last meeting
    var from = road ? road.counters[2026] : null, now = road ? road.counters[year] : null;
    if (now) {
      var items = [['Students', now.students, now.students - from.students, fmtN, 20, 1], ['Teachers', now.teachers, now.teachers - from.teachers, fmtN, 1, 1],
        ['Fees', now.fees, now.fees - from.fees, money, 500, -1], ['Results', now.results, now.results - from.results, fmtN, 1, 1]];
      items.forEach(function (it, i) {
        var bx = S.x + 32 + i * 150, by = S.y + S.h - 70;
        C.label(it[0], bx, by, 16, '#9fc3bd', 'left', 600);
        C.label(it[3](it[1]), bx, by + 30, 30, '#f4ead7', 'left', 800);
        if (n > 0 && Math.abs(it[2]) >= it[4]) { var good = it[2] * it[5] > 0; C.label((it[2] > 0 ? '▲ ' : '▼ ') + (it[0] === 'Fees' ? money(Math.abs(it[2])) : fmtN(Math.abs(it[2]))), bx, by + 58, 16, good ? '#5fd39a' : '#ff9a62', 'left', 700); }
      });
    }
  }
  function drawMember(c, m, i, t, dur) {
    // seated behind the table; the chair a little larger, at the centre
    var breathe = 2 * C.amb(t, dur, m.ph);
    C.figure(m.x, 772 + breathe * 0.4, m.chair ? 470 : 430, 'sit', m.o, m.x > 960, 0);
  }
  function drawTable(c, t, dur) {
    // long table, front edge low in frame
    var g = c.createLinearGradient(0, 700, 0, 870); g.addColorStop(0, '#9a6544'); g.addColorStop(1, '#7a4c31');
    C.paper([[210, 704], [1710, 704], [1820, 868], [100, 868]], g, { lift: 10, blur: 22 });
    c.fillStyle = 'rgba(255,230,190,0.18)'; c.beginPath(); c.moveTo(230, 712); c.lineTo(1690, 712); c.lineTo(1700, 724); c.lineTo(222, 724); c.fill();
    C.paper([[100, 868], [1820, 868], [1820, 930], [100, 930]], '#5f3a25', { lift: 6 });
  }
  function drawProps(c, t, dur) {
    MEMBERS.forEach(function (m, i) {
      // papers, a chai glass with steam, a name plate
      c.save(); c.translate(m.x + (i % 2 ? 60 : -70), 780); c.rotate((i % 2 ? 4 : -5) * Math.PI / 180);
      C.paper(C.torn(-46, -30, 92, 62, 70 + i, 2), '#fbf5e8', { lift: 2, blur: 4 });
      c.fillStyle = 'rgba(31,27,24,0.25)'; for (var l = 0; l < 4; l++) c.fillRect(-34, -18 + l * 11, 60 - (l % 2) * 18, 3);
      c.restore();
      var gx = m.x + (i % 2 ? -64 : 66), gy = 770;
      c.fillStyle = 'rgba(214,180,120,0.85)'; c.beginPath(); c.moveTo(gx - 11, gy - 26); c.lineTo(gx + 11, gy - 26); c.lineTo(gx + 8, gy); c.lineTo(gx - 8, gy); c.closePath(); c.fill();
      c.fillStyle = '#b5762f'; c.fillRect(gx - 9, gy - 16, 18, 14);
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2.4; c.beginPath();
      for (var s = 0; s < 22; s++) { var yy = gy - 32 - s * 2.2, xx = gx + Math.sin(s * 0.5 + 6.283 * C.amb(t, dur, i) * 0.5) * 4; if (s === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke();
      c.save(); c.translate(m.x, 840);
      C.paper(C.torn(-92, -22, 184, 44, 80 + i, 2), m.chair ? P.saffron : '#fbf5e8', { lift: 3, blur: 5 });
      C.label(m.name, 0, -6, 18, P.ink, 'center', 800); C.label(m.role, 0, 12, 13, P.inkSoft, 'center', 600);
      c.restore();
    });
  }
  // cfg: {road, year, agenda: 0|1|2, screen: {kind:'agenda'} | {kind:'frame', img}, cards: [kind...], cardAge: [sec...]}
  function drawBoard(ctx, cfg, t, dur) {
    var c = ctx; C.use(c); dur = dur || 4;
    var g = c.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, '#eadcc2'); g.addColorStop(0.62, '#dccaa9'); g.addColorStop(1, '#c7a988');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    C.paper([[0, 560], [1920, 560], [1920, 708], [0, 708]], '#8a5a3b', { lift: 2, shadow: false });     // wood panelling
    c.fillStyle = 'rgba(0,0,0,0.08)'; for (var px = 40; px < 1920; px += 160) c.fillRect(px, 572, 4, 128);
    c.fillStyle = '#6e4a33'; c.fillRect(0, 930, 1920, 150);                                             // floor
    drawWindow(c, cfg.year || 2026, t, dur);
    drawScreen(c, cfg, t, dur);
    // pin board for the decisions taken
    C.rect(1400, 140, 440, 330, '#c79a62', 92, { halftone: 0.3, lift: 6 });
    C.label('Board decisions', 1620, 160, 18, P.inkSoft, 'center', 700);
    (cfg.cards || []).forEach(function (k, i) { var age = cfg.cardAge && cfg.cardAge[i] != null ? cfg.cardAge[i] : 9; if (age >= 0) drawCard(c, i, optLabel(i, k, cfg.road), age); });
    // founder photo
    c.save(); c.translate(1500, 515); c.rotate(-0.03); C.paper(C.torn(-56, -30, 112, 60, 93, 2), '#fbf5e8', { lift: 3 }); C.label('Vidya · since 2009', 0, 2, 14, P.inkSoft, 'center', 700); c.restore();
    MEMBERS.forEach(function (m, i) { drawMember(c, m, i, t, dur); });
    drawTable(c, t, dur);
    drawProps(c, t, dur);
  }
  // camera that pushes into the wall screen: f = 0 at rest, 1 when the screen exactly fills the frame
  function zoomCam(f) {
    var e = C.ease(cl(f, 0, 1)), z = Math.pow(3, e), g = (z - 1) / 2;
    var px = SCREEN.x + SCREEN.w / 2, py = SCREEN.y + SCREEN.h / 2;
    var tx = px + (960 - px) * g, ty = py + (540 - py) * g;
    return { x: px - (tx - 960) / z, y: py - (ty - 540) / z, z: z };
  }

  /* ---------------------------------------------------------------- HOME */
  function homeLine(road, stage) {
    if (!road) return '';
    if (road.c2 === 'custom' && stage === 2 && road.custom && road.custom.atHome) return road.custom.atHome;
    if (stage === 1) return road.c1 === 'build' ? 'The AI shows her where she\'s stuck. Her teacher already knows.' : 'No phones in class. So he uses the free app at night anyway.';
    var k = road.c1 + '-' + road.c2;
    return { 'build-retrain': 'Her mentor called again. She actually likes physics now.', 'build-cut': 'Fees came down. But his teacher has sixty students now.',
      'ban-retrain': 'No AI in class, but her mentor knows her by name.', 'ban-cut': 'Cheaper, yes. But who is checking his work?' }[k] || 'The board\'s decision reached our dinner table.';
  }
  function speaker(road, stage) { return stage === 1 ? (road.c1 === 'build' ? 'mother' : 'father') : ((road.c2 === 'cut') ? 'father' : 'mother'); }
  // cfg: {road, stage: 1 (2027) | 2 (2030)}
  function drawHome(ctx, cfg, t, dur) {
    var c = ctx; C.use(c); dur = dur || 6;
    var road = cfg.road, stage = cfg.stage || 1, year = stage === 1 ? 2027 : 2030;
    var now = road.counters[year], from = road.counters[2026];
    var g = c.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, '#d9c6a6'); g.addColorStop(1, '#b99a78');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    c.fillStyle = '#7d5b43'; c.fillRect(0, 900, 1920, 180);
    // evening window with city lights
    var wx = 1300, wy = 120, ww = 520, wh = 380;
    C.rect(wx - 16, wy - 16, ww + 32, wh + 32, '#6e4a33', 95, { lift: 6 });
    var sg = c.createLinearGradient(0, wy, 0, wy + wh); sg.addColorStop(0, '#2b3550'); sg.addColorStop(1, '#5b4a6a'); c.fillStyle = sg; c.fillRect(wx, wy, ww, wh);
    for (var b = 0; b < 9; b++) { var bx = wx + 10 + b * 58, bh = 90 + ((b * 53) % 150); c.fillStyle = '#1f2436'; c.fillRect(bx, wy + wh - bh, 46, bh);
      for (var r = 0; r < bh / 24 - 1; r++) for (var q = 0; q < 2; q++) { var on = ((b * 7 + r * 3 + q) % 4) !== 0; if (on) { c.fillStyle = 'rgba(255,214,140,' + (0.55 + 0.35 * (0.5 + 0.5 * C.amb(t, dur, b + r + q))) + ')'; c.fillRect(bx + 8 + q * 18, wy + wh - bh + 10 + r * 24, 9, 10); } } }
    c.fillStyle = '#6e4a33'; c.fillRect(wx + ww / 2 - 5, wy, 10, wh);
    // calendar with the year
    c.save(); c.translate(1080, 250); c.rotate(0.02); C.paper(C.torn(-90, -110, 180, 220, 96, 2), '#fbf5e8', { lift: 5 });
    c.fillStyle = P.coral; c.fillRect(-90, -110, 180, 44); C.label('June', 0, -88, 22, '#fff', 'center', 700);
    c.font = '800 96px ' + C.FONTS.label; c.fillStyle = P.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(year), 0, 20); c.restore();
    // fridge with the report card
    C.paper([[90, 230], [390, 230], [390, 900], [90, 900]], '#e9e4da', { lift: 10, blur: 20 }); c.fillStyle = '#c9c2b6'; c.fillRect(90, 520, 300, 6); c.fillRect(350, 300, 10, 160); c.fillRect(350, 560, 10, 220);
    var dr = now.results - from.results;
    c.save(); c.translate(240, 380); c.rotate(-0.05 + 0.01 * C.amb(t, dur, 2)); C.paper(C.torn(-110, -80, 220, 160, 97, 2), '#fbf5e8', { lift: 4 });
    C.label('Test results', 0, -50, 20, P.inkSoft, 'center', 700);
    C.label(String(Math.round(now.results)), 0, 6, 64, Math.abs(dr) < 1 ? P.blue : dr > 0 ? '#178a52' : '#c45a1c', 'center', 800);
    C.label((dr >= 1 ? '▲ ' : dr <= -1 ? '▼ ' : '') + (Math.abs(dr) < 1 ? 'same as 2026' : Math.round(Math.abs(dr)) + ' since 2026'), 0, 54, 18, P.inkSoft, 'center', 700);
    c.fillStyle = '#d9a933'; c.beginPath(); c.arc(0, -78, 9, 0, TAU); c.fill(); c.restore();
    // dining table + family
    var fam = [{ x: 620, o: { body: '#4b6fa8', skin: '#8d5a3c', hair: '#211c19' }, flip: false, who: 'father' },
      { x: 1200, o: { body: '#c98b4a', skin: '#a8714f', hair: '#211c19', bun: true, dupatta: '#e2664f' }, flip: true, who: 'mother' },
      { x: 910, o: { body: '#2f7f7a', skin: '#b57e5a', hair: '#211c19', braid: stage === 1 }, flip: false, who: 'child', h: 330 }];
    fam.forEach(function (p, i) { C.figure(p.x, 790 + 2 * C.amb(t, dur, i * 1.7), p.h || 420, 'sit', p.o, p.flip, 0); });
    C.paper([[470, 728], [1350, 728], [1400, 800], [420, 800]], '#a0704c', { lift: 8, blur: 16 });
    C.paper([[420, 800], [1400, 800], [1400, 836], [420, 836]], '#7a4c31', { lift: 4 });
    c.fillStyle = '#6a4a35'; c.fillRect(450, 836, 18, 80); c.fillRect(1352, 836, 18, 80);
    // plates + steam
    [700, 1120].forEach(function (px, i) { c.fillStyle = '#f4ead7'; c.beginPath(); c.ellipse(px, 752, 44, 12, 0, 0, TAU); c.fill(); c.fillStyle = '#e0a03e'; c.beginPath(); c.ellipse(px, 748, 26, 7, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2.5; c.beginPath(); for (var s2 = 0; s2 < 20; s2++) { var yy = 736 - s2 * 3, xx = px + Math.sin(s2 * 0.6 + i + 3 * C.amb(t, dur, i)) * 5; if (s2) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke(); });
    // what the child studies with: a glowing tablet if AI is in class (or the free app on a phone), else books
    var ai = road.c1 === 'build', viral = stage === 2 && road.luck.some(function (l) { return l.id === 'viral' && l.hit; });
    if (ai || (road.c1 === 'ban')) {
      var glow = ai ? '#9ef0dc' : '#bcd6ff';
      c.save(); c.translate(910, 738); c.fillStyle = '#20262b'; c.fillRect(ai ? -42 : -16, -30, ai ? 84 : 32, ai ? 54 : 48);
      c.fillStyle = glow; c.globalAlpha = 0.75 + 0.2 * C.amb(t, dur, 0.9); c.fillRect(ai ? -36 : -12, -25, ai ? 72 : 24, ai ? 44 : 38); c.restore();
      C.label(ai ? 'AI tutor · struggle map' : (viral ? 'Free AI app · viral' : 'Free AI app'), 910, 694, 15, P.inkSoft, 'center', 700);
    }
    // the fee bill on the table
    var df = now.fees - from.fees;
    c.save(); c.translate(560, 782); c.rotate(-0.06); C.paper(C.torn(-120, -40, 240, 80, 98, 2), '#fbf5e8', { lift: 3 });
    C.label('Vidya Classes · fees', 0, -20, 15, P.inkSoft, 'center', 700);
    C.label(money(now.fees) + ' / year', 0, 4, 24, P.ink, 'center', 800);
    C.label(Math.abs(df) < 500 ? 'same as 2026' : (df > 0 ? '▲ ' : '▼ ') + money(Math.abs(df)) + ' since 2026', 0, 26, 15, Math.abs(df) < 500 ? P.blue : df < 0 ? '#178a52' : '#c45a1c', 'center', 700);
    c.restore();
    // luck at home: the newspaper
    if (stage === 2) {
      var news = road.luck.filter(function (l) { return l.hit; }).pop();
      if (news) { c.save(); c.translate(1240, 790); c.rotate(0.05); C.paper(C.torn(-120, -34, 240, 68, 99, 3), '#efe8d8', { halftone: 0.4, lift: 3 });
        C.label(news.year + ' · in the news', 0, -16, 13, P.inkSoft, 'center', 700); c.font = 'italic 17px ' + C.FONTS.serif; c.fillStyle = P.ink; c.textBaseline = 'middle'; wrap(c, news.headline, 0, 6, 220, 18, 'center'); c.restore(); }
    }
    // what a parent says
    var line = homeLine(road, stage), who = speaker(road, stage), sp = fam.filter(function (p) { return p.who === who; })[0];
    var bp = C.easeOut(C.prog(t, 0.9, 1.5));
    if (bp > 0) {
      c.save(); c.globalAlpha = bp; c.font = 'italic 34px ' + C.FONTS.serif;
      var bw = Math.min(620, c.measureText(line).width + 60), bx = cl(sp.x - bw / 2, 420, 1500 - bw), by = 430 - (1 - bp) * 20;
      var lines = Math.ceil((c.measureText(line).width + 60) / 620);
      C.paper(C.torn(bx, by, bw, 40 + lines * 40, 100, 3), '#fbf5e8', { lift: 6 });
      c.fillStyle = '#fbf5e8'; c.beginPath(); c.moveTo(sp.x - 14, by + 40 + lines * 40); c.lineTo(sp.x + 14, by + 40 + lines * 40); c.lineTo(sp.x, by + 70 + lines * 40); c.fill();
      c.fillStyle = P.ink; c.textBaseline = 'alphabetic'; wrap(c, '“' + line + '”', bx + 30, by + 50, bw - 60, 40, 'left');
      C.label((who === 'mother' ? 'Mother' : 'Father') + ' · at home, ' + year, bx + 30, by - 14, 16, P.inkSoft, 'left', 700);
      c.restore();
    }
    var cap = stage === 1 ? 'Meanwhile, at *home*.' : 'At *home*, three years on.';
    if (t > 1.2 && t < dur - 0.9) { c.save(); c.globalAlpha = C.clamp(Math.min((t - 1.2) / 0.3, (dur - 0.9 - t) / 0.3)); C.caption(cap, [], C.prog(t, 1.3, 2.4), 130, { size: 46, x: 700 }); c.restore(); }
  }

  /* ---------------------------------------------------------------- BATCH (2036) */
  var STUDENTS = [
    { name: 'Asha', o: { body: '#e2664f', skin: '#a8714f', hair: '#211c19', braid: true }, off: 10 },
    { name: 'Rohan', o: { body: '#4b6fa8', skin: '#8d5a3c', hair: '#211c19' }, off: 3 },
    { name: 'Zoya', o: { body: '#7d5a8c', skin: '#c48a63', hair: '#211c19', bun: true }, off: -4 },
    { name: 'Vikram', o: { body: '#3f8f5f', skin: '#b57e5a', hair: '#211c19', glasses: true }, off: -11 }
  ];
  var TIERS = [
    ['Left studies to support the family', 'Third attempt at the entrance exam', 'Delivery rider, studies at night', 'Learning to code from free videos'],
    ['Cleared the entrance on a second try', 'B.Com, works at a bank in Kothrud', 'Diploma, works at an auto plant', 'Joined the family shop'],
    ['Software developer in Hinjewadi', 'Nursing degree, first in her family', 'Civil engineer on the metro', 'Runs the AI lab at a school'],
    ['Engineer at a Pune water-tech startup', 'Doctor, residency at Sassoon Hospital', 'Researcher at IISER Pune', 'Teaches physics at Vidya, as a mentor']
  ];
  function outcomes(road) {
    var res = road.counters[2036].results;
    return STUDENTS.map(function (s, i) { var sc = res + s.off, tier = sc >= 75 ? 3 : sc >= 60 ? 2 : sc >= 45 ? 1 : 0; return { s: s, tier: tier, text: TIERS[tier][i] }; });
  }
  function drawBatch(ctx, cfg, t, dur) {
    var c = ctx; C.use(c); dur = dur || 7.5;
    var road = cfg.road;
    var g = c.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, '#2a2420'); g.addColorStop(1, '#1b1714'); c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    C.rect(90, 120, 1740, 780, '#c79a62', 101, { halftone: 0.25, lift: 10 });
    C.label('Where the 2026 batch is in 2036', 960, 190, 40, P.ink, 'center', 800);
    C.label('The four students from the 2026 classroom, ten years on · ' + (road.endingInfo ? road.endingInfo.label : ''), 960, 236, 20, P.inkSoft, 'center', 600);
    var tone = ['#c45a1c', '#d9a933', '#2f7f7a', '#178a52'];
    outcomes(road).forEach(function (o, i) {
      var p = C.back(C.prog(t, 0.3 + i * 0.45, 0.9 + i * 0.45)); if (p <= 0) return;
      var cx = 300 + i * 440, cy = 560 + (1 - p) * -260, rot = ((i % 2 ? 2.5 : -2.5) + 0.8 * C.amb(t, dur, i)) * Math.PI / 180;
      c.save(); c.translate(cx, cy); c.rotate(rot); c.globalAlpha = C.clamp(p * 1.5);
      C.paper(C.torn(-180, -230, 360, 470, 110 + i, 3), '#fbf5e8', { lift: 12, blur: 20 });
      c.fillStyle = tone[o.tier]; c.globalAlpha *= 0.25; c.fillRect(-150, -200, 300, 250); c.globalAlpha = C.clamp(p * 1.5);
      C.figure(0, 40, 210, o.tier >= 2 ? 'stand' : 'sit', o.s.o, i % 2 === 1, 0);
      C.label(o.s.name, -150, 92, 34, P.ink, 'left', 800);
      C.label('2026 batch · age 26 now', -150, 122, 16, P.inkSoft, 'left', 600);
      c.font = 'italic 27px ' + C.FONTS.serif; c.fillStyle = P.ink; c.textBaseline = 'alphabetic'; wrap(c, o.text, -150, 166, 300, 30, 'left');
      c.fillStyle = tone[o.tier]; c.fillRect(-180, 226, 360, 10);
      c.fillStyle = '#b33a2f'; c.beginPath(); c.arc(0, -222, 10, 0, TAU); c.fill();
      c.restore();
    });
    if (t > 2.6 && t < dur - 0.6) { c.save(); c.globalAlpha = C.clamp(Math.min((t - 2.6) / 0.3, (dur - 0.6 - t) / 0.3)); C.caption('Same students. Different *decisions*. Different lives.', [], C.prog(t, 2.7, 4.2), 862, { size: 42 }); c.restore(); }
  }

  root.BOARD = { draw: drawBoard, zoomCam: zoomCam, SCREEN: SCREEN, SLOTS: SLOTS, MEMBERS: MEMBERS };
  root.HOME = { draw: drawHome, line: homeLine };
  root.BATCH = { draw: drawBatch, outcomes: outcomes };
})(this);
