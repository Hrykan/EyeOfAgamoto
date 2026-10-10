/* endings.js — 2036 endings (end-build-retrain, end-build-cut, end-ban-retrain, end-ban-cut) + rewind. Uses SET from scenes.js when present, own fallback room otherwise. */
(function (root) {
  'use strict';
  var CLIPS = root.CLIPS = root.CLIPS || {};
  var P = C.PALETTE, W = 1920, H = 1080, END_DUR = 12;
  var PREFER_OWN_END = true; // end-* shots use this file's own 2036 room (looks right, independent of scenes.js timing)
  var TONE = { trusted: 'good', lean: 'good', smaller: 'steady', empty: 'hard' };
  var TAGCOL = { trusted: P.teal, lean: P.saffron, smaller: P.mustard, empty: '#4b6fa8' };
  var STAMPCOL = { trusted: '#1d7a4a', lean: '#1d7a4a', smaller: '#a87614', empty: '#3d5a80' };

  function hasSet() { return !!(root.SET && root.SET.config && root.SET.draw); }
  function endId(road) { return road.ending || (road.endingInfo && road.endingInfo.id) || 'smaller'; }

  /* ---------- layout (SET.layout when present, else fallback) ---------- */
  var FB = (function () {
    var desks = [], rows = [620, 765, 910], sc = [0.8, 0.96, 1.12];
    for (var r = 0; r < 3; r++) {
      var cols = [0, 1, 2, 3, 4, 5, 6, 7].sort(function (a, b) { return Math.abs(a - 3.5) - Math.abs(b - 3.5) || a - b; });
      for (var k = 0; k < cols.length; k++) desks.push({ x: 215 + cols[k] * 212, y: rows[r], s: sc[r], r: r });
    }
    return { window: { x: 60, y: 110, w: 540, h: 410 }, board: { x: 660, y: 140, w: 640, h: 330 }, screen: { x: 990, y: 175, w: 280, h: 230 },
      notice: { x: 1400, y: 140, w: 440, h: 330 }, sunanda: { x: 800, y: 600 }, desks: desks };
  })();
  function LAY() {
    var L = !PREFER_OWN_END && root.SET && root.SET.layout;
    if (!(L && L.desks && L.desks.length)) return FB;
    return { window: L.window || FB.window, board: L.board || FB.board, screen: L.screen || FB.screen, notice: L.notice || FB.notice, sunanda: L.sunanda || FB.sunanda, desks: L.desks };
  }
  function bbox(list) {
    if (!list.length) return null;
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    list.forEach(function (d) { x0 = Math.min(x0, d.x); x1 = Math.max(x1, d.x); y0 = Math.min(y0, d.y); y1 = Math.max(y1, d.y); });
    return { x0: x0, y0: y0, x1: x1, y1: y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  function clampCam(x, y, z) { return { x: C.clamp(x, 960 / z, W - 960 / z), y: C.clamp(y, 540 / z, H - 540 / z), z: z }; }

  /* ---------- config ---------- */
  function fbConfig(road, Y) {
    var v = Agamoto.at(road, Y);
    return { year: Y, students: v.students, teachers: v.teachers, seated: Math.round(v.students / 50), teacherFigs: Math.round(v.teachers / 4),
      ai: road.c1 === 'build' && Y >= 2026.6, mentors: road.c2 === 'retrain' && Y >= 2027.6, light: 0.5, cards: [] };
  }
  function baseCfg(road, Y) { return hasSet() ? SET.config(road, Y) : fbConfig(road, Y); }
  function endCfg(road, id) {
    var b = PREFER_OWN_END ? fbConfig(road, 2036) : baseCfg(road, 2036), cfg = {}, k, cap = LAY().desks.length;
    for (k in b) cfg[k] = b[k];
    cfg.cards = [];
    if (id === 'trusted') { cfg.seated = cap; cfg.ai = true; cfg.mentors = true; cfg.teacherFigs = Math.max(cfg.teacherFigs || 0, 5); }
    else if (id === 'lean') { cfg.seated = cap; cfg.ai = true; cfg.mentors = false; cfg.teacherFigs = 1; }
    else if (id === 'smaller') { cfg.seated = Math.round(cap * 0.5); cfg.teacherFigs = Math.min(Math.max(cfg.teacherFigs || 2, 2), 3); }
    else { cfg.seated = 3; cfg.ai = false; cfg.mentors = false; cfg.teacherFigs = 1; cfg.dawn = true; }
    return cfg;
  }

  /* ---------- fallback classroom ---------- */
  function fbRoom(c, cfg, t, dur) {
    var L = FB, a = C.amb(t, dur, 0), dawn = !!cfg.dawn, i, w;
    C.use(c); c.save();
    c.fillStyle = dawn ? '#d9ddd8' : P.wall; c.fillRect(0, 0, W, 545);
    c.fillStyle = dawn ? '#b98f66' : P.floor; c.fillRect(0, 545, W, H - 545);
    c.strokeStyle = 'rgba(60,35,15,.16)'; c.lineWidth = 3;
    for (i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0, 575 + i * 58); c.lineTo(W, 575 + i * 58); c.stroke(); }
    c.fillStyle = P.wood; c.fillRect(0, 530, W, 22);
    // window with Pune skyline
    w = L.window; C.rect(w.x - 14, w.y - 14, w.w + 28, w.h + 28, P.wood, 3);
    c.save(); c.beginPath(); c.rect(w.x, w.y, w.w, w.h); c.clip();
    var g = c.createLinearGradient(0, w.y, 0, w.y + w.h);
    if (dawn) { g.addColorStop(0, '#8fa6c8'); g.addColorStop(1, '#f1c3a0'); } else { g.addColorStop(0, '#a8d4e8'); g.addColorStop(1, P.sky); }
    c.fillStyle = g; c.fillRect(w.x, w.y, w.w, w.h);
    c.fillStyle = dawn ? '#f6d9b4' : '#fff1c4'; c.beginPath(); c.arc(w.x + 400 + a * 5, w.y + (dawn ? 250 : 110), 44, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(w.x + 160 + a * 14, w.y + 90, 70, 20, 0, 0, 6.283); c.fill();
    var r = C.rand(9), bx = w.x - 10;
    while (bx < w.x + w.w) {
      var bw = 40 + r() * 46, bh = 70 + r() * 150; c.fillStyle = dawn ? ['#51627d', '#465470', '#5c6b86'][(bx | 0) % 3] : ['#2f7f7a', '#1d5552', '#4a6d6a'][(bx | 0) % 3];
      c.fillRect(bx, w.y + w.h - bh, bw, bh);
      if (r() > 0.5) { c.fillStyle = dawn ? 'rgba(255,220,150,.8)' : 'rgba(255,240,200,.55)'; for (var wy = w.y + w.h - bh + 12; wy < w.y + w.h - 14; wy += 24) c.fillRect(bx + 8, wy, 8, 10); }
      bx += bw + 3;
    }
    c.restore();
    c.fillStyle = P.wood; c.fillRect(w.x + w.w / 2 - 5, w.y, 10, w.h); c.fillRect(w.x, w.y + w.h * 0.45, w.w, 9);
    // blackboard
    var b = L.board; C.rect(b.x - 12, b.y - 12, b.w + 24, b.h + 24, P.wood, 4); C.rect(b.x, b.y, b.w, b.h, P.board, 5, { halftone: 0.2, shadow: false });
    c.save(); c.globalAlpha = 0.8;
    C.label('PHYSICS · MOTION', b.x + 30, b.y + 40, 40, P.cream, 'left', 700); C.label('v = u + at', b.x + 30, b.y + 110, 46, P.cream, 'left', 500); C.label('F = m a', b.x + 30, b.y + 190, 46, P.cream, 'left', 500);
    c.strokeStyle = P.cream; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x + 30, b.y + 240); c.quadraticCurveTo(b.x + 160, b.y + 210 + a * 6, b.x + 280, b.y + 250); c.stroke();
    c.restore();
    if (cfg.ai) {
      var s = L.screen; C.rect(s.x, s.y, s.w, s.h, '#16302d', 6, { rough: 2 });
      for (var gy = 0; gy < 4; gy++) for (var gx = 0; gx < 6; gx++) {
        var v = Math.sin(gx * 1.7 + gy * 2.3 + a * 0.9); c.fillStyle = v > 0.4 ? P.green : v > -0.3 ? P.mustard : P.coral;
        c.globalAlpha = 0.75 + 0.2 * Math.sin(a * 2 + gx + gy); c.fillRect(s.x + 16 + gx * 42, s.y + 40 + gy * 45, 36, 38); c.globalAlpha = 1;
      }
      C.label('struggle map', s.x + 16, s.y + 20, 20, P.cream, 'left', 500);
    }
    // notice board
    var n = L.notice; C.rect(n.x - 10, n.y - 10, n.w + 20, n.h + 20, P.wood, 8); C.rect(n.x, n.y, n.w, n.h, '#c19460', 9, { shadow: false });
    [[1430, 170, 120, 90, P.paper, -3], [1580, 180, 110, 130, P.mustard, 4], [1720, 165, 100, 100, P.paper, -2], [1440, 300, 130, 110, P.coral, 3], [1600, 330, 150, 100, P.paper, -4], [1740, 320, 90, 120, P.teal, 2]].forEach(function (p, k) {
      c.save(); c.translate(p[0] + p[2] / 2, p[1] + p[3] / 2); c.rotate(p[5] * Math.PI / 180); C.rect(-p[2] / 2, -p[3] / 2, p[2], p[3], p[4], 20 + k, { rough: 2, lift: 2, blur: 3 });
      c.fillStyle = P.ink; c.globalAlpha = 0.5; for (var q = 0; q < 4; q++) c.fillRect(-p[2] / 2 + 12, -p[3] / 2 + 18 + q * 16, p[2] - 24 - (q % 2) * 20, 4); c.restore();
    });
    // people and desks, back row first
    var occ = Math.min(cfg.seated | 0, L.desks.length), mentorN = cfg.mentors ? Math.max(0, (cfg.teacherFigs | 0) - 1) : 0, lectN = cfg.mentors ? 0 : Math.max(0, Math.min(2, (cfg.teacherFigs | 0) - 1));
    C.figure(L.sunanda.x, L.sunanda.y, 260, 'point-at-board', C.SUNANDA, false, t);
    for (i = 0; i < lectN; i++) C.figure(1180 + i * 130, 590, 250, 'point-at-board', C.outfitFor(i + 2), false, t);
    for (var row = 0; row < 3; row++) {
      L.desks.forEach(function (d, di) {
        if (d.r !== row) return; var sc = d.s || 1;
        if (di < occ) C.figure(d.x, d.y, 150 * sc, 'sit', C.outfitFor(di), di % 2 === 1, t + di * 0.7);
        C.rect(d.x - 75 * sc, d.y - 26 * sc, 150 * sc, 20 * sc, '#b07a4c', 40 + di, { rough: 1.5, lift: 2, blur: 3, shadowAlpha: 0.2 });
        C.rect(d.x - 69 * sc, d.y - 6 * sc, 138 * sc, 44 * sc, P.wood, 70 + di, { rough: 2, shadow: false });
      });
      for (i = 0; i < mentorN; i++) if (i % 3 === row) {
        var md = L.desks[(i * 3 + 1) % L.desks.length], ms = md.s || 1;
        C.figure(md.x + 108 * ms * (i % 2 ? -1 : 1), md.y + 70 * ms, 230 * ms, 'lean-in-to-group', C.outfitFor(i + 4), i % 2 === 0, t);
      }
    }
    c.restore();
  }
  function drawRoom(c, cfg, t, dur) {
    if (hasSet()) { SET.draw(c, cfg, t, dur); C.use(c); } else fbRoom(c, cfg, t, dur);
  }

  /* ---------- tiny helpers ---------- */
  function labelW(c, text, size, weight) { c.save(); c.font = (weight || 700) + ' ' + size + 'px ' + C.FONTS.label; var w = c.measureText(String(text).toUpperCase()).width; c.restore(); return w; }
  function caption(c, text, p, y, seed) {
    if (p <= 0) return;
    c.save(); c.font = 'italic 54px ' + C.FONTS.serif; var w = c.measureText(text.replace(/\*/g, '')).width; c.restore();
    var size = Math.min(54, Math.floor(54 * 1640 / Math.max(w + 70, 1))); C.caption(text, [], p, y, { size: size, seed: seed });
  }
  function motes(c, t, n, alpha) {
    var r = C.rand(77);
    c.save();
    for (var i = 0; i < n; i++) {
      var x0 = r() * W, y0 = r() * H, rr = 2 + r() * 4; c.globalAlpha = alpha * (0.5 + 0.5 * r());
      c.fillStyle = i % 3 === 0 ? P.saffron : P.cream; c.beginPath(); c.arc(x0 + 34 * C.amb(t, END_DUR, i), y0 + 24 * C.amb(t, END_DUR, i * 1.7), rr, 0, 6.283); c.fill();
    }
    c.restore();
  }

  /* ---------- the plan for one ending ---------- */
  function plan(road) {
    var id = endId(road), L = LAY(), cfg = endCfg(road, id), d = L.desks, n = Math.min(cfg.seated | 0, d.length), occ = d.slice(0, n), emp = d.slice(n);
    var all = bbox(d), bo = bbox(occ), be = bbox(emp), grp = bbox(occ.slice(0, 3));
    var scr = L.screen, nt = L.notice, sun = L.sunanda;
    var P1, P2, P3, ring, ring2;
    function boxRing(b, padx, pady) { return { x: b.cx, y: b.cy - 30, rx: Math.min(560, (b.x1 - b.x0) / 2 + padx), ry: Math.min(230, (b.y1 - b.y0) / 2 + pady) }; }
    if (id === 'trusted') {
      P1 = { x: scr.x + scr.w / 2 - 60, y: 470, z: 1.3 }; ring = { x: scr.x + scr.w / 2, y: scr.y + scr.h / 2, rx: scr.w / 2 + 34, ry: scr.h / 2 + 30 };
      P2 = { x: grp.cx + 40, y: grp.cy + 50, z: 2.0 }; P3 = { x: nt.x + nt.w / 2, y: nt.y + nt.h / 2 + 40, z: 1.5 }; ring2 = { x: nt.x + nt.w / 2, y: nt.y + nt.h / 2, rx: nt.w / 2 + 20, ry: nt.h / 2 + 20 };
    } else if (id === 'lean') {
      P1 = { x: scr.x + scr.w / 2 - 60, y: scr.y + scr.h / 2 + 150, z: 1.45 }; ring = { x: scr.x + scr.w / 2, y: scr.y + scr.h / 2, rx: scr.w / 2 + 34, ry: scr.h / 2 + 30 };
      P2 = { x: all.cx, y: all.cy - 50, z: 1.55 }; P3 = { x: nt.x + nt.w / 2, y: nt.y + nt.h / 2 + 40, z: 1.5 }; ring2 = { x: nt.x + nt.w / 2, y: nt.y + nt.h / 2, rx: nt.w / 2 + 20, ry: nt.h / 2 + 20 };
    } else if (id === 'smaller') {
      var bb = bo || all; P1 = { x: bb.cx, y: bb.cy - 60, z: 1.3 }; ring = boxRing(bb, 140, 120);
      P2 = { x: (grp || bb).cx + 40, y: (grp || bb).cy - 30, z: 2.0 };
      var be2 = be || all; P3 = { x: be2.cx, y: be2.cy - 40, z: 1.4 }; ring2 = boxRing(be2, 130, 110);
    } else {
      var b3 = bo || all; P1 = { x: b3.cx, y: b3.cy - 90, z: 1.4 }; ring = { x: b3.cx, y: b3.cy - 60, rx: (b3.x1 - b3.x0) / 2 + 110, ry: 120 };
      var be3 = be || all; P2 = { x: be3.cx, y: be3.cy - 40, z: 1.4 };
      P3 = { x: sun.x + 100, y: sun.y - 130, z: 1.7 }; ring2 = { x: sun.x, y: sun.y - 120, rx: 120, ry: 170 };
    }
    var c1 = clampCam(P1.x, P1.y, P1.z), c2 = clampCam(P2.x, P2.y, P2.z), c3 = clampCam(P3.x, P3.y, P3.z);
    var keys = [
      { t: 0, x: 960, y: 540, z: 1.8 }, { t: 0.9, x: 960, y: 540, z: 1.0, ease: 'out' }, { t: 2.4, x: 985, y: 530, z: 1.05, ease: 'linear' },
      { t: 3.4, x: c1.x, y: c1.y, z: c1.z, ease: 'inout' }, { t: 5.0, x: c1.x + 18, y: c1.y - 6, z: c1.z * 1.03, ease: 'linear' },
      { t: 5.0, x: c2.x, y: c2.y, z: c2.z }, { t: 7.4, x: c2.x + 26, y: c2.y - 8, z: c2.z * 1.06, ease: 'linear' },
      { t: 8.5, x: 960, y: 540, z: 1.0, ease: 'inout' }, { t: 9.8, x: 940, y: 548, z: 1.04, ease: 'linear' },
      { t: 10.9, x: c3.x, y: c3.y, z: c3.z, ease: 'inout' }, { t: 12, x: c3.x - 14, y: c3.y - 6, z: c3.z * 1.02, ease: 'linear' }];
    function cap(r, z) { return { x: r.x, y: r.y, rx: Math.min(r.rx, 340 / z), ry: Math.min(r.ry, 230 / z) }; }
    return { id: id, cfg: cfg, keys: keys, ring: cap(ring, c1.z), ring2: cap(ring2, c3.z), c1: keys[3], c3: c3 };
  }

  // callout beside a ring (side with room), arrow to the ring edge; cam = {x,y,z} the camera it sits in; minSY keeps clear of the stamp
  function place(c, text, ring, cam, p, rot, bg, minSY) {
    var z = cam.z, size = 34 / z + 8, wW = labelW(c, text, size, 700) + 40, half = wW * z / 2;
    var rsx = 960 + (ring.x - cam.x) * z, rsy = 540 + (ring.y - cam.y) * z, left = rsx > 1150;
    var sx = left ? rsx - ring.rx * z - 60 - half : rsx + ring.rx * z + 60 + half, sy = rsy - ring.ry * z * 0.45;
    sx = C.clamp(sx, half + 24, 1896 - half); sy = C.clamp(sy, minSY, 760);
    var cx = cam.x + (sx - 960) / z, cy = cam.y + (sy - 540) / z;
    var tx = ring.x + (left ? -1 : 1) * ring.rx * 0.97, ty = ring.y - ring.ry * 0.12;
    C.callout(text, cx, cy, tx, ty, p, { size: size, rot: rot, bg: bg });
  }

  /* ---------- end clips ---------- */
  function drawEnd(c, t, road) {
    C.use(c);
    var j = CLIPS['c2-' + road.id];
    if (t < 0.05 && j && j.draw) { j.draw(c, 15, road); C.use(c); return; }
    var K = plan(road), info = road.endingInfo, id = K.id, tone = TONE[id], dawn = tone === 'hard';
    var cam = C.track(t, K.keys);
    c.fillStyle = P.cream; c.fillRect(0, 0, W, H);
    C.withCam(cam, function () {
      if (PREFER_OWN_END) fbRoom(c, K.cfg, t, END_DUR); else drawRoom(c, K.cfg, t, END_DUR); C.use(c);
      c.fillStyle = dawn ? 'rgba(70,100,150,0.16)' : 'rgba(255,190,100,0.07)'; c.fillRect(-1000, -1000, 4000, 3200);
      if (t < 5.0) {
        var rp = C.prog(t, 2.5, 3.3); C.ring(K.ring.x, K.ring.y, K.ring.rx, K.ring.ry, rp, P.saffron, 8);
        place(c, info.callouts[0], K.ring, K.c1, C.prog(t, 2.9, 3.6), -2, null, 130);
      }
      if (t >= 9.8) {
        C.ring(K.ring2.x, K.ring2.y, K.ring2.rx, K.ring2.ry, C.prog(t, 10.0, 10.8), P.saffron, 8);
        place(c, info.callouts[1], K.ring2, K.c3, C.prog(t, 10.3, 11.0), 2, P.saffron, 340);
      }
    });
    motes(c, t, 14, dawn ? 0.28 : 0.4);
    // year title card + label strip (0.25 - 3.0)
    if (t > 0.2 && t < 3.1) {
      var f = C.back(C.prog(t, 0.25, 0.7)), ex = C.ease(C.prog(t, 2.4, 3.0)), ty = -ex * 460;
      c.save(); c.translate(960, 235 + ty); c.rotate(-2 * Math.PI / 180); c.scale(f, f);
      C.paper(C.torn(-250, -130, 500, 260, 21, 5), P.paper, { halftone: 0.3, lift: 10 });
      c.font = '800 230px ' + C.FONTS.label; c.fillStyle = P.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('2036', 0, 12);
      c.fillStyle = P.saffron; c.fillRect(-170, 108, 340, 8);
      c.restore();
      var lw = labelW(c, info.label, 46, 800) + 90, f2 = C.back(C.prog(t, 0.45, 0.9));
      c.save(); c.translate(960, 425 + ty); c.rotate(1.5 * Math.PI / 180); c.scale(f2, f2);
      C.paper(C.torn(-lw / 2, -38, lw, 76, 22, 4), TAGCOL[id], { lift: 8 });
      C.label(info.label, 0, 3, 46, id === 'smaller' ? P.ink : '#fff', 'center', 800); c.restore();
    }
    // small label tag, top right
    if (t > 2.7) {
      var tw = labelW(c, '2036 · ' + info.label, 30, 800) + 56, inn = C.ease(C.prog(t, 2.7, 3.3));
      c.save(); c.translate(1880 - tw / 2 + (1 - inn) * 600, 62); c.rotate(-1 * Math.PI / 180);
      C.paper(C.torn(-tw / 2, -28, tw, 56, 23, 3), TAGCOL[id], { lift: 5 });
      C.label('2036 · ' + info.label, 0, 2, 30, id === 'smaller' ? P.ink : '#fff', 'center', 800); c.restore();
    }
    // captions
    if (t >= 0.9 && t < 4.95) caption(c, info.glimpse[0], C.prog(t, 0.95, 2.4), 850, 11);
    if (t >= 5.0 && t < 7.35) caption(c, info.glimpse[1], C.prog(t, 5.15, 6.8), 850, 12);
    if (t >= 9.8) caption(c, info.line, C.prog(t, 9.95, 11.4), 850, 13);
    // stamp with counting numbers
    if (t >= 7.4) {
      var m = /([\d,]+)\s*STUDENTS[^\d]*(\d+)\s*OF\s*10/i.exec(road.stamp || ''), n = m ? parseInt(m[1].replace(/,/g, ''), 10) : road.counters[2036].students, fut = m ? +m[2] : (road.endings[id] || 0);
      var txt = '≈ ' + Math.round(n * C.easeOut(C.prog(t, 7.4, 8.2))).toLocaleString('en-IN') + ' STUDENTS';
      if (t >= 8.2) txt += ' · ' + Math.round(fut * C.easeOut(C.prog(t, 8.2, 8.7))) + ' OF 10 FUTURES';
      C.stamp(txt, 960, 215, C.prog(t, 7.4, 8.0), { color: STAMPCOL[id], size: 60, rot: -3 });
    }
    // flash
    var fa = t < 0.05 ? 0 : t < 0.12 ? C.prog(t, 0.05, 0.12) : Math.pow(1 - C.prog(t, 0.12, 0.9), 1.5);
    C.flash(fa);
  }
  Kal_roads().forEach(function (r) { CLIPS['end-' + r] = { dur: END_DUR, draw: drawEnd }; });
  function Kal_roads() { return ['build-retrain', 'build-cut', 'ban-retrain', 'ban-cut']; }

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
    startState: function (id, road) {
      if (id === 'rewind') return root.ENDINGS.endState('end-' + road.id, road);
      return { cam: { x: 960, y: 540, z: 1 }, year: 2030, shot: 'REST', cards: [road.c1, road.c2] };
    },
    endState: function (id, road) {
      if (id === 'rewind') return { cam: { x: 960, y: 540, z: 1 }, year: 2026, shot: 'REST', cards: [] };
      var K = plan(road), k = K.keys[K.keys.length - 1]; return { cam: { x: k.x, y: k.y, z: k.z }, year: 2036, shot: 'END', cards: [] };
    }
  };
})(typeof window !== 'undefined' ? window : this);
var ENDINGS = window.ENDINGS;
