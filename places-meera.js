/* places-meera.js — PLACES.staffroom (2027) and PLACES.meera32 (2032): the two places built around the teacher Meera.
   See docs/story-bible.md (H3). Every scene is a pure function of (t, road): no Math.random, no Date, no state between frames.
   Characters come only from cast.js (CAST.draw); everything else is a paper-collage set built here from torn sheets,
   halftone dots and soft paper shadows. Camera = C.track + C.withCam; two keys at one t = a hard cut. */
(function (root) {
  'use strict';
  var P = C.PALETTE, TAU = Math.PI * 2, PI = Math.PI, CL = C.clamp;
  var PLACES = root.PLACES = root.PLACES || {};
  var ARM = CAST.ARMS;

  /* ================= small helpers ================= */
  function lerp(a, b, f) { return a + (b - a) * f; }
  function sm(t, a, b) { return C.ease(C.prog(t, a, b)); }       // eased 0..1 between a and b
  function ln(t, a, b) { return C.prog(t, a, b); }                // linear 0..1
  function lnT(t, a, b) { return C.prog(C.T12(t), a, b); }        // the same on twos (12 fps) for collage pieces
  function hx(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mixc(a, b, f) { var A = hx(a), B = hx(b); return 'rgb(' + Math.round(lerp(A[0], B[0], f)) + ',' + Math.round(lerp(A[1], B[1], f)) + ',' + Math.round(lerp(A[2], B[2], f)) + ')'; }
  function fade(t, a, b, fi, fo) { return CL((t - a) / (fi || 0.4)) * CL((b - t) / (fo || 0.5)); }
  // narration caption: verbatim text, *word* highlighted, one at a time (same fade as scenes.js cap())
  function cap(c, text, t, a, b, y) {
    if (t < a || t > b) return;
    c.save(); c.globalAlpha *= fade(t, a, b, 0.05, 0.45);
    C.caption(text, [], C.prog(t, a, a + Math.max(1, (b - a) * 0.55)), y || 880);
    c.restore();
  }
  function arms(base, extra) { return Object.assign({}, base, extra || {}); }
  function ar(s, e) { return [s, e]; }
  function osc(t, f, ph) { return Math.sin(t * TAU * f + (ph || 0)); }
  // piecewise linear/eased value through [t, v] keys (eased between keys)
  function key(t, ks) {
    if (t <= ks[0][0]) return ks[0][1];
    for (var i = 0; i < ks.length - 1; i++) { var a = ks[i], b = ks[i + 1]; if (t < b[0]) return lerp(a[1], b[1], C.ease((t - a[0]) / (b[0] - a[0]))); }
    return ks[ks.length - 1][1];
  }
  // hold-then-snap choice: value of the last key whose time is <= t
  function step(t, ks) { var v = ks[0][1]; for (var i = 0; i < ks.length; i++) if (t >= ks[i][0]) v = ks[i][1]; return v; }

  /* ================= paper kit ================= */
  var PAT = {};
  function dotPat(c, col, r) {
    var k = col + '|' + r; if (PAT[k] !== undefined) return PAT[k];
    var pat = null;
    if (typeof document !== 'undefined') {
      var cv = document.createElement('canvas'); cv.width = cv.height = 16; var g = cv.getContext('2d'); g.fillStyle = col;
      g.beginPath(); g.arc(4, 4, r, 0, TAU); g.fill(); g.beginPath(); g.arc(12, 12, r, 0, TAU); g.fill();
      pat = c.createPattern(cv, 'repeat');
    }
    PAT[k] = pat; return pat;
  }
  function dots(x, y, w, h, col, r) { var c = C.ctx, p = dotPat(c, col, r || 1.5); if (!p) return; c.save(); c.fillStyle = p; c.fillRect(x, y, w, h); c.restore(); }
  function vgrad(x, y, w, h, c0, c1) { var c = C.ctx, g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c0); g.addColorStop(1, c1); c.save(); c.fillStyle = g; c.fillRect(x, y, w, h); c.restore(); }
  // a torn paper polygon: soft shadow, pale torn-fibre edge, fill, optional dots and vertical gradient
  function shape(pts, fill, o) {
    o = o || {}; var c = C.ctx, minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    pts.forEach(function (p) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
    c.save(); C.path(pts);
    if (o.shadow !== false) { c.shadowColor = 'rgba(40,25,10,' + (o.sa || 0.24) + ')'; c.shadowBlur = o.blur || 12; c.shadowOffsetX = o.dx == null ? 2 : o.dx; c.shadowOffsetY = o.lift == null ? 5 : o.lift; }
    if (o.edge !== false) { c.lineJoin = 'round'; c.lineWidth = o.edgeW || 6.5; c.strokeStyle = o.edgeCol || '#fffdf7'; c.stroke(); c.shadowColor = 'transparent'; }
    c.fillStyle = fill; c.fill(); c.restore();
    if (o.dots || o.vg) {
      c.save(); C.path(pts); c.clip();
      if (o.dots) dots(minx - 4, miny - 4, maxx - minx + 8, maxy - miny + 8, o.dotCol || 'rgba(31,27,24,0.10)', o.dotR || 1.5);
      if (o.vg) vgrad(minx - 4, miny - 4, maxx - minx + 8, maxy - miny + 8, o.vg[0], o.vg[1]);
      c.restore();
    }
    return pts;
  }
  function sheet(x, y, w, h, fill, seed, o) { return shape(C.torn(x, y, w, h, seed || 3, (o && o.rough != null) ? o.rough : 2.5), fill, o); }
  function rrect(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  function txt(s, x, y, size, col, o) {
    o = o || {}; var c = C.ctx; c.save(); c.font = (o.italic ? 'italic ' : '') + (o.weight || 700) + ' ' + size + 'px ' + (o.font || C.FONTS.label);
    c.fillStyle = col || P.ink; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'middle';
    var str = o.up === false ? s : String(s).toUpperCase();
    if (o.maxW) { var wd = c.measureText(str).width; if (wd > o.maxW) c.font = c.font.replace(/(\d+(?:\.\d+)?)px/, function (m, n) { return (n * o.maxW / wd).toFixed(1) + 'px'; }); }
    if (o.rot) { c.translate(x, y); c.rotate(o.rot); x = 0; y = 0; }
    c.fillText(str, x, y); c.restore();
  }
  function hand(s, x, y, size, col, o) { o = o || {}; o.font = C.FONTS.serif; o.italic = true; o.weight = 400; o.up = false; txt(s, x, y, size, col, o); }
  // reveal what fn() draws from the left, p 0..1 (marker writing)
  function wipe(x, y, w, h, p, fn) { if (p <= 0) return; var c = C.ctx; c.save(); c.beginPath(); c.rect(x, y, w * CL(p), h); c.clip(); fn(); c.restore(); }
  function glow(x, y, r, col, a) { var c = C.ctx, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.save(); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }

  /* ================= beat grid, layers, panels ================= */
  var BT = C.BEAT;
  function B(n) { return n * BT; }
  // camera for a shot list, with the moving hold and the beat bump; a stamp shake is optional
  function camOf(t, keys, shakeAt) { var cm = C.bump(C.drift(C.track(t, keys), t), t); return shakeAt != null ? C.shake(cm, t, shakeAt) : cm; }
  // parallax: a layer with depth k moves less (k < 1, far) or more (k > 1, near) under the camera than the action layer
  function lay(cam, k, fn) { C.withCam({ x: 960 + (cam.x - 960) * k, y: 540 + (cam.y - 540) * k, z: 1 + (cam.z - 1) * k }, fn); }
  function w2s(cam, x, y) { return { x: (x - cam.x) * cam.z + 960, y: (y - cam.y) * cam.z + 540 }; }
  function rimPoly(poly, w) { var c = C.ctx; c.save(); C.path(poly); c.lineJoin = 'round'; c.lineWidth = w; c.strokeStyle = '#fffdf7'; c.shadowColor = 'rgba(26,16,8,0.34)'; c.shadowBlur = 18; c.shadowOffsetX = 7; c.shadowOffsetY = 11; c.stroke(); c.restore(); }
  // a big torn sheet with a white rim, halftone and grain (wall, floor)
  function panel(x, y, w, h, fill, seed, o) {
    o = o || {}; var poly = C.tornRect2(x, y, w, h, seed, o.rough == null ? 6 : o.rough, o.sides);
    rimPoly(poly, o.rim || 12); C.paperPiece(poly, fill, { shadow: false, dots: o.dots, dotA: o.dotA, grain: o.grain == null ? 0.22 : o.grain, sp: o.sp, r: o.r });
    if (o.vg) { var c = C.ctx; c.save(); C.path(poly); c.clip(); vgrad(x - 10, y - 10, w + 20, h + 20, o.vg[0], o.vg[1]); c.restore(); }
    return poly;
  }
  // a burst of confetti thrown out of (x, y) at time tp
  function burst(x, y, t, tp, col, n, spread) {
    t = C.T12(t); var u = t - tp; if (u < 0 || u > 1.3) return; var c = C.ctx, r = C.rand(77 + Math.round(tp * 100)), cols = col;
    for (var i = 0; i < (n || 22); i++) {
      var a = -PI / 2 + (r() - 0.5) * (spread || 2.6), v = 380 + r() * 520, px = x + Math.cos(a) * v * u, py = y + Math.sin(a) * v * u + 520 * u * u, k = 10 + r() * 14;
      c.save(); c.globalAlpha *= CL(1.2 - u) ; c.translate(px, py); c.rotate(u * (3 + r() * 6) + r() * 6); c.fillStyle = cols[i % cols.length];
      if (i % 3 === 0) { c.beginPath(); c.arc(0, 0, k * 0.5, 0, TAU); c.fill(); } else c.fillRect(-k * 0.5, -k * 0.16, k, k * 0.32);
      c.restore();
    }
  }
  // night photo of Pune inside a window (falls back to nothing when the photo has not loaded)
  function windowPhoto(x, y, w, h, a) {
    var im = C.IMG ? C.IMG('pune-night') : null; if (!im || a <= 0) return;
    var c = C.ctx; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.globalAlpha *= a; c.filter = 'saturate(1.1) brightness(0.95)';
    var ir = im.naturalWidth / im.naturalHeight, cw = ir > w / h ? h * ir : w, ch = ir > w / h ? h : w / ir; c.drawImage(im, x - (cw - w) * 0.5, y - (ch - h) * 0.55, cw, ch); c.filter = 'none'; c.restore();
  }

  /* ================= small props ================= */
  // steam wisps rising from (x, y)
  function steam(x, y, t, h, ph, a) {
    var c = C.ctx; c.save(); c.lineCap = 'round'; c.lineWidth = 3.6;
    for (var i = 0; i < 3; i++) {
      var u = ((t * 0.55 + i / 3 + (ph || 0)) % 1), yy = y - u * h, al = (a == null ? 0.55 : a) * Math.sin(Math.PI * u);
      c.strokeStyle = 'rgba(255,255,255,' + al + ')'; c.beginPath();
      for (var k = 0; k <= 8; k++) { var f = k / 8, px = x + (i - 1) * 8 + Math.sin(f * 5 + t * 2.2 + i * 2) * (4 + f * 5), py = yy - f * h * 0.38; if (k === 0) c.moveTo(px, py); else c.lineTo(px, py); }
      c.stroke();
    }
    c.restore();
  }
  // cutting-chai glass on a small steel saucer; (x, y) = bottom centre, k = scale
  function chai(x, y, k, t, ph, hot) {
    var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = 'rgba(40,25,10,0.18)'; c.beginPath(); c.ellipse(2, 2, 24, 5, 0, 0, TAU); c.fill();
    c.fillStyle = '#b9c0bf'; c.beginPath(); c.ellipse(0, 0, 22, 5, 0, 0, TAU); c.fill(); c.fillStyle = '#dde3e1'; c.beginPath(); c.ellipse(0, -1.4, 19, 3.6, 0, 0, TAU); c.fill();
    c.shadowColor = 'rgba(40,25,10,0.25)'; c.shadowBlur = 5; c.shadowOffsetY = 2;
    c.fillStyle = 'rgba(232,242,240,0.85)'; c.beginPath(); c.moveTo(-11, -44); c.lineTo(11, -44); c.lineTo(8.5, -2); c.lineTo(-8.5, -2); c.closePath(); c.fill(); c.shadowColor = 'transparent';
    var lv = 0.78;
    c.fillStyle = '#b9772f'; c.beginPath(); c.moveTo(-10.4, -44 * lv - 2); c.lineTo(10.4, -44 * lv - 2); c.lineTo(8.2, -3); c.lineTo(-8.2, -3); c.closePath(); c.fill();
    c.fillStyle = '#e2b574'; c.beginPath(); c.ellipse(0, -44 * lv - 2, 10.4, 2.2, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(-8, -40, 2.4, 30);
    c.restore();
    if (hot !== false) steam(x, y - 44 * k * 0.8, t, 70 * k, ph || 0, 0.5);
  }
  // a sheet of paper lying or standing; fine lines for text
  function letterSheet(x, y, w, h, rot, o) {
    o = o || {}; var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot || 0);
    sheet(-w / 2, -h / 2, w, h, '#fffdf6', o.seed || 31, { lift: 4, blur: 8, rough: 1.2, edge: false, sa: 0.3 });
    c.fillStyle = '#2f7f7a'; c.fillRect(-w / 2 + w * 0.08, -h / 2 + h * 0.07, w * 0.36, h * 0.045);
    c.fillStyle = '#c9ccc4'; c.fillRect(-w / 2 + w * 0.08, -h / 2 + h * 0.15, w * 0.5, h * 0.022);
    for (var i = 0; i < (o.lines || 7); i++) { c.fillStyle = 'rgba(60,55,50,0.55)'; c.fillRect(-w / 2 + w * 0.08, -h / 2 + h * (0.26 + i * 0.075), w * (i === (o.lines || 7) - 1 ? 0.4 : 0.84), h * 0.016); }
    c.restore();
  }
  function stackPapers(x, y, w, n, seed, col) {
    for (var i = 0; i < n; i++) sheet(x - w / 2 + (i % 2) * 4 - 3, y - 7 * (i + 1), w, 8, i % 3 === 0 ? '#f3eddc' : (col && i === n - 1 ? col : '#faf6ea'), seed + i, { rough: 1, lift: 2, blur: 4, sa: 0.22, edge: false });
  }
  function book(x, y, w, h, col, seed, lab) {
    var c = C.ctx; sheet(x, y, w, h, col, seed, { rough: 1, lift: 3, blur: 6, edge: false });
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 3, y + 3, 4, h - 6);
    if (lab) txt(lab, x + w / 2 + 2, y + h / 2, Math.min(h * 0.4, 18), 'rgba(255,255,255,0.85)', { align: 'center' });
  }
  // conical flask (a chemistry teacher's beaker)
  function flask(x, y, k, liquid) {
    var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = 'rgba(190,230,235,0.78)'; c.beginPath(); c.moveTo(-5, -34); c.lineTo(5, -34); c.lineTo(5, -22); c.lineTo(19, 0); c.lineTo(-19, 0); c.lineTo(-5, -22); c.closePath(); c.fill();
    c.fillStyle = liquid || 'rgba(79,175,160,0.9)'; c.beginPath(); c.moveTo(-9, -12); c.lineTo(9, -12); c.lineTo(17, -1); c.lineTo(-17, -1); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-3.5, -32); c.lineTo(-3.5, -21); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(-6, -36, 12, 3);
    c.restore();
  }
  function pencil(x, y, ang, len) {
    var c = C.ctx; c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = '#e0a93a'; c.fillRect(0, -3.5, len, 7); c.fillStyle = '#d9d2c2'; c.fillRect(-6, -3.5, 6, 7);
    c.fillStyle = '#f0cf9a'; c.beginPath(); c.moveTo(len, -3.5); c.lineTo(len + 14, 0); c.lineTo(len, 3.5); c.closePath(); c.fill(); c.fillStyle = '#3a3330'; c.beginPath(); c.moveTo(len + 10, -1.2); c.lineTo(len + 14, 0); c.lineTo(len + 10, 1.2); c.closePath(); c.fill();
    c.fillStyle = '#c0504a'; c.fillRect(-12, -3.5, 6, 7); c.restore();
  }

  /* ================= room fittings ================= */
  function tube(x, y, w, t, i, tintA) {
    var c = C.ctx, fl = 1 - 0.05 * Math.max(0, Math.sin(t * 29 + i * 7)) * (Math.sin(t * 2.1 + i * 3) > 0.55 ? 1 : 0.15);
    c.save(); var g = c.createLinearGradient(0, y, 0, y + 620); g.addColorStop(0, 'rgba(255,255,236,' + (0.2 * fl * (tintA == null ? 1 : tintA)) + ')'); g.addColorStop(1, 'rgba(255,255,236,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2, y + 8); c.lineTo(x + w / 2, y + 8); c.lineTo(x + w * 0.95, y + 620); c.lineTo(x - w * 0.95, y + 620); c.closePath(); c.fill(); c.restore();
    sheet(x - w / 2 - 10, y - 14, w + 20, 24, '#cfd6cd', 70 + i, { rough: 1.4, lift: 4, blur: 8, sa: 0.22 });
    c.save(); c.shadowColor = 'rgba(255,255,226,0.95)'; c.shadowBlur = 26 * (tintA == null ? 1 : tintA + 0.2); c.fillStyle = mixc('#8f9a8d', '#fffff0', tintA == null ? 1 : tintA); c.fillRect(x - w / 2, y + 5, w, 9); c.restore();
  }
  function fan(x, y, R, t, spd) {
    var c = C.ctx; c.save();
    c.fillStyle = '#6e7b76'; c.fillRect(x - 3, y - 180, 6, 180);
    var ang = [0, 1, 2].map(function (i) { return t * spd + i * TAU / 3; });
    c.fillStyle = 'rgba(214,220,210,0.16)'; c.beginPath(); c.ellipse(x, y + 16, R * 0.96, 9, 0, 0, TAU); c.fill();
    ang.map(function (a) { return { a: a, z: Math.sin(a) }; }).sort(function (p, q) { return p.z - q.z; }).forEach(function (b) {
      var cx = Math.cos(b.a), bx = x + cx * R, by = y + 16 + b.z * 6; c.strokeStyle = b.z > 0 ? '#d3d8cf' : '#a9b2a8'; c.lineCap = 'round'; c.lineWidth = 11 * (0.6 + 0.4 * Math.abs(cx));
      c.beginPath(); c.moveTo(x, y + 16); c.lineTo(bx, by); c.stroke();
    });
    sheet(x - 26, y - 6, 52, 26, '#5f6c67', 61, { rough: 1, lift: 3, blur: 6, edge: false }); c.fillStyle = '#7d8a85'; c.beginPath(); c.ellipse(x, y + 20, 18, 6, 0, 0, TAU); c.fill();
    c.restore();
  }
  function clockFace(x, y, r, hh, mm, t, ss) {
    var c = C.ctx; c.save(); c.translate(x, y);
    c.shadowColor = 'rgba(40,25,10,0.32)'; c.shadowBlur = 12; c.shadowOffsetY = 5; c.fillStyle = '#2b2f2e'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.shadowColor = 'transparent';
    c.fillStyle = '#f6f1e3'; c.beginPath(); c.arc(0, 0, r - 7, 0, TAU); c.fill();
    c.strokeStyle = '#2b2f2e'; c.lineWidth = 2.4;
    for (var i = 0; i < 12; i++) { var a = i * TAU / 12; c.lineWidth = i % 3 === 0 ? 3.4 : 1.8; c.beginPath(); c.moveTo(Math.cos(a) * (r - 13), Math.sin(a) * (r - 13)); c.lineTo(Math.cos(a) * (r - (i % 3 === 0 ? 24 : 19)), Math.sin(a) * (r - (i % 3 === 0 ? 24 : 19))); c.stroke(); }
    var ha = ((hh % 12) + mm / 60) / 12 * TAU - PI / 2, ma = mm / 60 * TAU - PI / 2;
    c.lineCap = 'round'; c.strokeStyle = '#2b2f2e'; c.lineWidth = 5.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ha) * r * 0.5, Math.sin(ha) * r * 0.5); c.stroke();
    c.lineWidth = 3.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ma) * r * 0.74, Math.sin(ma) * r * 0.74); c.stroke();
    if (ss) { var sa = (t * 6) * PI / 180 * 6 / 6 - PI / 2; sa = Math.floor(t) * TAU / 60 - PI / 2; c.strokeStyle = '#c2412d'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-Math.cos(sa) * 10, -Math.sin(sa) * 10); c.lineTo(Math.cos(sa) * r * 0.8, Math.sin(sa) * r * 0.8); c.stroke(); }
    c.fillStyle = '#2b2f2e'; c.beginPath(); c.arc(0, 0, 4.4, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.4, r * 0.3, r * 0.14, -0.6, 0, TAU); c.fill();
    c.restore();
  }
  // a window onto Pune: hills, apartment blocks, a coconut palm, black water tanks, a crow. sky = [top, horizon]; sun 0..1 (0 none)
  function windowView(x, y, w, h, t, sky, o) {
    o = o || {}; var c = C.ctx; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(x, y, w, h);
    if (o.sun) { var sx = x + w * (o.sunX || 0.72), sy = y + h * (o.sunY || 0.6); glow(sx, sy, w * 0.7, 'rgba(255,236,170,A)', 0.8 * o.sun); c.fillStyle = 'rgba(255,248,214,' + o.sun + ')'; c.beginPath(); c.arc(sx, sy, 22, 0, TAU); c.fill(); }
    if (o.stars) { for (var s = 0; s < 12; s++) { var r = C.rand(40 + s); c.fillStyle = 'rgba(255,255,255,' + (0.5 * o.stars) + ')'; c.fillRect(x + r() * w, y + r() * h * 0.5, 2.4, 2.4); } }
    var far = o.far || '#9fb3ad', mid = o.mid || '#7f968f', near = o.near || '#5f7770', win = o.win || 'rgba(255,240,190,0.5)';
    c.fillStyle = far; c.beginPath(); c.moveTo(x, y + h); for (var i = 0; i <= 16; i++) c.lineTo(x + i * w / 16, y + h * 0.66 - 22 * Math.sin(i * 0.9 + 1) - 12 * Math.sin(i * 2.3)); c.lineTo(x + w, y + h); c.fill();
    [[0.04, 0.18, 0.5], [0.24, 0.16, 0.38], [0.56, 0.2, 0.55], [0.8, 0.17, 0.42]].forEach(function (b, i) {
      var bx = x + w * b[0], bw = w * b[1], bh = h * b[2], by = y + h - bh; c.fillStyle = i % 2 ? mid : near; c.fillRect(bx, by, bw, bh);
      c.fillStyle = win; for (var wy = by + 10; wy < y + h - 14; wy += 18) for (var wx = bx + 7; wx < bx + bw - 8; wx += 14) c.fillRect(wx, wy, 5, 8);
      if (i === 1) { c.fillStyle = '#2c3433'; c.fillRect(bx + 6, by - 16, 22, 16); c.fillRect(bx + bw - 24, by - 14, 18, 14); }
    });
    // coconut palm
    c.strokeStyle = near; c.lineWidth = 6; c.lineCap = 'round'; var px = x + w * 0.46, py = y + h;
    c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + 6, py - h * 0.3, px - 4, py - h * 0.52); c.stroke();
    var sw = osc(t, 0.25, 1) * 3;
    for (var f = 0; f < 6; f++) { var fa = -PI / 2 + (f - 2.5) * 0.5; c.lineWidth = 3.2; c.beginPath(); c.moveTo(px - 4, py - h * 0.52); c.quadraticCurveTo(px - 4 + Math.cos(fa) * 26, py - h * 0.52 + Math.sin(fa) * 24 - 8 + sw, px - 4 + Math.cos(fa) * 46, py - h * 0.52 + Math.sin(fa) * 38 + 14 + sw); c.stroke(); }
    // crow crossing
    if (o.crow !== false) { var u = ((t * 0.12 + (o.crowPh || 0)) % 1), bx = x - 30 + u * (w + 60), by = y + h * 0.28 + Math.sin(u * 9) * 8, fl = Math.sin(t * 14) * 5; c.strokeStyle = '#2a2523'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(bx - 10, by - fl); c.quadraticCurveTo(bx - 4, by - 5, bx, by); c.quadraticCurveTo(bx + 4, by - 5, bx + 10, by - fl); c.stroke(); }
    c.restore();
  }
  function grill(x, y, w, h, col) {
    var c = C.ctx; c.save(); c.strokeStyle = col || '#4a5753'; c.lineWidth = 5; c.lineCap = 'round';
    for (var gx = x + w / 6; gx < x + w - 4; gx += w / 6) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, y + h); c.stroke(); }
    c.lineWidth = 4; [0.34, 0.68].forEach(function (f) { c.beginPath(); c.moveTo(x, y + h * f); c.lineTo(x + w, y + h * f); c.stroke(); });
    c.restore();
  }
  // tall steel almirah (two doors, louvre panel, lock bar) with files on top
  function almirah(x, y, w, h, seed, tag, tint) {
    var c = C.ctx, body = tint || '#8e9fa9';
    // files and registers stacked on top
    var r = C.rand(seed), fx = x + 8;
    while (fx < x + w - 40) { var bw = 26 + r() * 40, bh = 30 + r() * 46, cols = ['#d9c9a0', '#a45a44', '#6d8f8a', '#e8e0cf', '#4d6377']; sheet(fx, y - bh - 4, bw, bh, cols[Math.floor(r() * cols.length)], seed + fx, { rough: 1.2, lift: 3, blur: 6, edge: false, sa: 0.22 }); fx += bw + 4; }
    sheet(x, y, w, h, body, seed, { rough: 1.6, lift: 6, blur: 14, vg: ['rgba(255,255,255,0.10)', 'rgba(20,30,30,0.18)'] });
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x + 8, y + 8, 7, h - 16);
    c.fillStyle = 'rgba(30,40,40,0.35)'; c.fillRect(x + w / 2 - 2, y + 6, 4, h - 12);
    [0, 1].forEach(function (d) {
      var dx = x + 18 + d * (w / 2), dw = w / 2 - 34;
      sheet(dx, y + 22, dw, h * 0.42, '#9db0ba', seed + 5 + d, { rough: 0.8, lift: 1.5, blur: 3, edge: false, sa: 0.18 });
      c.fillStyle = 'rgba(40,55,60,0.28)'; for (var ly = y + 34; ly < y + 22 + h * 0.42 - 8; ly += 9) c.fillRect(dx + 8, ly, dw - 16, 3);
      sheet(dx, y + 36 + h * 0.42, dw, h * 0.34, '#96a9b3', seed + 9 + d, { rough: 0.8, lift: 1.5, blur: 3, edge: false, sa: 0.18 });
    });
    c.fillStyle = '#4a5a62'; rrect(c, x + w / 2 - 9, y + h * 0.46, 18, 74, 5); c.fill(); c.fillStyle = '#d6dde0'; c.beginPath(); c.arc(x + w / 2, y + h * 0.46 + 52, 5, 0, TAU); c.fill();
    c.fillStyle = '#c9ccc0'; c.fillRect(x + w / 2 - 6, y + h * 0.46 + 8, 12, 30);
    if (tag) { sheet(x + w * 0.1, y + h * 0.3, w * 0.28, 28, '#fbf5e8', seed + 17, { rough: 1, lift: 2, blur: 4, edge: false }); txt(tag, x + w * 0.1 + w * 0.14, y + h * 0.3 + 14, 17, P.inkSoft, { align: 'center', weight: 600 }); }
    c.fillStyle = '#3d4a50'; c.fillRect(x + 6, y + h - 4, 18, 14); c.fillRect(x + w - 24, y + h - 4, 18, 14);
  }
  function whiteboardFrame(x, y, w, h, seed) {
    var c = C.ctx; sheet(x - 12, y - 12, w + 24, h + 24, '#b8c0bd', seed, { rough: 2, lift: 6, blur: 12 });
    sheet(x, y, w, h, '#f9f8f1', seed + 1, { rough: 1.6, lift: 0, blur: 0, edge: false, shadow: false, vg: ['rgba(255,255,255,0)', 'rgba(150,160,150,0.12)'] });
    sheet(x + 10, y + h + 10, w - 20, 14, '#a4adab', seed + 2, { rough: 1, lift: 3, blur: 5, edge: false });
    [['#1f6fd1', 40], ['#c2412d', 62], ['#222', 84]].forEach(function (m) { c.fillStyle = m[0]; c.fillRect(x + m[1] + 8, y + h + 12, 14, 7); });
  }
  function waterCan(x, y, k) { // a 20-litre water can upturned on a steel stand, with a tap and a paper cup
    var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k);
    sheet(-26, -170, 52, 168, '#7d8c93', 99, { rough: 1.2, lift: 5, blur: 10, edge: false });
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(-18, -166, 6, 160);
    sheet(-30, -300, 60, 132, 'rgba(111,181,214,0.88)', 100, { rough: 1.4, lift: 3, blur: 8, edge: false }); c.fillStyle = 'rgba(255,255,255,0.32)'; c.fillRect(-20, -290, 7, 110);
    c.fillStyle = '#eaf3f5'; c.beginPath(); c.ellipse(0, -300, 22, 8, 0, 0, TAU); c.fill();
    c.fillStyle = '#c9d2d4'; c.fillRect(20, -150, 24, 8); c.fillStyle = '#3a6f95'; c.fillRect(38, -150, 8, 16);
    c.restore();
  }
  function pinNote(x, y, w, h, rot, col, seed, fn) { var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot); sheet(-w / 2, -h / 2, w, h, col, seed, { rough: 1.1, lift: 3, blur: 6, edge: false }); if (fn) fn(); c.fillStyle = '#c2412d'; c.beginPath(); c.arc(0, -h / 2 + 8, 4.2, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(-1.2, -h / 2 + 6.6, 1.3, 0, TAU); c.fill(); c.restore(); }

  /* ================= the staff room as a paper diorama =================
     A bold cardboard ground (screen space) carries three depths: BACK (parallax 0.55: the wall sheet, tube lights, window,
     clock, whiteboard, almirahs), ACTION (1.0: floor, door, notice and faculty boards, the long table, people) and NEAR (1.5:
     drifting paper scraps). World space: wall base y = 700; door x 112-334; notice board 368-600; faculty board 628-932;
     window 992-1308; clock (1255, 100); whiteboard 1370-1830; almirahs 1920+; long table x 400-1780. */
  var ST = { wall: '#cfdccb', dado: '#a8bda4', floor: '#b9c1b5', steel: '#8e9fa9', table: '#d9c391', tableFront: '#9a7650' };
  var STRIPS = ['A. IYER · MATHS', 'R. PATIL · BIOLOGY', 'MEERA D. · CHEMISTRY', 'S. NENE · ENGLISH'];
  var TBL = { x0: 400, x1: 1780, top: 684, edge: 736, bot: 940 };
  var SEAT = 790;   // hip y of figures seated behind the long table

  function staffBackdrop(c, t, o) {
    var W0 = -900, WW = 4600;
    panel(W0, 70, WW, 780, o.wall || ST.wall, 3, { rough: 8, sides: 'tb', dots: 'rgba(255,255,255,1)', dotA: 0.3, vg: ['rgba(255,255,255,0.16)', 'rgba(30,50,40,0.12)'] });
    panel(W0, 540, WW, 300, o.dado || ST.dado, 4, { rough: 3, sides: 't', rim: 7, dots: 'rgba(30,50,40,1)', dotA: 0.12, vg: ['rgba(255,255,255,0.06)', 'rgba(20,35,30,0.22)'] });
    for (var i = 0; i < 5; i++) tube(250 + i * 700, 104, 420, t, i, o.lights);
    // window: Pune beyond a steel grill (a real night photo fades in for the late hours)
    sheet(992, 140, 316, 352, '#aab5ae', 31, { rough: 2, lift: 7, blur: 14 });
    windowView(1004, 152, 292, 328, t, o.sky || ['#bcd3cf', '#e6eadb'], { sun: o.sun || 0, sunX: 0.74, sunY: 0.66, far: o.far, mid: o.mid, near: o.near, win: o.winLights, stars: o.stars, crow: o.crow, crowPh: o.crowPh });
    if (o.winPhoto) windowPhoto(1004, 152, 292, 328, o.winPhoto);
    grill(1004, 152, 292, 328); sheet(990, 480, 320, 20, '#c3cbc4', 32, { rough: 1, lift: 4, blur: 8, edge: false });
    clockFace(1255, 100, 46, o.clock ? o.clock[0] : 3, o.clock ? o.clock[1] : 20, t, true);
    whiteboardFrame(1370, 150, 460, 330, 41);
    if (o.boardFn) o.boardFn(); else timetable(1370, 150, 460, 330);
    almirah(1920, 232, 210, 470, 51, 'PHY · CHEM', o.steel); almirah(2142, 232, 210, 470, 52, 'REGISTERS', o.steel); almirah(-300, 232, 210, 470, 53, 'RESULTS', o.steel);
    waterCan(2420, 770, 0.92);
    fan(700, 190, 150, t, o.fan == null ? 7.5 : o.fan); fan(1180, 168, 130, t, o.fan == null ? 7.5 : o.fan);
    if (o.wallFn) o.wallFn();
    windowLight(c, t, o.winLight == null ? 0.085 : o.winLight, o.winCol);
  }
  function floorSheet(c, o) {
    var W0 = -900, WW = 4600;
    var poly = panel(W0, 700, WW, 340, o.floor || ST.floor, 5, { rough: 5, sides: 'tb', rim: 10, vg: ['rgba(255,255,255,0.0)', 'rgba(30,40,35,0.24)'] });
    c.save(); C.path(poly); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2.5;
    for (var gy = 0; gy < 6; gy++) { var yy = 704 + Math.pow(gy / 5, 1.6) * 330 + 22 * gy; c.beginPath(); c.moveTo(W0, yy); c.lineTo(W0 + WW, yy); c.stroke(); }
    for (var gx = -14; gx <= 14; gx++) { c.beginPath(); c.moveTo(1040 + gx * 70, 704); c.lineTo(1040 + gx * 250, 1060); c.stroke(); }
    c.restore();
    c.fillStyle = '#4b5a53'; c.fillRect(W0, 694, WW, 14);   // skirting
  }
  function doorPiece(c, dop) {
    var dx0 = 112, dx1 = 334;
    sheet(dx0 - 12, 224, dx1 - dx0 + 24, 484, '#5b4433', 11, { rough: 2, lift: 5, blur: 12 });
    var cor = c.createLinearGradient(0, 250, 0, 700); cor.addColorStop(0, '#fff3cf'); cor.addColorStop(1, '#e8cf94');
    c.fillStyle = cor; c.fillRect(dx0, 240, dx1 - dx0, 460);
    c.fillStyle = 'rgba(120,90,50,0.25)'; c.fillRect(dx0, 600, dx1 - dx0, 100);
    if (dop > 0) glow(dx0 + 110, 470, 420 * dop + 120, 'rgba(255,246,214,A)', 0.55 * dop);
    var lw = (dx1 - dx0 - 14) * (1 - 0.8 * dop);
    sheet(dx0 + 6, 244, lw, 452, '#9c7249', 12, { rough: 1.4, lift: 4, blur: 8, edge: false, vg: ['rgba(255,255,255,0.10)', 'rgba(40,20,10,0.2)'] });
    if (lw > 60) {
      c.save(); c.beginPath(); c.rect(dx0 + 6, 244, lw, 452); c.clip(); var sx = lw / (dx1 - dx0 - 14);
      c.fillStyle = '#d4e6dd'; c.fillRect(dx0 + 6 + 30 * sx, 276, 130 * sx, 120); c.strokeStyle = 'rgba(70,90,80,0.35)'; c.lineWidth = 1.5;
      for (var wl = 0; wl < 7; wl++) { c.beginPath(); c.moveTo(dx0 + 6 + (30 + wl * 20) * sx, 276); c.lineTo(dx0 + 6 + (30 + wl * 20) * sx, 396); c.stroke(); } for (var wr = 0; wr < 6; wr++) { c.beginPath(); c.moveTo(dx0 + 6 + 30 * sx, 276 + wr * 20); c.lineTo(dx0 + 6 + 160 * sx, 276 + wr * 20); c.stroke(); }
      c.fillStyle = '#6c4a2e'; c.fillRect(dx0 + 6 + 30 * sx, 430, 130 * sx, 120); c.fillStyle = '#c6cdca'; c.fillRect(dx0 + 6 + 40 * sx, 560, 110 * sx, 14);
      c.fillStyle = '#c8ccc6'; c.beginPath(); c.arc(dx0 + 6 + lw - 22, 520, 7, 0, TAU); c.fill(); c.restore();
    }
    sheet(dx0 + 10, 172, 200, 40, '#27447a', 13, { rough: 1, lift: 3, blur: 6 }); txt('Staff room', dx0 + 110, 192, 28, '#f1f4ea', { align: 'center', weight: 700 });
  }
  function noticeBoard(c) {
    sheet(368, 244, 232, 196, '#7a5a3b', 14, { rough: 2, lift: 6, blur: 12 });
    sheet(380, 256, 208, 172, '#c79a64', 15, { rough: 1.4, edge: false, shadow: false, dots: 1, dotCol: 'rgba(90,50,20,0.2)', dotR: 1.6 });
    txt('सूचना', 484, 274, 26, '#5a3a22', { font: C.FONTS.deva, up: false, align: 'center', weight: 400 });
    pinNote(430, 346, 62, 84, -0.06, '#fffdf6', 16, function () { c.fillStyle = '#9aa39b'; for (var q = 0; q < 6; q++) c.fillRect(-24, -24 + q * 11, q % 3 === 2 ? 28 : 48, 3); });
    pinNote(520, 340, 70, 76, 0.07, '#f7e3a1', 17, function () { c.fillStyle = 'rgba(80,60,30,0.6)'; for (var q = 0; q < 5; q++) c.fillRect(-26, -22 + q * 11, 52, 3); });
    pinNote(476, 395, 120, 40, 0.02, '#fffdf6', 18, function () { txt('Fees due 10th', 0, 4, 18, P.inkSoft, { align: 'center', weight: 600 }); });
  }
  function facultyBoard(c, o) {
    sheet(628, 318, 304, 290, '#6e4d34', 21, { rough: 2, lift: 7, blur: 14 });
    sheet(642, 332, 276, 262, '#2f4b45', 22, { rough: 1.2, edge: false, shadow: false, dots: 1, dotCol: 'rgba(255,255,255,0.07)', dotR: 1.7 });
    txt('Faculty', 780, 356, 28, '#f1ead6', { align: 'center', weight: 800 });
    c.fillStyle = 'rgba(241,234,214,0.5)'; c.fillRect(662, 376, 236, 2);
    for (var s = 0; s < 4; s++) {
      var sy = 388 + s * 54, mine = s === 2;
      if (o.gone && o.gone.indexOf(s) >= 0) { c.fillStyle = 'rgba(14,28,24,0.45)'; c.fillRect(660, sy, 240, 44); c.strokeStyle = 'rgba(241,234,214,0.2)'; c.lineWidth = 2; c.setLineDash([8, 6]); c.strokeRect(660, sy, 240, 44); c.setLineDash([]); continue; }
      if (mine && o.strip) { c.fillStyle = 'rgba(14,28,24,0.45)'; c.fillRect(660, sy, 240, 44); if (o.strip >= 1) { c.strokeStyle = 'rgba(241,234,214,0.2)'; c.lineWidth = 2; c.setLineDash([8, 6]); c.strokeRect(660, sy, 240, 44); c.setLineDash([]); } continue; }
      nameStrip(660, sy, STRIPS[s], 23 + s, mine ? '#f6e2a8' : '#f4efe0');
    }
  }
  function nameStrip(x, y, label, seed, fill) {
    var c = C.ctx; sheet(x, y, 240, 44, fill, seed, { rough: 1, lift: 3, blur: 5, edge: false, sa: 0.3 });
    c.fillStyle = '#3a8f6a'; c.beginPath(); c.arc(x + 14, y + 22, 5, 0, TAU); c.fill();
    txt(label, x + 28, y + 23, 22, '#2a2622', { weight: 700 });
  }
  function timetable(x, y, w, h) {
    var c = C.ctx, cols = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], rows = ['4–5', '5–6', '6–7', '7–8'], cw = (w - 70) / 6, rh = (h - 78) / 4;
    c.save(); c.strokeStyle = 'rgba(40,60,90,0.55)'; c.lineWidth = 2.4;
    txt('Timetable · Class 11 B', x + 22, y + 22, 24, '#1f4c93', { weight: 800 });
    for (var i = 0; i <= 6; i++) { c.beginPath(); c.moveTo(x + 70 + i * cw, y + 42); c.lineTo(x + 70 + i * cw, y + h - 10); c.stroke(); }
    for (var j = 0; j <= 4; j++) { c.beginPath(); c.moveTo(x + 10, y + 70 + j * rh); c.lineTo(x + w - 10, y + 70 + j * rh); c.stroke(); }
    cols.forEach(function (d, k) { txt(d, x + 70 + k * cw + cw / 2, y + 56, 20, '#1f4c93', { align: 'center' }); });
    rows.forEach(function (r, k) { txt(r, x + 38, y + 70 + k * rh + rh / 2, 20, '#1f4c93', { align: 'center' }); });
    var SUB = [['PHY', 'CHEM', 'MATH', 'BIO', 'PHY', 'MATH'], ['MATH', 'PHY', 'CHEM', 'MATH', 'BIO', 'CHEM'], ['CHEM', 'MATH', 'PHY', 'CHEM', 'MATH', 'PHY'], ['BIO', 'CHEM', 'BIO', 'PHY', 'CHEM', 'DOUBT']];
    for (var rr = 0; rr < 4; rr++) for (var cc = 0; cc < 6; cc++) {
      var s = SUB[rr][cc], chem = s === 'CHEM', cx = x + 70 + cc * cw, cy = y + 70 + rr * rh;
      if (chem) { c.fillStyle = 'rgba(224,134,62,0.38)'; c.fillRect(cx + 3, cy + 3, cw - 6, rh - 6); }
      txt(s, cx + cw / 2, cy + rh / 2 + 1, chem ? 22 : 20, chem ? '#a8481c' : (cc % 2 ? '#2f6a3d' : '#222'), { align: 'center' });
    }
    c.restore();
  }
  function tableTop(c) {
    var T = TBL, pts = [[T.x0 + 18, T.top], [T.x1 - 18, T.top], [T.x1 + 6, T.edge], [T.x0 - 6, T.edge]];
    shape(pts, ST.table, { lift: 7, blur: 12, dots: 1, dotCol: 'rgba(120,80,30,0.14)', vg: ['rgba(0,0,0,0.05)', 'rgba(255,255,255,0.0)'] });
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(T.x0 + 4, T.edge - 4, T.x1 - T.x0, 3);
  }
  function tableFront(c) {
    var T = TBL;
    c.save(); var g = c.createLinearGradient(0, 800, 0, 1010); g.addColorStop(0, 'rgba(20,30,25,0.30)'); g.addColorStop(1, 'rgba(20,30,25,0)');
    c.fillStyle = g; c.fillRect(T.x0 - 20, 800, T.x1 - T.x0 + 60, 210); c.restore();
    c.fillStyle = '#56635f'; c.fillRect(T.x0 + 16, 790, 24, 170); c.fillRect(T.x1 - 40, 790, 24, 170); c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(T.x0 + 20, 790, 5, 170); c.fillRect(T.x1 - 36, 790, 5, 170);
    c.fillStyle = '#3f4a47'; c.fillRect(T.x0 + 12, 954, 32, 8); c.fillRect(T.x1 - 44, 954, 32, 8);
    sheet(T.x0 + 24, T.edge + 28, T.x1 - T.x0 - 48, 36, '#8a6a47', 73, { rough: 1.2, lift: 5, blur: 10, edge: false, vg: ['rgba(0,0,0,0.0)', 'rgba(20,10,0,0.25)'] });
    sheet(T.x0 - 8, T.edge, T.x1 - T.x0 + 16, 30, '#a98456', 71, { rough: 1.2, lift: 6, blur: 12, dots: 1, dotCol: 'rgba(0,0,0,0.07)' });
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(T.x0 - 4, T.edge + 2, T.x1 - T.x0 + 8, 3);
  }
  // chair behind a seated figure: (x, hipY) = seat point of the figure, k = its scale; flip faces left
  function chairBack(c, x, hipY, k, flip, col) {
    var f = flip ? -1 : 1, bx = x - f * 13 * k, w = 21 * k, top = hipY - 33 * k, fy = hipY + 25 * k;
    c.fillStyle = '#3a474c'; c.fillRect(x - f * 15 * k - 2.2 * k, hipY + 3 * k, 4.4 * k, fy - hipY - 3 * k); c.fillRect(x + f * 16 * k - 2.2 * k, hipY + 3 * k, 4.4 * k, fy - hipY - 3 * k);
    c.fillStyle = 'rgba(30,40,35,0.28)'; c.beginPath(); c.ellipse(x, fy + 2, 24 * k, 2.6 * k, 0, 0, TAU); c.fill();
    sheet(bx - w / 2, top, w, 38 * k, col || '#476c78', Math.round(x) % 90 + 5, { rough: 1.0, lift: 5, blur: 10, vg: ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.2)'] });
    c.fillStyle = '#3a474c'; c.fillRect(bx - 2.2 * k, top + 36 * k, 4.4 * k, 8 * k);
  }
  // soft window light across the room
  function windowLight(c, t, a, col) {
    col = col || '255,248,224'; c.save(); var g = c.createLinearGradient(1000, 480, 1500, 1000); g.addColorStop(0, 'rgba(' + col + ',' + (a * 1.4) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(1004, 480); c.lineTo(1296, 480); c.lineTo(1860 + osc(t, 0.1) * 8, 1090); c.lineTo(1190, 1090); c.closePath(); c.fill(); c.restore();
  }
  // the whole diorama through a camera; H = { behind, seated, onTable, front, near } draw the action layer
  function staffWorld(c, t, cam, o, H) {
    C.cardboard(o.ground || '#6e8f84');
    lay(cam, 0.55, function () { staffBackdrop(c, t, o); });
    if (!o.noMid) lay(cam, 1.0, function () {
      floorSheet(c, o); doorPiece(c, o.door || 0); if (o.doorFn) o.doorFn();
      if (o.noticeFn) o.noticeFn(); else noticeBoard(c);
      facultyBoard(c, o);
      if (H.behind) H.behind();
      tableTop(c);
      if (H.seated) H.seated();
      tableFront(c);
      if (H.onTable) H.onTable();
      if (H.front) H.front();
    });
    lay(cam, 1.5, function () { C.confetti(o.confSeed || 5, C.T12(t), o.confCol || 'rgba(255,253,247,1)', 7, [-200, 100, 2400, 800]); if (H.near) H.near(); });
    if (o.tint) { c.save(); c.fillStyle = o.tint; c.fillRect(0, 0, 1920, 1080); c.restore(); }
  }
  function sit(who, x, k, o, flip) { return CAST.draw(C.ctx, who, x, SEAT, k * 100, Object.assign({ pose: 'sit', flip: !!flip }, o)); }
  function stand(who, x, y, k, o, flip) { return CAST.draw(C.ctx, who, x, y, k * 100, Object.assign({ pose: 'stand', flip: !!flip }, o)); }
  // a character at close-up scale: head centre at (cx, cy) on the screen, s px per cast unit (s = 23 -> a head 470 px tall).
  // Squash and lean pivot far below the frame and would carry the head with them: undo that drift so the head stays where
  // asked (o.dx / o.dy move it on purpose).
  function bfPos(cx, cy, s, o) {
    var f = o.flip ? -1 : 1, sq = CL(o.squash || 0, -0.35, 0.35), ln_ = o.lean || 0;
    return { x: cx - f * (1.5 * s + 44 * Math.sin(ln_) * s) + (o.dx || 0), y: cy + 88 * s * (1 - sq) + (o.dy || 0) };
  }
  function bigFace(who, cx, cy, s, o) { var p = bfPos(cx, cy, s, o); return CAST.draw(C.ctx, who, p.x, p.y, s * 100, Object.assign({ pose: 'stand' }, o)); }
  // two-joint reach: the [shoulder, elbow] angles that put a cast arm's hand on (tx, ty). (x, y, s, o) are the CAST.draw arguments.
  function armTo(who, x, y, s, o, tx, ty, far, down) {
    var Lk = (typeof who === 'string' && CAST.WHO[who]) ? CAST.WHO[who] : { build: 1 }, b = Lk.build || 1, f = o.flip ? -1 : 1, hipY = o.pose === 'sit' ? 0 : -44, lean = o.lean || 0;
    var ux = (far ? -11 : 11) * b, uy = hipY - 28 + 1.5 - hipY, cs = Math.cos(lean), sn = Math.sin(lean);
    var sx = x + f * (ux * cs - uy * sn) * s, sy = y + (hipY + ux * sn + uy * cs) * s;
    var L1 = 15.5 * s, L2 = 14.5 * s, dx = (tx - sx) * f, dy = ty - sy, d = Math.max(Math.min(Math.hypot(dx, dy), L1 + L2 - 1), Math.abs(L1 - L2) + 1), a = Math.atan2(dy, dx);
    var A = Math.acos(CL((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), th1 = a + (down === false ? -A : A);
    var ex = Math.cos(th1) * L1, ey = Math.sin(th1) * L1, th2 = Math.atan2(dy - ey, dx - ex);
    return [PI / 2 - (th1 - lean), th1 - th2];
  }
  // rotating sunburst on twos behind a hero beat
  function burstBG(t, x, y, col, a) { C.sunburst(x, y, 60, 1700, 18, col, a == null ? 0.5 : a, C.T12(t) * 0.12); }

  /* ================= shared props for the staff room ================= */
  // a sheet lying flat on a table top (squashed and skewed into perspective)
  function flat(x, y, rot, fn) { var c = C.ctx; c.save(); c.translate(x, y); c.transform(1, 0, -0.35, 0.5, 0, 0); c.rotate(rot || 0); fn(); c.restore(); }
  function letterFlat(x, y, w, h, rot) { flat(x, y, rot, function () { letterSheet(0, 0, w, h, 0, { seed: 31, lines: 6 }); }); }
  // the printed letter at close-up scale (base 300 x 400)
  function letterBig(x, y, k, rot) {
    var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(k, k);
    sheet(-150, -200, 300, 400, '#fffdf6', 31, { rough: 1.4, lift: 9, blur: 18, sa: 0.34 });
    c.fillStyle = '#2f7f7a'; c.fillRect(-150, -200, 300, 46); txt('Vidya Classes', -134, -177, 27, '#f6f1e3', { weight: 800 });
    txt('Notice · faculty restructuring', -134, -128, 22, '#1f1b18', { weight: 800, maxW: 270 });
    ['Dear Ms. Deshpande,', 'Owing to restructuring, the', 'chemistry post is discontinued', 'with effect from 31 March.', 'We thank you for twelve years.'].forEach(function (l, i) { hand(l, -134, -84 + i * 33, 21, '#2b2622'); });
    c.fillStyle = 'rgba(60,55,50,0.35)'; c.fillRect(-134, 100, 250, 4); c.fillRect(-134, 118, 190, 4);
    c.strokeStyle = '#1f4c93'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-134, 168); c.bezierCurveTo(-110, 138, -92, 190, -68, 156); c.bezierCurveTo(-52, 140, -44, 176, -20, 160); c.stroke();
    c.restore();
  }
  // a batch photo hanging from its clip (centred on x, top at y); i = the batch year offset
  function batchPhoto(x, y, rot, i, k) {
    var c = C.ctx; k = k || 1; c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(k, k);
    sheet(-31, 0, 62, 78, '#fbf4dc', 60 + i, { rough: 1, lift: 3, blur: 6, edgeW: 4 });
    c.fillStyle = ['#7aa6a0', '#d9a86c', '#8aa0c4', '#c98b7a'][i % 4]; c.fillRect(-26, 5, 52, 48);
    var r = C.rand(90 + i), tones = ['#8d5a3c', '#a8714f', '#b57e5a', '#7a4b33'], shirts = ['#f4ead7', '#2f7f7a', '#e0863e', '#4b6fa8', '#8c2a2a'];
    for (var row = 0; row < 3; row++) for (var q = 0; q < 6 - (row === 0 ? 1 : 0); q++) {
      var px = -22 + q * 8.6 + (row === 0 ? 4.3 : 0), py = 15 + row * 12; c.fillStyle = shirts[Math.floor(r() * shirts.length)]; c.fillRect(px - 3, py + 3.4, 6.4, 7);
      c.fillStyle = tones[Math.floor(r() * tones.length)]; c.beginPath(); c.arc(px, py, 3.2, 0, TAU); c.fill();
    }
    txt(String(2015 + i), 0, 66, 15, '#3a342c', { align: 'center', weight: 800 });
    c.fillStyle = '#8c8f8a'; c.beginPath(); c.arc(0, -2, 4, 0, TAU); c.fill();
    c.restore();
  }
  // open cardboard box on the table; n photo edges show in it
  function tableBox(x, y, k, n) {
    var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k);
    sheet(-78, -96, 156, 96, '#c4975c', 81, { rough: 1.3, lift: 6, blur: 12, vg: ['rgba(255,255,255,0.08)', 'rgba(60,30,0,0.24)'] });
    c.fillStyle = '#3a2814'; c.beginPath(); c.moveTo(-70, -96); c.lineTo(70, -96); c.lineTo(62, -86); c.lineTo(-62, -86); c.closePath(); c.fill();
    for (var i = 0; i < n; i++) { c.save(); c.translate(-54 + (i % 6) * 21, -92); c.rotate(((i * 37) % 11 - 5) * 0.03); c.fillStyle = ['#fbf4dc', '#d9a86c', '#8aa0c4', '#7aa6a0'][i % 4]; c.fillRect(-9, -10 - Math.floor(i / 6) * 4, 18, 16); c.restore(); }
    sheet(-86, -122, 56, 34, '#b88a52', 82, { rough: 1, lift: 3, blur: 6, edgeW: 4 }); sheet(30, -124, 56, 34, '#b4864e', 83, { rough: 1, lift: 3, blur: 6, edgeW: 4 });
    txt('Fragile', 0, -44, 24, 'rgba(70,40,10,0.6)', { align: 'center', weight: 800 });
    c.restore();
  }
  var GAR = { x0: 392, pitch: 76, y: 156 };
  function garlandPos(i, t) { t = C.T12(t); var x = GAR.x0 + i * GAR.pitch, f = i / 11; return { x: x, y: GAR.y + 26 * Math.sin(PI * f) + 6 * Math.sin(t * 1.6 + i), rot: 0.07 * Math.sin(t * 1.3 + i * 1.7) }; }
  function garlandString(c) { c.save(); c.strokeStyle = 'rgba(70,55,40,0.85)'; c.lineWidth = 2.6; c.beginPath(); for (var i = 0; i <= 24; i++) { var x = GAR.x0 - 40 + i * (12 * GAR.pitch) / 24, f = (x - GAR.x0) / (11 * GAR.pitch), y = GAR.y - 6 + 28 * Math.sin(PI * C.clamp(f)); if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); c.restore(); }

  /* ================= variant A: the box (build-cut and ban-cut) =================
     S1 0-2 beats wide: the garland of twelve batch photos pops onto the wall, Meera reads the letter
     S2 2-5  big face on cardboard: the letter, a sag take (pop on beat 4)
     S3 5-7  she takes her name strip down, a stamp, the twelve photos fly into the box
     S4 7-10 a colleague's hand on her shoulder, she carries the box out; the camera stays with the chai she left */
  var CAM_CUT = [
    { t: -1, x: 1012, y: 548, z: 0.98 }, { t: 0, x: 1000, y: 548, z: 1.0 }, { t: B(2), x: 968, y: 548, z: 1.045, ease: 'linear' },
    { t: B(5), x: 640, y: 548, z: 1.25 }, { t: B(7), x: 620, y: 543, z: 1.32, ease: 'linear' },
    { t: B(7), x: 440, y: 612, z: 1.45 }, { t: 5.1, x: 350, y: 612, z: 1.5, ease: 'linear' }, { t: 5.8, x: 700, y: 650, z: 2.5 }, { t: 7.5, x: 690, y: 644, z: 2.85, ease: 'linear' }
  ];
  var MK = 6.5, CK = 6.0, MX = 500;     // Meera's scale, colleagues' scale, Meera's seat x
  function cutColleagues(c, t, standing7) {
    var sip = sm(t, 0.3, 0.7) * (1 - sm(t, 1.0, 1.25));
    [[1110, '#6b7b46'], [1330, '#a1593f'], [1500, '#476c78'], [1670, '#6b7b46']].forEach(function (q) { chairBack(c, q[0], SEAT, CK, true, q[1]); });
    sit('extra:6', 1110, CK, arms(ARM.down, { face: 'sad', t: t + 2.1, look: [-0.9, 0.35], tilt: 0.06 + 0.03 * osc(t, 0.3), armL: ar(0.2, 0.5), armR: ar(0.25 + 0.04 * osc(t, 1.2), 0.6) }), true);
    sit('extra:10', 1500, CK, arms(ARM.down, { face: t < 0.8 ? 'neutral' : 'worried', t: t, holdR: 'cup', armR: ar(0.9 + sip * 1.0, 0.6 + sip * 1.1), look: [-0.9, 0.2], tilt: 0.04 * osc(t, 0.3) }), true);
    sit('extra:22', 1670, CK, arms(ARM.write, { face: 'worried', t: t + 1.3, look: [-0.8, 0.5], tilt: 0.05, armL: ar(0.55, 1.0), armR: ar(0.6 + 0.05 * osc(t, 1.4), 1.0) }), true);
    if (!standing7) sit('extra:7', 1330, CK, arms(ARM.think, { face: 'sad', t: t + 0.6, look: [-0.9, 0.3], tilt: -0.08 + 0.03 * osc(t, 0.4) }), true);
  }
  function cutS1(c, t) {            // wide
    var cam = camOf(t, CAM_CUT), lift = sm(t, 0.45, 1.2);
    staffWorld(c, t, cam, { ground: '#6e8f84', sky: ['#bfd2cd', '#e4e8d8'], sun: 0.0, clock: [3, 20], winLight: 0.07, confCol: 'rgba(255,253,247,1)' }, {
      behind: function () { chairBack(c, MX, SEAT, MK, false, '#476c78'); garlandString(c); },
      seated: function () {
        cutColleagues(c, t, false);
        var m = sit('meera', MX, MK, { face: t < 0.5 ? 'neutral' : 'focused', t: t, lean: 0.1 + 0.05 * lift, tilt: 0.1 + 0.05 * (1 - lift), look: [0.55, 0.9],
          armL: ar(lerp(0.2, 0.55, lift), lerp(0.2, 1.5, lift)), armR: ar(lerp(0.7, 0.65, lift), lerp(0.5, 1.45, lift)) }, false);
        if (lift > 0) letterSheet(lerp(600, m.handR.x - 18, lift), lerp(712, m.handR.y - 28, lift), 80, lerp(44, 108, lift), lerp(-0.05, -0.08, lift), { seed: 31 });
      },
      onTable: function () {
        if (t < 0.45) letterFlat(600, 712, 84, 90, -0.04);
        chai(668, 733, 1.05, t, 0.1); chai(1250, 733, 1.0, t, 0.4); chai(1425, 733, 1.0, t, 0.75); stackPapers(1580, 733, 110, 3, 5); book(790, 702, 70, 28, '#2f7f7a', 9, 'ATT');
        pencil(880, 722, -0.15, 56); stackPapers(1000, 733, 100, 4, 11, '#e8d7a0');
        // twelve batch photos pop onto the garland (stagger well under half a second)
        for (var i = 0; i < 12; i++) { (function (i) { var g = garlandPos(i, t), p = lnT(t, 0.05 + i * 0.04, 0.05 + i * 0.04 + 0.25); C.popIn(g.x, g.y + 40, p, function () { batchPhoto(g.x, g.y, g.rot, i); }); })(i); }
      }
    });
    C.banner('Staff room · 2027', 1236, 56, { size: 56, bg: '#fffdf7', fg: P.tealDark, rot: -0.025, p: lnT(t, 0, 0.3), seed: 9 });
  }
  function cutS2(c, t) {            // big face on cardboard
    var cam = camOf(t, [{ t: B(2), x: 960, y: 540, z: 1.0 }, { t: B(5), x: 944, y: 540, z: 1.06, ease: 'linear' }], B(4));
    C.cardboard('#7a2f34', 0.35);
    C.withCam(cam, function () {
      burstBG(t, 560, 520, 'rgba(255,196,140,0.2)', 1);
      C.confetti(12, C.T12(t), 'rgba(255,225,190,1)', 9, [0, 60, 1920, 860]);
      // the letter, taped up where she can read it
      var lp = lnT(t, B(2), B(2) + 0.3);
      C.popIn(1420, 560, lp, function () { letterBig(1420, 560, 1.32, 0.05); C.tape(1420, 372, 150, -0.1); });
      var o = CAST.withTake({ face: 'focused', t: t, tilt: 0.1 + 0.03 * osc(t, 0.5), lean: 0.012, look: [0.7 + 0.1 * osc(t, 0.4), 0.15 + 0.5 * sm(t, B(2) + 0.1, 2.0)] }, 'sag', t, B(4) - 0.4);
      if (t > 2.9) o.look = [0.2, -0.2];
      o.dy = 46 * sm(t, B(4), B(4) + 0.4); bigFace('meera', 560, 500, 22, o);
      C.inkStamp('Notice', 1470, 690, lnT(t, B(4) - 0.12, B(4) + 0.12), { size: 84, col: '#7a2f34', bg: '#fffdf6', rot: -0.14, seed: 4 });
    });
  }
  function cutS3(c, t) {            // she takes down her strip, the photos fly into the box, a stamp
    var cam = camOf(t, CAM_CUT, B(6)), reach = sm(t, 3.125, 3.34), back = sm(t, 3.5, 3.72), grip = t >= 3.4;
    var boxN = 0; for (var i = 0; i < 12; i++) if (t >= 3.55 + i * 0.04 + 0.38) boxN++;
    staffWorld(c, t, cam, { ground: '#6e8f84', strip: grip ? 1 : 0, sky: ['#bfd2cd', '#e4e8d8'], winLight: 0.07, clock: [3, 20] }, {
      behind: function () { chairBack(c, 1330, SEAT, CK, true, '#a1593f'); },
      seated: function () { cutColleagues(c, t, false); },
      onTable: function () {
        chai(668 + 120, 733, 1.0, t, 0.1); tableBox(612, 724, 1.0, boxN);
        letterFlat(930, 712, 84, 90, 0.05);
        garlandString(c);
        for (var i = 0; i < 12; i++) {
          (function (i) {
            var g = garlandPos(i, t), tl = 3.55 + i * 0.04, u = lnT(t, tl, tl + 0.38);
            if (u >= 1) return;
            if (u <= 0) { batchPhoto(g.x, g.y, g.rot, i); return; }
            var bx = 612 + (i % 6 - 2.5) * 14, by = 612;
            C.trail(function (tt) { var uu = C.clamp((C.T12(tt) - tl) / 0.38), ee = C.ease(uu); if (uu <= 0 || uu >= 1) return; batchPhoto(lerp(g.x, bx, ee), lerp(g.y, by, ee * ee) - 160 * Math.sin(PI * uu), g.rot + uu * 5, i, lerp(1, 1.6, Math.sin(PI * uu)) * lerp(1, 0.55, ee * ee)); }, t);
          })(i);
        }
      },
      front: function () {
        var mo = { pose: 'stand', flip: false, lean: 0.06 }, aS = armTo('meera', 440, 962, MK, mo, 700, 516), aB = armTo('meera', 440, 962, MK, mo, 612, 650);
        var m = stand('meera', 440, 962, MK, arms(ARM.down, { face: 'sad', t: t, lean: 0.06, tilt: 0.08, look: grip ? [0.3, 0.7] : [0.8, -0.3],
          armL: ar(0.15, 0.25), armR: t < 3.5 ? ar(lerp(0.4, aS[0], reach), lerp(0.3, aS[1], reach)) : ar(lerp(aS[0], aB[0], back), lerp(aS[1], aB[1], back)) }), false);
        // the strip in her hand, then dropped into the box
        if (t >= 3.4 && t < 3.72) { var dp = sm(t, 3.55, 3.72); c.save(); c.translate(lerp(m.handR.x, 612, dp), lerp(m.handR.y, 640, dp)); c.rotate(0.12 + 1.2 * dp); nameStrip(-60, -22, STRIPS[2], 25, '#f6e2a8'); c.restore(); }
      }
    });
    C.inkStamp('12 years', 1290, 300, lnT(t, 3.75 - 0.12, 3.75 + 0.12), { size: 120, col: '#8c2a2a', bg: '#f4ecd8', rot: -0.1, seed: 6 });
  }
  function cutS4(c, t) {            // out the door; the camera stays with her chai
    var cam = camOf(t, CAM_CUT), walk = ln(t, 4.7, 5.25), mxw = lerp(480, 214, C.ease(walk)), hand = 1 - sm(t, 4.6, 4.95), gone = sm(t, 5.18, 5.32);
    staffWorld(c, t, cam, { ground: '#6e8f84', strip: 1, door: sm(t, B(8) - 0.05, 5.4) * (1 - sm(t, 5.6, 6.0)), sky: ['#bfd2cd', '#e4e8d8'], winLight: 0.07, clock: [3, 20] }, {
      behind: function () { chairBack(c, MX, SEAT, MK, false, '#476c78'); chairBack(c, 1330, SEAT, CK, true, '#a1593f'); },
      seated: function () { cutColleagues(c, t, true); },
      onTable: function () { chai(668, 733, 1.05, t, 0.1); letterFlat(790, 712, 84, 90, 0.05); chai(1250, 733, 1.0, t, 0.4); },
      front: function () {
        var walking = t > 4.7 && t < 5.3;
        stand('meera', mxw, 962, MK, arms(ARM.carryBox, { face: 'sad', t: t, holdR: 'box', pose: walking ? 'walk' : 'stand', walk: (t - 4.7) * 5.5, lean: 0.07, tilt: 0.12, look: [-0.5, 0.5], alpha: 1 - gone }), true);
        var cx = lerp(mxw + 222, 292, sm(t, 4.8, 5.5)), co = { pose: 'stand', flip: true, lean: 0.2 }, aH = armTo('extra:7', cx, 962, CK, co, mxw + 82, 478);
        stand('extra:7', cx, 962, CK, arms(ARM.down, { face: 'sad', t: t + 0.6, lean: 0.2, tilt: 0.05, armR: ar(lerp(0.3, aH[0], hand), lerp(0.2, aH[1], hand)), pose: t > 4.4 && t < 5.1 ? 'walk' : 'stand', walk: (t - 4.4) * 5.5 }), true);
      }
    });
    cutRays(c, t, cam);
  }
  function cutRays(c, t, cam) { var a = 0.15 * sm(t, 5.2, 5.6); if (a <= 0) return; var q = w2s(cam, 668, 700); c.save(); c.globalAlpha = a; C.sunburst(q.x, q.y, 90, 1500, 16, '#fffdf7', 1, C.T12(t) * 0.1); c.restore(); }
  function drawCut(c, t) {
    if (t < B(2)) cutS1(c, t); else if (t < B(5)) cutS2(c, t); else if (t < B(7)) cutS3(c, t); else cutS4(c, t);
    cap(c, 'Twelve years teaching chemistry at *Vidya*.', t, 0.3, 3.0);
    cap(c, 'Today Meera packs them into a *box*.', t, 3.2, 6.05);
  }

  /* ================= props for the retrain rooms ================= */
  // an AI struggle-map printout: dots, teal = on track, coral = needs help
  function struggleSheet(w, h, seed) {
    var c = C.ctx; sheet(-w / 2, -h / 2, w, h, '#fffdf6', seed, { rough: 1, lift: 3, blur: 6, edge: false });
    c.fillStyle = '#17262d'; c.fillRect(-w / 2 + 6, -h / 2 + 6, w - 12, h * 0.15);
    var r = C.rand(seed), cols = 6, rows = 4;
    for (var i = 0; i < cols * rows; i++) { c.fillStyle = r() < 0.27 ? '#ff6f59' : '#55d6be'; c.beginPath(); c.arc(-w / 2 + 14 + (i % cols) * ((w - 28) / (cols - 1)), -h / 2 + h * 0.34 + Math.floor(i / cols) * (h * 0.15), Math.min(w, h) * 0.045, 0, TAU); c.fill(); }
  }
  var NAMES = ['Aarav Kale', 'Ishita Rao', 'Kabir Mane', 'Neha Kulkarni', 'Omkar Deshmukh', 'Riya Patil', 'Sana Shaikh', 'Tanmay Gokhale'];
  // Meera's list of eight mentees (base 170 x 236, centred). hi 0..1 lights up the first name; np(i) 0..1 pops name i in
  function listSheet(x, y, k, rot, hi, seed, np) {
    var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(k, k);
    sheet(-85, -118, 170, 236, '#fffdf6', seed || 41, { rough: 1.2, lift: 6, blur: 12, sa: 0.32 });
    c.fillStyle = '#2f7f7a'; c.fillRect(-85, -118, 170, 34); txt('My eight · mentees', -73, -101, 21, '#f6f1e3', { weight: 700 });
    NAMES.forEach(function (n, i) {
      var yy = -61 + i * 24, p = np ? np(i) : 1; if (p <= 0) return;
      C.popIn(-30, yy, p, function () {
        if (i === 0 && hi > 0) { var hw = 152 * C.easeOut(CL(hi * 1.4)); c.fillStyle = 'rgba(244,200,70,0.92)'; c.beginPath(); c.moveTo(-77, yy - 11); c.lineTo(-77 + hw, yy - 13); c.lineTo(-77 + hw, yy + 11); c.lineTo(-79, yy + 12); c.closePath(); c.fill(); }
        c.strokeStyle = 'rgba(60,55,50,0.45)'; c.lineWidth = 1.4; c.beginPath(); c.arc(-68, yy, 5, 0, TAU); c.stroke();
        if (i === 0 && hi > 0.4) { c.strokeStyle = '#2f7f7a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-71, yy); c.lineTo(-68, yy + 3.5); c.lineTo(-63, yy - 4); c.stroke(); }
        hand(n, -56, yy + 1, 20, i === 0 && hi > 0 ? '#1f1b18' : '#3a3530');
      });
    });
    if (hi > 0) C.markRing2(-14, -61, 76, 18, CL(hi * 1.1 - 0.15), { col: '#d0702a', w: 3.4 });
    c.restore();
  }
  // ruled notebook page with a benzene ring (p draws the hexagon, q the double bonds); base 150 x 196; returns the pencil tip
  function notebookPage(x, y, k, rot, p, q) {
    var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(k, k);
    sheet(-75, -98, 150, 196, '#fffdf6', 47, { rough: 1.2, lift: 6, blur: 12, sa: 0.32 });
    c.strokeStyle = 'rgba(70,120,190,0.28)'; c.lineWidth = 1.2; for (var i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-70, -78 + i * 20); c.lineTo(70, -78 + i * 20); c.stroke(); }
    c.strokeStyle = 'rgba(200,70,60,0.5)'; c.beginPath(); c.moveTo(-52, -96); c.lineTo(-52, 96); c.stroke();
    c.fillStyle = '#4a4440'; for (var h = 0; h < 6; h++) { c.beginPath(); c.arc(-69, -80 + h * 32, 3.2, 0, TAU); c.fill(); }
    hand('Q4. Structure of benzene', -46, -84, 14, '#2a2622');
    var R = 38, cx = 6, cy = -10, pts = []; for (var v = 0; v < 6; v++) pts.push([cx + Math.cos(-PI / 2 + v * PI / 3) * R, cy + Math.sin(-PI / 2 + v * PI / 3) * R]);
    c.strokeStyle = '#25384f'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
    var n = CL(p) * 6; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); var tip = pts[0];
    for (var e = 0; e < 6; e++) { var f = CL(n - e); if (f <= 0) break; var a = pts[e], b = pts[(e + 1) % 6]; tip = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; c.lineTo(tip[0], tip[1]); } c.stroke();
    if (q > 0) { c.strokeStyle = '#8c2a2a'; c.lineWidth = 2.6; [[0, 1], [2, 3], [4, 5]].forEach(function (pr, i) { var f = CL(q * 3 - i); if (f <= 0) return; var a = pts[pr[0]], b = pts[pr[1]], ix = cx + (a[0] - cx) * 0.74, iy = cy + (a[1] - cy) * 0.74, jx = cx + (b[0] - cx) * 0.74, jy = cy + (b[1] - cy) * 0.74; c.beginPath(); c.moveTo(ix, iy); c.lineTo(ix + (jx - ix) * f, iy + (jy - iy) * f); c.stroke(); }); }
    if (q > 0.6) { hand('C₆H₆', cx - 22, 52, 22, '#2a2622'); hand('benzene', cx - 26, 74, 16, '#2f7f7a'); }
    c.restore();
    var cs = Math.cos(rot || 0), sn = Math.sin(rot || 0);
    return { tip: { x: x + (tip[0] * cs - tip[1] * sn) * k, y: y + (tip[0] * sn + tip[1] * cs) * k } };
  }
  function hangSign(x, y, w, h, t, rot) {
    var c = C.ctx, sw = rot == null ? osc(C.T12(t), 0.3) * 0.018 : rot;
    c.save(); c.strokeStyle = 'rgba(70,60,50,0.8)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x - w * 0.34, 74); c.lineTo(x - w * 0.34 + sw * 120, y - h / 2 + 6); c.moveTo(x + w * 0.34, 74); c.lineTo(x + w * 0.34 + sw * 120, y - h / 2 + 6); c.stroke();
    c.translate(x, y - h / 2); c.rotate(sw); c.translate(0, h / 2);
    sheet(-w / 2, -h / 2, w, h, '#fbf3d6', 91, { rough: 2, lift: 8, blur: 14, dots: 1, dotCol: 'rgba(120,90,30,0.12)' });
    txt('Doubt desk', 0, -h * 0.17, h * 0.42, '#8c2a2a', { align: 'center', weight: 800, maxW: w - 40 });
    txt('4 – 8 pm · every day', 0, h * 0.27, h * 0.25, '#1f4c93', { align: 'center', weight: 700, maxW: w - 50 });
    c.strokeStyle = '#8c2a2a'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w * 0.34, h * 0.06); c.quadraticCurveTo(0, h * 0.13, w * 0.34, h * 0.05); c.stroke();
    c.fillStyle = '#8c2a2a'; c.beginPath(); c.arc(-w / 2 + 14, -h / 2 + 12, 4.5, 0, TAU); c.arc(w / 2 - 14, -h / 2 + 12, 4.5, 0, TAU); c.fill();
    c.restore();
  }
  function noScreens(x, y, k) {
    var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k); c.rotate(-0.03);
    sheet(-62, -78, 124, 156, '#fffdf6', 93, { rough: 1.4, lift: 5, blur: 10 });
    c.fillStyle = '#2b3a44'; rrect(c, -30, -48, 60, 44, 4); c.fill(); c.fillStyle = '#8fd8ff'; c.fillRect(-25, -43, 50, 34);
    c.strokeStyle = '#8c2a2a'; c.lineWidth = 8; c.beginPath(); c.arc(0, -26, 46, 0, TAU); c.moveTo(-32, -58); c.lineTo(32, 6); c.stroke();
    txt('No screens', 0, 46, 34, '#8c2a2a', { align: 'center', weight: 800, maxW: 108 }); txt('pencil · paper · you', 0, 66, 15, P.inkSoft, { align: 'center', weight: 600, maxW: 108 });
    c.restore();
  }
  function mentorBoard(p) {
    var c = C.ctx, x = 1370, y = 150;
    c.save(); c.globalAlpha = 0.1; timetable(x, y, 460, 330); c.restore();    // the old timetable, wiped but still ghosting
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x + 8, y + 8, 444, 314);
    txt('Mentor =', x + 26, y + 58, 70, '#1f4c93', { weight: 800, maxW: 330 }); txt('8 students', x + 26, y + 130, 74, '#1f4c93', { weight: 800, maxW: 330 });
    txt('Know each one', x + 30, y + 214, 62, '#8c2a2a', { weight: 800, maxW: 330 });
    var u = CL(p); if (u > 0) { c.strokeStyle = '#8c2a2a'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 30, y + 244); for (var i = 1; i <= 24 * u; i++) { var f = i / 24; c.lineTo(x + 30 + f * 330, y + 244 + Math.sin(f * 14) * 3 + f * -4); } c.stroke(); }
    for (var k = 0; k < 8; k++) { c.fillStyle = k === 0 ? '#e0863e' : 'rgba(31,76,147,0.75)'; c.beginPath(); c.arc(x + 44 + k * 52, y + 284, 15, 0, TAU); c.fill(); c.fillRect(x + 36 + k * 52, y + 300, 16, 12); }
  }
  // a big cork board for the close-ups, with the list pinned on it
  function corkBoard(x, y, w, h) {
    sheet(x - 14, y - 14, w + 28, h + 28, '#7a5a3b', 71, { rough: 2, lift: 9, blur: 16 });
    sheet(x, y, w, h, '#c79a64', 72, { rough: 1.4, edge: false, shadow: false, dots: 1, dotCol: 'rgba(90,50,20,0.22)', dotR: 1.8 });
  }

  /* ================= variant B: mentor workshop (build-retrain) =================
     S1 0-2 beats wide: Sunanda at the board, Meera nervous · S2 2-5 big face, the eight names pop onto her list, a realize take
     (pop on beat 4: Aarav Kale lights up) · S3 5-7 she pins the list, MENTOR stamp · S4 7-10 big face again: a joy take on beat 9. */
  var CAM_MENT = [
    { t: -1, x: 1012, y: 548, z: 0.98 }, { t: 0, x: 1000, y: 548, z: 1.0 }, { t: B(2), x: 1040, y: 548, z: 1.05, ease: 'linear' },
    { t: B(5), x: 480, y: 575, z: 1.34 }, { t: B(7), x: 462, y: 566, z: 1.4, ease: 'linear' }
  ];
  var MENT_X = [820, 990, 1160, 1330];
  function mentColleagues(c, t, turned) {
    var nod = 0.05 * osc(t, 0.9), fl = turned;
    MENT_X.forEach(function (x, i) { chairBack(c, x, SEAT, CK, fl, ['#a1593f', '#6b7b46', '#476c78', '#a1593f'][i]); });
    sit('extra:10', 820, CK, arms(ARM.down, { face: turned ? 'smile' : 'neutral', t: t, tilt: nod, look: [0.9, -0.1], armL: ar(0.4, 1.2), armR: ar(0.5, 1.1) }), fl);
    sit('extra:7', 990, CK, arms(ARM.write, { face: turned ? 'grin' : 'smile', t: t + 0.7, tilt: -0.04, look: [0.9, 0.2], armL: ar(0.55, 1.0), armR: ar(0.6 + 0.06 * osc(t, 1.5), 1.0) }), fl);
    var q = sm(t, 0.5, 0.85) * (1 - sm(t, 1.05, 1.25));
    sit('extra:22', 1160, CK, arms(ARM.down, { face: turned ? 'smile' : 'talk', t: t + 1.9, look: [0.9, -0.1], armL: ar(0.4, 1.2), armR: turned ? ar(0.5, 1.1) : ar(lerp(0.4, 3.0, q), lerp(0.3, 0.1, q)) }), fl);
    sit('extra:6', 1330, CK, arms(ARM.down, { face: turned ? 'grin' : 'neutral', t: t + 2.6, tilt: 0.04 * osc(t, 0.7), look: [0.9, 0], holdR: 'cup', armL: ar(0.4, 1.2), armR: ar(1.0 + 0.9 * sm(t, 0.2, 0.5) * (1 - sm(t, 0.9, 1.2)), 0.8 + 1.0 * sm(t, 0.2, 0.5) * (1 - sm(t, 0.9, 1.2))) }), fl);
  }
  function mentS1(c, t) {
    var cam = camOf(t, CAM_MENT), lift = sm(t, 0.5, 1.2);
    staffWorld(c, t, cam, { ground: '#2f7f7a', boardFn: function () { mentorBoard(ln(t, 0.2, 0.9)); }, sky: ['#aed0d4', '#eef0dc'], sun: 0.35, clock: [5, 5], winLight: 0.1, lights: 1, confCol: 'rgba(255,253,247,1)' }, {
      behind: function () { chairBack(c, MX, SEAT, MK, false, '#476c78'); },
      seated: function () {
        mentColleagues(c, t, false);
        var m = sit('meera', MX, MK, { face: 'worried', t: t, lean: 0.08 + 0.08 * lift, tilt: lerp(-0.05, 0.1, lift), look: t < 0.5 ? [0.9 * osc(t, 0.7), 0.2] : [0.45, 0.8],
          armL: ar(lerp(0.55, 0.6, lift), lerp(1.3, 1.5, lift)), armR: t < 0.5 ? ar(0.7 + 0.12 * osc(t, 2.2), 1.2 + 0.2 * osc(t, 2.2)) : ar(lerp(0.7, 0.65, lift), lerp(1.2, 1.45, lift)) }, false);
        if (lift > 0) listSheet(lerp(600, m.handR.x - 14, lift), lerp(716, m.handR.y - 40, lift), lerp(0.5, 0.78, lift), lerp(-0.05, -0.07, lift), 0, 41);
      },
      onTable: function () {
        if (t < 0.5) { var cc = C.ctx; cc.save(); cc.translate(600, 720); cc.transform(1, 0, -0.35, 0.5, 0, 0); cc.rotate(-0.04); listSheet(0, 0, 0.5, 0, 0, 41); cc.restore(); }
        MENT_X.forEach(function (x, i) { flat(x + 140, 712, 0.05 * (i - 1.5), function () { struggleSheet(74, 100, 41 + i); }); });
        chai(668, 733, 1.0, t, 0.1); chai(905, 733, 1.0, t, 0.3); chai(1075, 733, 1.0, t, 0.6); chai(1245, 733, 1.0, t, 0.9); pencil(740, 722, -0.2, 52);
      },
      front: function () {
        var sw = osc(t, 0.5);
        stand('sunanda', 1925, 962, 6.4, arms(ARM.down, { face: 'talk', t: t, lean: 0.04 * sw, tilt: 0.04 * sw, holdR: 'chalk', armR: ar(lerp(2.1, 2.35, sm(t, 0.2, 0.9)) + 0.08 * sw, 0.15), armL: ar(0.15, 0.2) }), true);
      }
    });
    C.banner('Staff room · 2027', 1236, 56, { size: 56, bg: '#fffdf7', fg: P.tealDark, rot: -0.025, p: lnT(t, 0, 0.3), seed: 9 });
  }
  function mentS2(c, t) {
    var cam = camOf(t, [{ t: B(2), x: 960, y: 540, z: 1.0 }, { t: B(5), x: 944, y: 540, z: 1.06, ease: 'linear' }], B(4));
    C.cardboard('#d9a933', 0.3);
    var hi = ln(t, B(4), B(4) + 0.3), realize = ln(t, B(4) - 0.1, B(4) + 0.3);
    C.withCam(cam, function () {
      burstBG(t, 560, 520, 'rgba(255,250,225,0.5)', 1);
      C.confetti(14, C.T12(t), 'rgba(140,42,42,1)', 8, [0, 60, 1920, 860]);
      var lp = lnT(t, B(2), B(2) + 0.25);
      C.popIn(1420, 560, lp, function () { listSheet(1420, 560, 2.5, 0.04, hi, 41, function (i) { return lnT(t, B(2) + 0.1 + i * 0.06, B(2) + 0.1 + i * 0.06 + 0.22); }); C.tape(1420, 262, 140, -0.08); });
      var o = CAST.withTake({ face: 'focused', t: t, tilt: 0.06 + 0.02 * osc(t, 0.5), lean: 0.01, look: [0.75, -0.55 + 1.2 * sm(t, B(2) + 0.1, B(4) - 0.2)] }, 'realize', t, B(4) - 0.3);
      if (t > B(4) + 0.2) o.look = [0.8, -0.4];
      bigFace('meera', 560, 505, 22, o);
      // a flare where the pop lands
      if (realize > 0 && realize < 1) { C.sunburst(1100, 330, 30, 130 + 120 * realize, 12, 'rgba(255,255,255,0.9)', 1 - realize, 0.2); }
    });
  }
  function mentS3(c, t) {
    var cam = camOf(t, CAM_MENT, B(6)), up = sm(t, B(5), 3.55), pinned = ln(t, B(6) - 0.06, B(6) + 0.1), settle = sm(t, B(6), B(6) + 0.3), mo = { pose: 'stand', flip: false, lean: 0.05 };
    var aUp = armTo('meera', 292, 962, MK, mo, 470, 290), aLow = [0.3, 0.3];
    staffWorld(c, t, cam, { ground: '#2f7f7a', boardFn: function () { mentorBoard(1); }, sky: ['#aed0d4', '#eef0dc'], sun: 0.35, clock: [5, 5], winLight: 0.1, lights: 1 }, {
      behind: function () { chairBack(c, MX, SEAT, MK, false, '#476c78'); },
      seated: function () { mentColleagues(c, t, true); },
      onTable: function () { MENT_X.forEach(function (x, i) { flat(x + 140, 712, 0.05 * (i - 1.5), function () { struggleSheet(74, 100, 41 + i); }); }); chai(668, 733, 1.0, t, 0.1); chai(905, 733, 1.0, t, 0.3); },
      front: function () {
        var m = stand('meera', 292, 962, MK, arms(ARM.down, { face: t < B(6) ? 'smile' : 'grin', t: t, lean: 0.05, tilt: 0.0, look: [0.8, -0.5], armL: ar(0.15, 0.2), armR: ar(lerp(aLow[0], aUp[0], up) - 0.15 * settle, lerp(aLow[1], aUp[1], up)) }), false);
        // the list travels from her hand to the notice board, then the pin pops in on the beat
        var lx = lerp(m.handR.x, 470, up), ly = lerp(m.handR.y + 60, 346, up);
        listSheet(lx, ly, 0.7 * lerp(1.12, 1, settle), lerp(0.1, 0.03, up), 1, 41); if (up > 0.9) C.markRing2(lx - 10 * 0.7, ly - 61 * 0.7, 60, 14, 1, { col: '#d0702a', w: 3 });
        if (pinned > 0) { var pu = C.back(pinned), cc = C.ctx; cc.save(); cc.translate(470, 346 - 118 * 0.7 + 7); cc.scale(pu, pu); cc.fillStyle = '#8c2a2a'; cc.beginPath(); cc.arc(0, 0, 6.4, 0, TAU); cc.fill(); cc.fillStyle = 'rgba(255,255,255,0.6)'; cc.beginPath(); cc.arc(-1.8, -2, 2, 0, TAU); cc.fill(); cc.restore(); }
      }
    });
    C.inkStamp('Mentor', 1330, 330, lnT(t, B(6) - 0.12, B(6) + 0.12), { size: 130, col: '#2f7f7a', bg: '#f4ecd8', rot: -0.1, seed: 7 });
  }
  function mentS4(c, t) {
    var cam = camOf(t, [{ t: B(7), x: 960, y: 540, z: 1.02 }, { t: B(10), x: 976, y: 540, z: 1.08, ease: 'linear' }]), pop = B(9);
    C.cardboard('#e0863e', 0.3);
    C.withCam(cam, function () {
      burstBG(t, 560, 520, 'rgba(255,248,225,0.45)', 1);
      C.confetti(21, C.T12(t), 'rgba(255,253,247,1)', 10, [0, 60, 1920, 860]);
      C.popIn(1420, 540, lnT(t, B(7), B(7) + 0.3), function () { corkBoard(1160, 200, 520, 640); listSheet(1420, 520, 1.85, 0.03, 1, 41); C.markRing2(1420 - 18, 520 - 113, 130, 28, 1, { col: '#8c2a2a', w: 5 }); });
      var o = CAST.withTake({ face: 'smile', t: t, tilt: 0.04 * osc(t, 0.6), lean: 0.01, look: [0.8, -0.3] }, 'joy', t, pop - 0.3);
      bigFace('meera', 560, 505, 22, o);
      burst(600, 430, t, pop, ['#fffdf7', '#2f7f7a', '#d9a933', '#8c2a2a'], 34, 4.2);
    });
    C.banner('Know each one', 1090, 118, { size: 64, bg: '#fffdf7', fg: P.tealDark, rot: -0.03, p: lnT(t, B(7), B(7) + 0.3), seed: 5 });
  }
  function drawMent(c, t) {
    if (t < B(2)) mentS1(c, t); else if (t < B(5)) mentS2(c, t); else if (t < B(7)) mentS3(c, t); else mentS4(c, t);
    cap(c, 'Meera learns a new job: *mentor*.', t, 0.3, 3.0);
    cap(c, 'Eight students. She\'ll know *each* one.', t, 3.2, 6.05);
  }

  /* ================= variant C: doubt desk (ban-retrain) =================
     S1 0-2 beats wide: sign, a queue, no screens · S2 2-5 two big faces, a pencil sketch, the student's realize take (beat 4)
     S3 5-7 the clock spins 4:00 to 8:10, evening falls, a stamp · S4 7-10 the last student leaves, Meera tired, then smiling. */
  var CAM_DOUBT = [
    { t: -1, x: 1012, y: 548, z: 0.98 }, { t: 0, x: 1000, y: 548, z: 1.0 }, { t: B(2), x: 960, y: 548, z: 1.05, ease: 'linear' },
    { t: B(5), x: 1150, y: 190, z: 2.2 }, { t: B(7), x: 1150, y: 184, z: 2.4, ease: 'linear' },
    { t: B(7), x: 700, y: 560, z: 1.12 }, { t: 8, x: 664, y: 560, z: 1.22, ease: 'linear' }
  ];
  function doubtS1(c, t) {
    var cam = camOf(t, CAM_DOUBT);
    staffWorld(c, t, cam, { ground: '#c9962f', wallFn: function () { hangSign(700, 188, 420, 160, t); }, doorFn: function () { noScreens(222, 478, 0.9); }, sky: ['#bcd9e6', '#f6e4b8'], sun: 0.7, clock: [4, 0], winLight: 0.09, lights: 1, confCol: 'rgba(255,253,247,1)' }, {
      behind: function () { chairBack(c, MX, SEAT, MK, false, '#476c78'); chairBack(c, 800, SEAT, CK, true, '#a1593f'); },
      seated: function () {
        sit('meera', MX, MK, { face: 'talk', t: t, lean: 0.06 + 0.02 * osc(t, 0.8), tilt: 0.04 * osc(t, 0.6), look: [0.8, 0.1], armL: ar(1.2, 0.85), armR: ar(1.35 + 0.1 * osc(t, 2.4), 0.55 + 0.1 * osc(t, 2.4)) }, false);
        sit('extra:1', 800, CK, arms(ARM.down, { face: 'worried', t: t + 0.5, look: [-0.7, 0.4], tilt: 0.04 * osc(t, 0.8), lean: 0.05, armL: ar(0.4, 1.2), armR: ar(0.45, 1.1) }), true);
      },
      onTable: function () { chai(660, 733, 1.0, t, 0.2); stackPapers(1060, 733, 100, 3, 8); pencil(900, 724, -0.12, 56); book(980, 704, 66, 26, '#8c2a2a', 12, 'NOTES'); },
      front: function () {
        // the queue: they shuffle forward one place on the beat
        [['extra:4', 1060], ['extra:5', 1200], ['extra:8', 1340]].forEach(function (q, i) {
          var sh = osc(t, 0.45, i * 2);
          stand(q[0], q[1] - 40 * sm(t, B(1), B(1) + 0.3), 962, 5.5 + 0.1 * i, arms(ARM.down, { face: i === 1 ? 'worried' : 'neutral', t: t + i, holdR: 'book', lean: 0.04 + 0.03 * sh, tilt: 0.04 * sh, look: [-0.9, 0.1], armL: ar(0.2, 0.3), armR: ar(0.8, 1.2) }), true);
        });
      }
    });
    C.banner('Staff room · 2027', 1236, 56, { size: 56, bg: '#fffdf7', fg: P.tealDark, rot: -0.025, p: lnT(t, 0, 0.3), seed: 9 });
  }
  function doubtS2(c, t) {
    var cam = camOf(t, [{ t: B(2), x: 960, y: 540, z: 1.0 }, { t: B(5), x: 944, y: 540, z: 1.06, ease: 'linear' }], B(4));
    C.cardboard('#d9a933', 0.3);
    var drawP = ln(t, B(2) + 0.25, 2.3), dbl = ln(t, 2.3, B(4) + 0.2);
    C.withCam(cam, function () {
      burstBG(t, 520, 520, 'rgba(255,250,225,0.5)', 1);
      C.confetti(31, C.T12(t), 'rgba(140,42,42,1)', 8, [0, 60, 1920, 860]);
      var nb = notebookPage(1010, 590, 2.2, -0.05, drawP, dbl), tip = nb.tip, hx = tip.x + 128, hy = tip.y + 168, mo = { pose: 'stand', flip: false, lean: 0.01 };
      var bp = bfPos(480, 500, 21, mo), aim = armTo('meera', bp.x, bp.y, 21, mo, hx, hy);
      bigFace('meera', 480, 500, 21, { face: 'talk', t: t, tilt: 0.04 * osc(t, 0.7), lean: 0.01, look: [0.8, 0.45], armR: aim, armL: ar(0.2, 0.2) });
      var ux = (hx - tip.x), uy = (hy - tip.y), ul = Math.hypot(ux, uy), bx = tip.x + ux / ul * 330, by = tip.y + uy / ul * 330;
      pencil(bx, by, Math.atan2(tip.y - by, tip.x - bx), 316);
      var so = CAST.withTake({ face: 'worried', t: t + 0.5, flip: true, tilt: 0.05 * osc(t, 0.8), lean: 0.01, look: [-0.7, 0.5] }, 'realize', t, B(4) - 0.3);
      bigFace('extra:1', 1580, 560, 15, so);
    });
  }
  function doubtS3(c, t) {
    var lapse = sm(t, B(5), B(6)), late = lapse, mins = lapse * (4 * 60 + 10), hh = 4 + Math.floor(mins / 60), mm = mins % 60;
    var cam = camOf(t, CAM_DOUBT, B(6));
    staffWorld(c, t, cam, { ground: mixc('#d9a933', '#27315c', late), sky: [mixc('#bcd9e6', '#16213f', late), mixc('#f6e4b8', '#e0794a', Math.min(1, late * 1.3))], sun: 0.7 * (1 - late), stars: late > 0.6 ? (late - 0.6) / 0.4 : 0,
      winLights: 'rgba(255,230,160,' + (0.2 + 0.5 * late) + ')', winPhoto: late > 0.5 ? (late - 0.5) * 1.6 : 0, clock: [hh, mm], winLight: 0.09 * (1 - late), tint: 'rgba(20,24,56,' + (0.34 * late) + ')', lights: 1,
      wallFn: function () { hangSign(700, 188, 420, 160, t); }, noMid: true }, {});
    C.inkStamp('8:10 pm', 1000, 700, lnT(t, B(6) - 0.12, B(6) + 0.12), { size: 150, col: '#fffdf7', bg: '#27315c', rot: -0.06, seed: 8 });
  }
  function doubtS4(c, t) {
    var cam = camOf(t, CAM_DOUBT), wk = sm(t, B(7), 5.25), sx = lerp(800, 226, wk), pop = B(9), gone = sm(t, 5.12, 5.3), sm9 = sm(t, pop, pop + 0.3);
    var mo = { face: t < pop ? 'tired' : 'smile', t: t, lean: 0.06 - 0.05 * sm9, tilt: 0.12 - 0.16 * sm9, look: t < pop ? [0.4, 0.5] : [-0.3, 0.1], squash: 0.05 * Math.sin(PI * ln(t, pop - 0.1, pop + 0.35)), lift: 8 * Math.sin(PI * ln(t, pop, pop + 0.3)),
      armL: ar(0.25, 1.1), armR: t < B(8) + 0.5 ? ar(0.3, 0.9) : ar(2.5 * sm(t, B(8) + 0.5, B(8) + 0.8) * (1 - sm(t, B(9) + 0.2, B(9) + 0.5)) + 0.3, 0.3) };
    staffWorld(c, t, cam, { ground: '#27315c', sky: ['#16213f', '#e0794a'], sun: 0, stars: 1, winLights: 'rgba(255,230,160,0.7)', winPhoto: 0.8, clock: [8, 10], winLight: 0, tint: 'rgba(20,24,56,0.34)', lights: 1,
      wallFn: function () { hangSign(700, 188, 420, 160, t); }, doorFn: function () { noScreens(222, 478, 0.9); }, door: sm(t, 4.85, 5.2) * (1 - sm(t, 5.7, 6.1)) }, {
      behind: function () { chairBack(c, MX, SEAT, MK, false, '#476c78'); chairBack(c, 800, SEAT, CK, true, '#a1593f'); },
      seated: function () { sit('meera', MX, MK, mo, false); },
      onTable: function () { chai(660, 733, 1.0, t, 0.2); stackPapers(1060, 733, 100, 3, 8); pencil(900, 724, -0.12, 56); },
      front: function () {
        stand('extra:1', sx, 962, CK, arms(ARM.down, { face: 'smile', t: t, pose: t > B(7) && t < 5.3 ? 'walk' : 'stand', walk: (t - B(7)) * 6, holdR: 'bag', armL: ar(0.1, 0.1), armR: ar(0.5, 0.2), look: [-0.4, 0], alpha: 1 - gone }), true);
      }
    });
  }
  function drawDoubt(c, t) {
    if (t < B(2)) doubtS1(c, t); else if (t < B(5)) doubtS2(c, t); else if (t < B(7)) doubtS3(c, t); else doubtS4(c, t);
    cap(c, 'No screens. More teachers, more *hours*.', t, 0.3, 3.0);
    cap(c, 'Meera now stays till *eight*.', t, 3.2, 6.05);
  }

  /* ---- sound: local times, every visible event (animotion rule) ---- */
  // a paper swish leading into each hard cut and a sharp clack on it, so the cut lands on a strong onset on the beat
  function cutsFx(e) { [2, 5, 7].forEach(function (n) { e.push([B(n) - 0.1, 'swish'], [B(n), 'clack']); }); }
  function evStaff(road) {
    var e = [[0.0, 'swish']], i; cutsFx(e);
    if (road.c2 === 'cut') {
      for (i = 0; i < 12; i++) e.push([0.05 + i * 0.04, 'popLow', i]);
      e.push([B(2) + 0.04, 'pop'], [B(4) - 0.45, 'whooshIn'], [B(4), 'clank'], [3.45, 'rip'], [3.3, 'whooshIn'], [3.75, 'clank']);
      for (i = 0; i < 12; i++) e.push([3.93 + i * 0.04, 'popLow', i % 8]);
      e.push([4.75, 'step'], [5.05, 'step'], [5.3, 'step'], [B(8), 'creak']);
    } else if (road.c1 === 'build') {
      e.push([0.4, 'click'], [0.62, 'click'], [0.85, 'click']);
      e.push([B(2) + 0.12, 'popLow', 2]); for (i = 1; i < 8; i++) e.push([B(2) + 0.1 + i * 0.06, 'click']);
      e.push([B(4), 'pop'], [B(4) + 0.08, 'ding'], [3.3, 'whooshIn'], [B(6), 'clank'], [B(6) + 0.02, 'click'], [B(7) + 0.05, 'pop'], [B(9), 'boing'], [B(9) + 0.05, 'zip', 3]);
    } else {
      e.push([0.78, 'step'], [B(2) + 0.35, 'click'], [B(2) + 0.62, 'click'], [B(2) + 0.9, 'click'], [B(4), 'pop']);
      for (i = 0; i < 6; i++) e.push([B(5) + 0.02 + i * 0.1, 'tick']);
      e.push([3.3, 'whooshIn'], [B(6), 'clank'], [4.55, 'step'], [4.85, 'step'], [5.1, 'step'], [4.85, 'creak'], [B(9), 'pop']);
    }
    return e.sort(function (a, b) { return a[0] - b[0]; });
  }
  PLACES.staffroom = { dur: B(10), year: 2027, events: evStaff, draw: function (ctx, t, road) {
    C.use(ctx);
    if (road.c2 === 'cut') drawCut(ctx, t); else if (road.c1 === 'build') drawMent(ctx, t); else drawDoubt(ctx, t);
  } };

  /* ================= PLACES.meera32 · Meera's flat in Kothrud (cut roads) =================
     Warm tungsten evening. A paper diorama on a burnt-amber cardboard ground: BACK (wall sheet, periodic-table poster, pooja
     shelf, window with Pune dusk, kitchen door, ceiling fan, pendant lamp), ACTION (floor, dhurrie, the front door and
     hand-painted board, shoe rack, the dining table, chairs and students), NEAR (marigold petals). World: wall base y = 700;
     door x 90-290; painted board 330-600; Meera at x 660; dining table x 800-1660; students at x 880 + 140 i (facing her). */
  var FL = { wall: '#f4dcae', floor: '#b87a4c', teak: '#7e4a2c' };
  var STUD = ['extra:0', 'extra:1', 'extra:4', 'extra:5', 'extra:8', 'extra:9'], STX = [880, 1020, 1160, 1300, 1440, 1580];
  var BACKROW = [['extra:12', 950], ['extra:13', 1230], ['extra:16', 1510]];

  function paintedBoard(x, y, k, rot, t) {
    var c = C.ctx; t = C.T12(t || 0); c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(k, k);
    sheet(-150, -75, 300, 150, '#fbf3da', 101, { rough: 2, lift: 9, blur: 16, dots: 1, dotCol: 'rgba(120,90,30,0.1)' });
    c.strokeStyle = '#7a4a2a'; c.lineWidth = 8; c.strokeRect(-142, -67, 284, 134);
    for (var i = 0; i < 15; i++) { var fx = -140 + i * 20, fy = -76 + 4 * Math.sin(i * 1.3 + (t || 0) * 1.4); c.fillStyle = i % 2 ? '#e0863e' : '#f0b429'; c.beginPath(); c.arc(fx, fy, 10, 0, TAU); c.fill(); c.fillStyle = '#c2531f'; c.beginPath(); c.arc(fx, fy, 3.6, 0, TAU); c.fill(); }
    txt('Meera ma\'am', 1.6, -16, 56, '#7a1f12', { align: 'center', weight: 800, maxW: 258 }); txt('Meera ma\'am', 0, -18, 56, '#c2331f', { align: 'center', weight: 800, maxW: 258 });
    txt('Chemistry tuitions', 0, 32, 38, '#1f4c93', { align: 'center', weight: 800, maxW: 258 });
    txt('Batch 7 – 9 pm · Std 9 – 12', 0, 58, 17, '#4a3a2a', { align: 'center', weight: 700 });
    c.restore();
  }
  function ganpati(x, y, k, t) {
    var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = '#b9773e'; c.fillRect(-42, -16, 84, 16); c.fillStyle = '#e7a8b8'; c.beginPath(); c.ellipse(0, -16, 46, 8, 0, 0, TAU); c.fill();
    c.fillStyle = '#d9542f'; c.beginPath(); c.ellipse(0, -62, 30, 40, 0, 0, TAU); c.fill();
    c.fillStyle = '#e8683b'; [-1, 1].forEach(function (s) { c.beginPath(); c.ellipse(s * 28, -114, 15, 19, s * 0.2, 0, TAU); c.fill(); });
    c.beginPath(); c.ellipse(0, -112, 21, 20, 0, 0, TAU); c.fill();
    c.fillStyle = '#e0a82e'; c.beginPath(); c.moveTo(-18, -128); c.lineTo(-10, -152); c.lineTo(0, -140); c.lineTo(10, -152); c.lineTo(18, -128); c.closePath(); c.fill();
    c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(-8, -114, 2.4, 0, TAU); c.arc(8, -114, 2.4, 0, TAU); c.fill();
    c.strokeStyle = '#d9542f'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -106); c.quadraticCurveTo(-4, -78, -20, -72); c.stroke();
    c.strokeStyle = '#e8683b'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -106); c.quadraticCurveTo(-4, -78, -20, -72); c.stroke();
    c.fillStyle = '#f6efe0'; c.beginPath(); c.moveTo(8, -104); c.lineTo(14, -90); c.lineTo(5, -98); c.closePath(); c.fill();
    c.strokeStyle = '#f0b429'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-26, -86); c.quadraticCurveTo(0, -62, 26, -86); c.stroke();
    c.restore();
  }
  function diya(x, y, t, k) {
    var c = C.ctx; k = k || 1; var h = 22 + 5 * Math.sin(t * 11) + 3 * Math.sin(t * 17.3);
    glow(x, y - 20 * k, 90 * k, 'rgba(255,200,90,A)', 0.55);
    c.save(); c.translate(x, y); c.scale(k, k); c.fillStyle = '#c9962f'; c.beginPath(); c.moveTo(-17, -9); c.quadraticCurveTo(0, 6, 17, -9); c.lineTo(11, 0); c.lineTo(-11, 0); c.closePath(); c.fill();
    c.fillStyle = '#ffd36a'; c.beginPath(); c.moveTo(0, -10 - h); c.quadraticCurveTo(10, -10 - h * 0.35, 0, -8); c.quadraticCurveTo(-10, -10 - h * 0.35, 0, -10 - h); c.fill();
    c.fillStyle = '#fff3c4'; c.beginPath(); c.ellipse(0, -14, 3, 6, 0, 0, TAU); c.fill(); c.restore();
  }
  function calendarSheet(x, y) {
    var c = C.ctx; c.save(); c.translate(x, y); c.rotate(0.02);
    sheet(-50, 0, 100, 150, '#fffdf3', 111, { rough: 1.2, lift: 6, blur: 10 }); c.fillStyle = '#c2331f'; c.fillRect(-50, 0, 100, 42);
    txt('ऑक्टोबर', 0, 21, 22, '#fff6df', { font: C.FONTS.deva, up: false, align: 'center', weight: 400 });
    txt('१५', 0, 92, 62, '#2a2622', { font: C.FONTS.deva, up: false, align: 'center', weight: 400 }); txt('२०३२', 0, 134, 20, '#6a5a4a', { font: C.FONTS.deva, up: false, align: 'center', weight: 400 });
    c.fillStyle = '#c9ccc4'; c.beginPath(); c.arc(0, -4, 4, 0, TAU); c.fill(); c.restore();
  }
  function periodicPoster(x, y, k) {
    var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k); sheet(0, 0, 300, 188, '#fbf6e6', 121, { rough: 1.6, lift: 7, blur: 12 });
    txt('Periodic table of the elements', 150, 15, 17, '#2a2622', { align: 'center', weight: 800, maxW: 270 });
    var cols = ['#e2664f', '#e0863e', '#d9a933', '#7bb06e', '#2f7f7a', '#8f6fb0', '#4b6fa8'];
    for (var r = 0; r < 9; r++) for (var q = 0; q < 18; q++) {
      var on = false;
      if (r === 0) on = q === 0 || q === 17; else if (r === 1 || r === 2) on = q < 2 || q > 11; else if (r < 7) on = true; else on = q > 1 && q < 16;
      if (!on) continue;
      var col = q === 0 ? cols[0] : q === 1 ? cols[1] : q === 17 ? cols[6] : q === 16 ? cols[5] : q < 12 ? cols[2] : q < 14 ? cols[3] : cols[4];
      c.fillStyle = col; c.fillRect(10 + q * 15.6, 30 + r * 16.2 + (r >= 7 ? 8 : 0), 13.6, 14);
    }
    c.restore();
  }
  function pendantLamp(t, x) {
    var c = C.ctx, sw = osc(C.T12(t), 0.2) * 0.012; glow(x, 300, 430, 'rgba(255,196,110,A)', 0.4);
    c.save(); c.translate(x, 70); c.rotate(sw); c.strokeStyle = '#3a2a1c'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 170); c.stroke();
    c.beginPath(); c.moveTo(-14, 170); c.lineTo(14, 170); c.lineTo(88, 262); c.lineTo(-88, 262); c.closePath(); c.fillStyle = '#d6a65e'; c.shadowColor = 'rgba(40,25,10,0.3)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fill(); c.shadowColor = 'transparent';
    c.save(); c.clip(); c.strokeStyle = 'rgba(110,70,20,0.45)'; c.lineWidth = 2; for (var i = -100; i < 100; i += 14) { c.beginPath(); c.moveTo(i, 168); c.lineTo(i * 1.8, 264); c.stroke(); c.beginPath(); c.moveTo(i + 14, 168); c.lineTo(i * 1.8 - 25, 264); c.stroke(); } c.restore();
    c.fillStyle = '#fff2c0'; c.beginPath(); c.ellipse(0, 262, 80, 8, 0, 0, TAU); c.fill(); c.restore();
  }
  function steelPlates(x, y, n) { var c = C.ctx; for (var i = 0; i < n; i++) { var yy = y - i * 7; c.fillStyle = '#9ea7ac'; c.beginPath(); c.ellipse(x, yy + 3, 46, 10, 0, 0, TAU); c.fill(); c.fillStyle = '#d9dfe2'; c.beginPath(); c.ellipse(x, yy, 46, 10, 0, 0, TAU); c.fill(); c.fillStyle = '#c1c9cd'; c.beginPath(); c.ellipse(x, yy, 32, 6.4, 0, 0, TAU); c.fill(); } c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(x - 14, y - (n - 1) * 7 - 2, 14, 2.6, -0.2, 0, TAU); c.fill(); }
  function tumbler(x, y, k) { var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k); c.fillStyle = '#c3cacd'; c.beginPath(); c.moveTo(-12, -40); c.lineTo(12, -40); c.lineTo(9.5, 0); c.lineTo(-9.5, 0); c.closePath(); c.fill(); c.fillStyle = '#eef2f3'; c.fillRect(-9, -38, 4, 34); c.fillStyle = '#9ba5a9'; c.fillRect(-12, -40, 24, 3.5); c.restore(); }
  function dabba(x, y, k) { var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k); c.fillStyle = '#b9c2c6'; c.fillRect(-26, -38, 52, 38); c.fillStyle = '#d9e0e3'; c.fillRect(-26, -38, 10, 38); c.fillStyle = '#9ba5a9'; c.fillRect(-28, -44, 56, 8); c.fillStyle = '#6a7478'; c.fillRect(-6, -50, 12, 6); c.restore(); }
  function shoeRack(x, y) {
    var c = C.ctx; sheet(x, y - 120, 190, 120, '#8a5a35', 131, { rough: 1.4, lift: 6, blur: 12 }); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 8, y - 80, 174, 5); c.fillRect(x + 8, y - 40, 174, 5);
    [[16, y - 82, '#2f7f7a'], [64, y - 82, '#e2664f'], [112, y - 82, '#3a4f6a'], [28, y - 42, '#d9a933'], [86, y - 42, '#8c2a2a'], [142, y - 42, '#4b6fa8']].forEach(function (s) { c.fillStyle = s[2]; c.beginPath(); c.ellipse(x + s[0] + 20, s[1] - 6, 22, 7, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x + s[0] + 10, s[1] - 13, 18, 3); });
  }
  function dhurrie(x, y, w, h) {
    var poly = C.tornRect2(x, y, w, h, 141, 3, 'lr'); rimPoly(poly, 7); C.paperPiece(poly, '#d9a933', { shadow: false, grain: 0.25 });
    var c = C.ctx; c.save(); C.path(poly); c.clip(); var cols = ['#8c2a2a', '#2f7f7a', '#fbf3da', '#e0863e']; for (var i = 0; i < 9; i++) { c.fillStyle = cols[i % 4]; c.fillRect(x, y + 10 + i * (h / 9.4), w, h / 18); } c.fillStyle = 'rgba(0,0,0,0.15)'; for (var j = 0; j < w; j += 16) c.fillRect(x + j, y, 3, h); c.restore();
  }
  function flatBackdrop(c, t, o) {
    var W0 = -900, WW = 4600;
    panel(W0, 70, WW, 780, FL.wall, 203, { rough: 8, sides: 'tb', dots: 'rgba(180,120,40,1)', dotA: 0.16, vg: ['rgba(255,235,190,0.2)', 'rgba(90,40,10,0.18)'] });
    // window with the Pune dusk, marigold curtains
    sheet(1396, 150, 340, 372, '#6a4a30', 211, { rough: 2, lift: 8, blur: 14 });
    windowView(1410, 164, 312, 344, t, o.sky || ['#2e3a78', '#e89a6a'], { sun: 0.0, far: '#5a4f8a', mid: '#46427a', near: '#322d5e', win: 'rgba(255,214,130,0.75)', stars: 0.5, crow: false });
    grill(1410, 164, 312, 344, '#2a2230');
    sheet(1386, 150, 70, 380, '#e0863e', 212, { rough: 2, lift: 7, blur: 12, dots: 1, dotCol: 'rgba(120,50,10,0.18)' }); sheet(1676, 150, 70, 380, '#e0863e', 213, { rough: 2, lift: 7, blur: 12, dots: 1, dotCol: 'rgba(120,50,10,0.18)' });
    // pooja shelf: Ganpati and a diya
    sheet(880, 372, 330, 24, '#6b4326', 221, { rough: 1.4, lift: 7, blur: 12 }); ganpati(1010, 372, 0.72, t); diya(1130, 372, t, 0.9); diya(920, 372, t + 1, 0.7);
    for (var i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#e0863e' : '#f0b429'; c.beginPath(); c.arc(884 + i * 28, 404 + 7 * Math.sin(i * 1.1 + t * 1.2), 8, 0, TAU); c.fill(); }
    calendarSheet(1290, 160);
    periodicPoster(330, 170, 1.0);
    // family photos
    [[110, 130, 70, 86], [196, 150, 60, 74]].forEach(function (f, i) { sheet(f[0], f[1], f[2], f[3], '#7a4a2a', 231 + i, { rough: 1, lift: 5, blur: 9 }); sheet(f[0] + 7, f[1] + 7, f[2] - 14, f[3] - 14, i ? '#c9a07a' : '#9fb3bd', 241 + i, { rough: 0.8, edge: false, shadow: false }); c.fillStyle = 'rgba(60,40,30,0.55)'; c.beginPath(); c.arc(f[0] + f[2] / 2, f[1] + f[3] * 0.42, 9, 0, TAU); c.fill(); c.fillRect(f[0] + f[2] / 2 - 13, f[1] + f[3] * 0.55, 26, 20); });
    // kitchen doorway on the right: a bright room with steel containers and a pressure cooker, steam rising
    sheet(1790, 200, 300, 520, '#6b4326', 251, { rough: 2, lift: 8, blur: 14 }); sheet(1806, 216, 268, 488, '#fff0c8', 252, { rough: 1.2, edge: false, shadow: false, vg: ['rgba(255,255,255,0.2)', 'rgba(150,100,40,0.2)'] });
    sheet(1830, 330, 190, 14, '#8a5a35', 253, { rough: 1, lift: 4, blur: 8, edge: false }); for (var d = 0; d < 4; d++) dabba(1856 + d * 48, 330, 0.8 + 0.08 * (d % 2));
    sheet(1816, 560, 250, 22, '#6b4326', 254, { rough: 1, lift: 5, blur: 8, edge: false });
    c.fillStyle = '#c3cacd'; c.beginPath(); c.ellipse(1930, 548, 52, 20, 0, 0, TAU); c.fill(); c.fillRect(1878, 500, 104, 48); c.fillStyle = '#9ba5a9'; c.fillRect(1878, 500, 104, 10); c.fillStyle = '#2a2622'; c.fillRect(1986, 512, 36, 8); c.fillRect(1930 - 6, 478, 12, 22);
    steam(1930, 474, t, 90, 0.2, 0.7);
    fan(900, 196, 150, t, 5.2);
    pendantLamp(t, 1060);
  }
  function flatFloor(c, o) {
    var W0 = -900, WW = 4600, poly = panel(W0, 700, WW, 340, FL.floor, 261, { rough: 5, sides: 'tb', rim: 10, vg: ['rgba(255,220,160,0.0)', 'rgba(60,25,5,0.3)'] });
    c.save(); C.path(poly); c.clip(); c.strokeStyle = 'rgba(70,30,5,0.22)'; c.lineWidth = 2.5; for (var gy = 0; gy < 6; gy++) { var yy = 704 + Math.pow(gy / 5, 1.6) * 330 + 22 * gy; c.beginPath(); c.moveTo(W0, yy); c.lineTo(W0 + WW, yy); c.stroke(); } for (var gx = -14; gx <= 14; gx++) { c.beginPath(); c.moveTo(1040 + gx * 70, 704); c.lineTo(1040 + gx * 250, 1060); c.stroke(); } c.restore();
    c.fillStyle = '#5a3a22'; c.fillRect(W0, 694, WW, 14);
    dhurrie(760, 850, 960, 150);
  }
  function flatDoor(c) {
    sheet(78, 232, 236, 484, '#4a2b16', 271, { rough: 2, lift: 6, blur: 12 }); sheet(92, 246, 208, 458, '#7e4a2c', 272, { rough: 1.4, edge: false, shadow: false, vg: ['rgba(255,255,255,0.08)', 'rgba(30,10,0,0.25)'] });
    [[104, 260], [104, 450]].forEach(function (p) { sheet(p[0], p[1], 184, 170, 'rgba(60,28,10,0.35)', 273 + p[1], { rough: 1, edge: false, shadow: false }); });
    c.fillStyle = '#d6a64a'; c.beginPath(); c.arc(274, 500, 9, 0, TAU); c.fill(); c.fillStyle = '#d6a64a'; c.fillRect(262, 470, 12, 60);
    sheet(120, 160, 140, 54, '#fbf3da', 281, { rough: 1.2, lift: 4, blur: 8 }); txt('कोथरूड', 190, 188, 34, '#2a2622', { font: C.FONTS.deva, up: false, align: 'center', weight: 400 });
  }
  function diningTable(c) {
    var x0 = 800, x1 = 1660, top = 684, edge = 736;
    shape([[x0 + 18, top], [x1 - 18, top], [x1 + 6, edge], [x0 - 6, edge]], '#8a5230', { lift: 7, blur: 12, dots: 1, dotCol: 'rgba(0,0,0,0.12)', vg: ['rgba(255,220,160,0.12)', 'rgba(0,0,0,0.05)'] });
    shape([[x0 + 120, top + 4], [x1 - 120, top + 4], [x1 - 106, edge - 6], [x0 + 106, edge - 6]], '#f4e6c4', { shadow: false, edge: false });
    c.strokeStyle = '#c2331f'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + 120, top + 8); c.lineTo(x1 - 120, top + 8); c.moveTo(x0 + 108, edge - 10); c.lineTo(x1 - 108, edge - 10); c.stroke();
  }
  function diningTableFront(c) {
    var x0 = 800, x1 = 1660, edge = 736;
    c.save(); var g = c.createLinearGradient(0, 800, 0, 1010); g.addColorStop(0, 'rgba(40,15,0,0.34)'); g.addColorStop(1, 'rgba(40,15,0,0)'); c.fillStyle = g; c.fillRect(x0 - 20, 800, x1 - x0 + 60, 210); c.restore();
    c.fillStyle = '#5a3118'; [x0 + 16, x1 - 40].forEach(function (lx) { c.fillRect(lx, 780, 24, 180); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(lx + 3, 780, 5, 180); c.fillStyle = '#5a3118'; });
    sheet(x0 + 24, edge + 28, x1 - x0 - 48, 34, '#6e3d20', 291, { rough: 1.2, lift: 5, blur: 10, edge: false });
    sheet(x0 - 8, edge, x1 - x0 + 16, 30, '#9a6038', 292, { rough: 1.2, lift: 6, blur: 12, dots: 1, dotCol: 'rgba(0,0,0,0.08)' });
  }
  // wooden dining chair behind a seated student
  function flatChair(c, x, hipY, k, flip) { chairBack(c, x, hipY, k, flip, '#a0662f'); }
  function vidyaBag(x, y, k) { var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k); sheet(-22, 0, 44, 52, '#2f7f7a', 301, { rough: 1, lift: 4, blur: 8, edgeW: 4 }); c.strokeStyle = '#1d5552'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 14, PI, 0); c.stroke(); txt('Vidya', 0, 30, 15, '#f6f1e3', { align: 'center', weight: 800 }); c.restore(); }
  // the diorama through a camera
  function flatWorld(c, t, cam, o, H) {
    C.cardboard(o.ground || '#c9772f', 0.35);
    lay(cam, 0.55, function () { flatBackdrop(c, t, o); });
    lay(cam, 1.0, function () {
      flatFloor(c, o); flatDoor(c);
      sheet(318, 330, 290, 170, '#7a4a2a', 311, { rough: 1.5, lift: 8, blur: 14 }); paintedBoard(463, 415, 0.9, 0.0, t);
      shoeRack(100, 1000);
      if (H.behind) H.behind();
      diningTable(c);
      if (H.seated) H.seated();
      diningTableFront(c);
      if (H.onTable) H.onTable();
      if (H.front) H.front();
    });
    lay(cam, 1.5, function () { C.confetti(o.confSeed || 9, C.T12(t), 'rgba(240,160,40,1)', 7, [-200, 100, 2400, 800]); });
    // tungsten: warm light round the pendant lamp, the corners fall into brown shadow
    var lp = w2s(cam, 1060, 280); c.save(); var g = c.createRadialGradient(lp.x, lp.y + 120 * cam.z, 60, lp.x, lp.y + 120 * cam.z, 1250 * Math.max(0.8, cam.z));
    g.addColorStop(0, 'rgba(255,205,120,0.2)'); g.addColorStop(0.45, 'rgba(255,170,70,0.05)'); g.addColorStop(1, 'rgba(50,20,5,0.42)'); c.fillStyle = g; c.fillRect(0, 0, 1920, 1080); c.restore();
  }

  /* ================= variant F: the flat (build-cut, ban-cut) =================
     S1 0-2 beats wide: six students and their chairs pop in round the dining table, Meera teaches
     S2 2-5 big face on cardboard: proud, determined (a resolve take on beat 4), her hand-painted board behind
     S3 5-7 the table: build-cut rings the two who came from Vidya, ban-cut the crowd grows; a stamp on beat 6
     S4 7-10 a pull-out to the whole flat. */
  var CAM_FLAT = [
    { t: -1, x: 1024, y: 545, z: 0.98 }, { t: 0, x: 1010, y: 545, z: 1.0 }, { t: B(2), x: 990, y: 545, z: 1.05, ease: 'linear' },
    { t: B(5), x: 1020, y: 556, z: 1.3 }, { t: B(7), x: 1290, y: 556, z: 1.3, ease: 'linear' },
    { t: B(7), x: 1240, y: 552, z: 1.3 }, { t: B(10), x: 1010, y: 545, z: 1.02, ease: 'out' }, { t: 8, x: 1006, y: 545, z: 1.0, ease: 'linear' }
  ];
  var FMX = 660;
  function flatStudents(c, t, pops, back, vidya) {
    var K = 5.3, FAC = { 0: 'neutral', 1: 'smile', 2: 'neutral', 3: 'smile', 4: 'neutral', 5: 'smile' };
    // back row first (ban-cut: three more pop in beside the stamp)
    if (back) BACKROW.forEach(function (q, i) {
      var p = lnT(t, B(6) + 0.02 + i * 0.08, B(6) + 0.02 + i * 0.08 + 0.25); if (p <= 0) return;
      C.popIn(q[1], 560, p, function () { chairBack(c, q[1], 740, 4.9, true, '#a0662f'); CAST.draw(C.ctx, q[0], q[1], 740, 490, { pose: 'sit', flip: true, face: 'smile', t: t + i, look: [-0.8, 0.2], armL: ar(0.4, 1.2), armR: ar(0.45, 1.1) }); });
    });
    STUD.forEach(function (who, i) {
      var p = pops ? lnT(t, 0.05 + i * 0.08, 0.05 + i * 0.08 + 0.25) : 1; if (p <= 0) return;
      C.popIn(STX[i], 640, p, function () {
        flatChair(c, STX[i], SEAT, K, true);
        var take = i === 2 ? CAST.withTake({ face: 'neutral', t: t + i, look: [-0.8, 0.4], tilt: 0.04 * osc(t, 0.6, i), flip: true, pose: 'sit' }, 'realize', t, B(6) - 0.3) : null;
        var o = take || { pose: 'sit', flip: true, face: FAC[i], t: t + i, look: [-0.85, 0.3], tilt: 0.05 * osc(t, 0.5, i), armL: ar(0.4, 1.2), armR: ar(0.55 + 0.05 * osc(t, 1.3, i), 1.1) };
        if (take) { take.armL = ar(0.4, 1.2); take.armR = ar(0.55, 1.1); }
        CAST.draw(C.ctx, who, STX[i], SEAT, K * 100, o);
      });
    });
  }
  function flatOnTable(c, t, vid) {
    STX.forEach(function (x, i) { flat(x - 40, 712, 0.05 * (i - 2.5), function () { C.ctx.fillStyle = ['#2f7f7a', '#e0863e', '#4b6fa8', '#e2664f', '#8c2a2a', '#d9a933'][i]; C.ctx.fillRect(-32, -22, 64, 44); C.ctx.fillStyle = 'rgba(255,255,255,0.3)'; C.ctx.fillRect(-26, -16, 52, 6); }); });
    if (t > -9 && vid) [1, 3].forEach(function (i) { vidyaBag(STX[i] - 36, 654, 1.15); });
    steelPlates(842, 718, 4); tumbler(1090, 728, 1.0); tumbler(1370, 728, 1.0); dabba(1230, 726, 0.9); steam(1230, 666, t, 50, 0.4, 0.45);
  }
  function flatS1(c, t, road) {
    var cam = camOf(t, CAM_FLAT), vid = road.c1 === 'build';
    flatWorld(c, t, cam, {}, {
      behind: function () { },
      seated: function () { flatStudents(c, t, true, false, vid); },
      onTable: function () { flatOnTable(c, t, vid); },
      front: function () {
        var s = osc(t, 0.7);
        stand('meera', FMX, 962, MK, arms(ARM.down, { face: 'talk', t: t, lean: 0.04, tilt: 0.04 * s, holdR: 'chalk', look: [0.8, 0.0], armL: ar(0.12, 0.2), armR: ar(2.3 + 0.3 * s, 0.5 + 0.3 * s) }), false);
      }
    });
    C.banner('Kothrud · 2032', 1236, 56, { size: 56, bg: '#fffdf7', fg: P.tealDark, rot: -0.025, p: lnT(t, 0, 0.3), seed: 9 });
  }
  function flatS2(c, t) {
    var cam = camOf(t, [{ t: B(2), x: 960, y: 540, z: 1.0 }, { t: B(5), x: 944, y: 540, z: 1.06, ease: 'linear' }], B(4));
    C.cardboard('#2f3a78', 0.35);
    C.withCam(cam, function () {
      burstBG(t, 540, 520, 'rgba(255,176,70,0.3)', 1);
      C.confetti(41, C.T12(t), 'rgba(240,160,40,1)', 10, [0, 60, 1920, 860]);
      C.popIn(1440, 540, lnT(t, B(2), B(2) + 0.3), function () { paintedBoard(1440, 540, 2.5, 0.03, t); });
      var pre = t < B(4) - 0.4;
      var o = CAST.withTake({ face: pre ? 'talk' : 'focused', t: t, tilt: 0.03 * osc(t, 0.6), lean: 0.01, look: [0.75, -0.1] }, 'resolve', t, B(4) - 0.32);
      if (t > 2.95) { o.face = 'smile'; o.tilt = -0.05; o.look = [0.6, -0.25]; }
      bigFace('meera', 540, 500, 22, o);
    });
  }
  function flatS3(c, t, road) {
    var cam = camOf(t, CAM_FLAT, B(6)), build = road.c1 === 'build';
    flatWorld(c, t, cam, {}, {
      seated: function () { flatStudents(c, t, false, !build, build); },
      onTable: function () { flatOnTable(c, t, build); },
      front: function () { stand('meera', FMX, 962, MK, arms(ARM.down, { face: 'smile', t: t, lean: 0.03, tilt: -0.04, holdR: 'chalk', look: [0.8, 0], armL: ar(0.12, 0.2), armR: ar(2.1, 0.5) }), false); }
    });
    if (build) [[1, 3.55], [3, 3.7]].forEach(function (q) { var a = w2s(cam, STX[q[0]] + 6, 560); C.markRing2(a.x, a.y + 14, 72 * cam.z, 92 * cam.z, lnT(t, q[1], q[1] + 0.3), { col: '#e0863e', w: 8 }); });
    C.inkStamp(build ? '6 students' : 'Batch of 9', 960, 190, lnT(t, B(6) - 0.12, B(6) + 0.12), { size: 120, col: '#fffdf7', bg: '#8c2a2a', rot: -0.07, seed: 12 });
  }
  function flatS4(c, t, road) {
    var cam = camOf(t, CAM_FLAT), build = road.c1 === 'build', s = osc(t, 0.6);
    flatWorld(c, t, cam, {}, {
      seated: function () { flatStudents(c, t, false, !build, build); },
      onTable: function () { flatOnTable(c, t, build); },
      front: function () { stand('meera', FMX, 962, MK, arms(ARM.down, { face: 'smile', t: t, lean: 0.03, tilt: -0.04 + 0.02 * s, holdR: 'chalk', look: [0.8, 0], armL: ar(0.12, 0.2), armR: ar(2.2 + 0.2 * s, 0.5 + 0.2 * s) }), false); }
    });
  }
  function drawFlat(c, t, road) {
    if (t < B(2)) flatS1(c, t, road); else if (t < B(5)) flatS2(c, t); else if (t < B(7)) flatS3(c, t, road); else flatS4(c, t, road);
    cap(c, '2032. Meera teaches at her dining *table*.', t, 0.3, 3.0);
    cap(c, road.c1 === 'build' ? 'Six students. Two came from *Vidya*.' : 'Her batch is bigger than her old Vidya *class*.', t, 3.2, 6.05);
  }

  /* ================= variant E: late evening at Vidya (ban-retrain) =================
     The 2027 staff room, five years on: golden hour in the window, half the tube lights off, the faculty board with three
     gaps, three empty chairs with name cards, a farewell card. Meera still sits with her mentee group.
     S1 0-2 wide: three empty chairs pop in · S2 2-5 big face, three names pop up, a laugh take (beat 4)
     S3 5-7 the empty chairs and the farewell card, a stamp on beat 6 · S4 7-10 she sags (beat 8), then smiles (beat 9). */
  var ECAM = [
    { t: -1, x: 1012, y: 548, z: 0.98 }, { t: 0, x: 1000, y: 548, z: 1.0 }, { t: B(2), x: 1030, y: 548, z: 1.05, ease: 'linear' },
    { t: B(5), x: 1230, y: 596, z: 1.5 }, { t: B(7), x: 1330, y: 596, z: 1.5, ease: 'linear' },
    { t: B(7), x: 740, y: 585, z: 1.32 }, { t: B(10), x: 690, y: 580, z: 1.5, ease: 'linear' }, { t: 8, x: 680, y: 578, z: 1.55, ease: 'linear' }
  ];
  var EMPTY = [[1250, 'A. IYER', '#6b7b46'], [1420, 'R. PATIL', '#a1593f'], [1590, 'S. NENE', '#476c78']], MENTEES = [['extra:1', 720], ['extra:4', 850], ['extra:9', 980]];
  function placard(x, y, name) { var c = C.ctx; shape([[x - 36, y], [x + 36, y], [x + 31, y - 32], [x - 31, y - 32]], '#fffdf6', { lift: 3, blur: 6, edgeW: 4 }); txt(name, x, y - 15, 18, P.inkSoft, { align: 'center', weight: 700, maxW: 58 }); }
  function farewellCard(x, y, k, rot) {
    var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(k, k);
    sheet(-110, -150, 220, 150, '#fff4d6', 501, { rough: 1.4, lift: 8, blur: 14, sa: 0.3 }); c.fillStyle = '#e0863e'; c.fillRect(-110, -150, 220, 30); c.fillStyle = '#8c2a2a'; for (var i = 0; i < 9; i++) { c.beginPath(); c.arc(-100 + i * 25, -135, 7, 0, TAU); c.fill(); }
    hand('We\'ll miss you', 0, -92, 30, '#8c2a2a', { align: 'center' });
    c.strokeStyle = '#1f4c93'; c.lineWidth = 2.4; c.lineCap = 'round'; [[-90, -52], [-20, -48], [50, -54]].forEach(function (p, i) { c.beginPath(); c.moveTo(p[0], p[1]); c.bezierCurveTo(p[0] + 14, p[1] - 14, p[0] + 26, p[1] + 14, p[0] + 44, p[1] - 6); c.stroke(); c.beginPath(); c.moveTo(p[0] + 2, p[1] + 22); c.lineTo(p[0] + 60 - i * 8, p[1] + 20); c.stroke(); });
    c.restore();
  }
  var EV = { ground: '#a8453b', wall: '#e6d2a4', dado: '#b4a77f', floor: '#c4b08b', ceil: '#e8dcc0', sky: ['#e0643f', '#f7b46a'], sun: 0.9, far: '#c27a6a', mid: '#a8606a', near: '#7a4a5a', winLights: 'rgba(255,214,130,0.6)', winLight: 0.32, winCol: '255,150,70', lights: 0.3, tint: 'rgba(240,120,40,0.15)', gone: [0, 1, 3], strip: 0 };
  function evWorld(c, t, cam, o, H) { staffWorld(c, t, cam, Object.assign({}, EV, o), H); }
  function evTable(c, t, cards) {
    EMPTY.forEach(function (e) { placard(e[0] - 20, 735, e[1]); });
    if (cards) { C.popIn(1335, 700, lnT(t, 0.1, 0.35), function () { farewellCard(1335, 722, 0.55, -0.05); }); }
    chai(668, 733, 1.0, t, 0.2);
    MENTEES.forEach(function (m, i) { flat(m[1] - 50, 712, 0.05 * (i - 1), function () { C.ctx.fillStyle = ['#e0863e', '#2f7f7a', '#4b6fa8'][i]; C.ctx.fillRect(-30, -20, 60, 40); C.ctx.fillStyle = 'rgba(255,255,255,0.3)'; C.ctx.fillRect(-24, -14, 48, 6); }); });
    pencil(1000, 722, -0.15, 52);
  }
  function evPeople(c, t, mo, popChairs) {
    EMPTY.forEach(function (e, i) {
      var p = popChairs ? lnT(t, 0.05 + i * 0.1, 0.05 + i * 0.1 + 0.25) : 1; if (p <= 0) return;
      C.popIn(e[0], 640, p, function () { chairBack(c, e[0], SEAT, CK, true, e[2]); });
    });
    MENTEES.forEach(function (m, i) { chairBack(c, m[1], SEAT, 5.4, true, '#a1593f'); });
    sit('meera', MX, MK, mo, false);
    MENTEES.forEach(function (m, i) { sit(m[0], m[1], 5.4, arms(ARM.write, { face: i === 1 ? 'smile' : 'neutral', t: t + i * 0.7, look: [-0.85, 0.5], tilt: 0.05 * osc(t, 0.5, i), armL: ar(0.55, 1.0), armR: ar(0.6 + 0.05 * osc(t, 1.4, i), 1.0) }), true); });
  }
  function evS1(c, t) {
    var cam = camOf(t, ECAM), mo = { face: 'talk', t: t, lean: 0.1, tilt: 0.06 + 0.03 * osc(t, 0.6), look: [0.7, 0.4], armL: ar(0.55, 1.4), armR: ar(0.7 + 0.1 * osc(t, 1.7), 1.2) };
    evWorld(c, t, cam, { clock: [7, 40] }, {
      behind: function () { }, seated: function () { evPeople(c, t, mo, true); }, onTable: function () { evTable(c, t, true); }
    });
    C.banner('Vidya · 2032', 1236, 56, { size: 56, bg: '#fffdf7', fg: P.tealDark, rot: -0.025, p: lnT(t, 0, 0.3), seed: 9 });
  }
  function evS2(c, t) {
    var cam = camOf(t, [{ t: B(2), x: 960, y: 540, z: 1.0 }, { t: B(5), x: 944, y: 540, z: 1.06, ease: 'linear' }], B(4));
    C.cardboard('#7a3b5a', 0.35);
    C.withCam(cam, function () {
      burstBG(t, 540, 520, 'rgba(255,180,100,0.3)', 1);
      C.confetti(61, C.T12(t), 'rgba(255,200,120,1)', 9, [0, 60, 1920, 860]);
      ['Riya', 'Omkar', 'Sana'].forEach(function (nm, i) {
        var p = lnT(t, B(2) + 0.08 + i * 0.14, B(2) + 0.08 + i * 0.14 + 0.25), bx = 1420 + 30 * (i % 2), by = 300 + i * 190, wig = t > B(4) && t < B(4) + 0.5 ? 0.08 * Math.sin((t - B(4)) * 28) * (1 - (t - B(4)) / 0.5) : 0;
        C.popIn(bx, by, p, function () { var cc = C.ctx; cc.save(); cc.translate(bx, by); cc.rotate(-0.05 + 0.04 * i + wig); shape(C.torn(-170, -56, 340, 112, 510 + i, 3), '#fffdf7', { lift: 10, blur: 16, edgeW: 7 }); cc.fillStyle = '#2f7f7a'; cc.fillRect(-170, -56, 26, 112); txt(nm, 6, 4, 70, '#1f1b18', { align: 'center', weight: 800, maxW: 270 }); cc.fillStyle = '#c9ccc4'; cc.beginPath(); cc.arc(-176, -50, 7, 0, TAU); cc.fill(); cc.restore(); });
      });
      var o = CAST.withTake({ face: 'talk', t: t, tilt: 0.04 * osc(t, 0.6), lean: 0.01, look: [0.75, -0.1] }, 'laugh', t, B(4) - 0.26);
      if (t > 2.95) { o.face = 'smile'; o.tilt = -0.04; }
      bigFace('meera', 540, 500, 22, o);
      burst(560, 330, t, B(4), ['#fffdf7', '#e0863e', '#d9a933'], 16, 3.6);
    });
  }
  function evS3(c, t) {
    var cam = camOf(t, ECAM, B(6));
    evWorld(c, t, cam, { clock: [7, 40] }, {
      behind: function () { }, seated: function () { evPeople(c, t, { face: 'tired', t: t, lean: 0.1, tilt: 0.1, look: [0.5, 0.6], armL: ar(0.55, 1.4), armR: ar(0.7, 1.2) }, false); }, onTable: function () { evTable(c, t, false); farewellCard(1335, 722, 0.7, -0.05); }
    });
    C.inkStamp('3 left', 1000, 230, lnT(t, B(6) - 0.12, B(6) + 0.12), { size: 130, col: '#fffdf7', bg: '#8c2a2a', rot: -0.08, seed: 15 });
  }
  function evS4(c, t) {
    var cam = camOf(t, ECAM), pop = B(9), sg = B(8) - 0.4;
    var mo = CAST.withTake({ face: 'tired', t: t, lean: 0.1, tilt: 0.1, look: [0.5, 0.6], armL: ar(0.55, 1.4), armR: ar(0.7, 1.2) }, 'sag', t, sg);
    if (t >= pop) { mo.face = 'smile'; mo.tilt = -0.02; mo.look = [0.7, 0.2]; mo.lift = 6 * Math.sin(PI * ln(t, pop, pop + 0.3)); mo.squash = 0.04 * Math.sin(PI * ln(t, pop - 0.1, pop + 0.3)); }
    evWorld(c, t, cam, { clock: [8, 40], sky: ['#3a2f5a', '#c4604a'], sun: 0.2, winLights: 'rgba(255,214,130,0.7)', winLight: 0.12, tint: 'rgba(60,30,90,0.14)' }, {
      behind: function () { }, seated: function () { evPeople(c, t, mo, false); }, onTable: function () { evTable(c, t, false); farewellCard(1335, 722, 0.55, -0.05); }
    });
  }
  function drawEvening(c, t) {
    if (t < B(2)) evS1(c, t); else if (t < B(5)) evS2(c, t); else if (t < B(7)) evS3(c, t); else evS4(c, t);
    cap(c, '2032. Meera still knows every student by *name*.', t, 0.3, 3.0);
    cap(c, 'Three colleagues have left. The hours are *long*.', t, 3.2, 6.05);
  }

  /* ================= variant M: Vidya's mentor room (build-retrain) =================
     Bright and modern on a teal cardboard ground: a cream wall, a teal feature wall with the struggle-map screen, a golden
     window, a rug with a circle of young mentors holding tablets. World: screen x 1080-1700; window 150-480; door 1880-2100;
     mentors seated x 560-1280; Meera (head mentor) standing at x 1500 facing them.
     S1 0-2 wide: the dots pop onto the map · S2 2-5 big face, a resolve take (beat 4), a ring on the red cluster
     S3 5-7 a parent at the door thanks her (the take lands on beat 6) · S4 7-10 her phone rings before the office's: pings pile up, a stamp. */
  var MEN = [['extra:15', 640, 770, 5.0], ['extra:2', 850, 770, 5.0], ['extra:3', 1060, 770, 5.0], ['extra:14', 520, 850, 5.5], ['extra:19', 1240, 850, 5.5]];
  var MCAM = [
    { t: -1, x: 1014, y: 548, z: 0.98 }, { t: 0, x: 1000, y: 548, z: 1.0 }, { t: B(2), x: 1060, y: 548, z: 1.06, ease: 'linear' },
    { t: B(5), x: 1650, y: 560, z: 1.4 }, { t: B(7), x: 1630, y: 556, z: 1.46, ease: 'linear' },
    { t: B(7), x: 1500, y: 560, z: 1.5 }, { t: B(10), x: 1180, y: 548, z: 1.04, ease: 'out' }, { t: 8, x: 1170, y: 548, z: 1.0, ease: 'linear' }
  ];
  var DOT = (function () { var r = C.rand(444), a = []; for (var i = 0; i < 60; i++) { var col = i % 12, row = Math.floor(i / 12), cluster = (col >= 4 && col <= 6 && row >= 1 && row <= 2); a.push({ x: 1112 + col * 46, y: 292 + row * 44, red: cluster || r() < 0.1 }); } return a; })();
  function mentorScreen(t, popT0) {
    var c = C.ctx;
    sheet(1050, 150, 620, 390, '#17262d', 411, { rough: 2, lift: 10, blur: 16 });
    txt('Struggle map · Class 12 B', 1082, 190, 30, '#bfece4', { weight: 700 });
    DOT.forEach(function (d, i) {
      var p = popT0 == null ? 1 : lnT(t, popT0 + i * 0.008, popT0 + i * 0.008 + 0.22); if (p <= 0) return;
      var pulse = d.red ? 1 + 0.25 * Math.sin(t * 5 + i) : 1;
      C.popIn(d.x, d.y, p, function () { c.save(); c.shadowColor = d.red ? 'rgba(255,111,89,0.95)' : 'rgba(85,214,190,0.5)'; c.shadowBlur = d.red ? 16 : 6; c.fillStyle = d.red ? '#ff6f59' : '#55d6be'; c.beginPath(); c.arc(d.x, d.y, 11 * pulse, 0, TAU); c.fill(); c.restore(); });
    });
    c.fillStyle = '#ff6f59'; c.beginPath(); c.arc(1086, 508, 7, 0, TAU); c.fill(); txt('Needs help', 1100, 508, 20, '#e8dcc3', { weight: 600 });
    c.fillStyle = '#55d6be'; c.beginPath(); c.arc(1250, 508, 7, 0, TAU); c.fill(); txt('On track', 1264, 508, 20, '#e8dcc3', { weight: 600 });
  }
  function palm(x, y, k, t) {
    var c = C.ctx; c.save(); c.translate(x, y); c.scale(k, k); sheet(-34, -50, 68, 50, '#c2552f', 421, { rough: 1.2, lift: 5, blur: 9 });
    c.strokeStyle = '#2f7a3f'; c.lineCap = 'round'; for (var i = 0; i < 9; i++) { var a = -PI / 2 + (i - 4) * 0.33 + 0.03 * Math.sin(t * 0.9 + i); c.lineWidth = 7; c.beginPath(); c.moveTo(0, -50); c.quadraticCurveTo(Math.cos(a) * 60, -50 + Math.sin(a) * 90, Math.cos(a) * 96, -50 + Math.sin(a) * 150 + 24); c.stroke(); c.strokeStyle = i % 2 ? '#3f9a54' : '#2f7a3f'; }
    c.restore();
  }
  function mentorBackdrop(c, t, o) {
    var W0 = -900, WW = 4600;
    panel(W0, 70, WW, 780, '#f4ecd8', 401, { rough: 8, sides: 'tb', dots: 'rgba(224,134,62,1)', dotA: 0.1, vg: ['rgba(255,255,255,0.2)', 'rgba(60,40,20,0.1)'] });
    panel(980, 110, 820, 560, '#2f7f7a', 402, { rough: 4, rim: 9, dots: 'rgba(255,255,255,1)', dotA: 0.12 });
    for (var i = 0; i < 5; i++) tube(250 + i * 700, 104, 420, t, i, 1);
    sheet(140, 150, 360, 380, '#8a6a40', 431, { rough: 2, lift: 8, blur: 14 });
    windowView(154, 164, 332, 352, t, ['#f6c88a', '#fdecc4'], { sun: 0.95, sunX: 0.28, sunY: 0.62, far: '#d9b88a', mid: '#c49a72', near: '#a87f5e', win: 'rgba(255,255,255,0.4)', crow: true, crowPh: 0.4 });
    grill(154, 164, 332, 352, '#7a5a3a'); sheet(132, 520, 380, 20, '#c9a878', 432, { rough: 1, lift: 4, blur: 8, edge: false });
    sheet(560, 150, 330, 78, '#fffdf7', 433, { rough: 1.6, lift: 7, blur: 12 }); txt('Mentor room', 725, 179, 44, '#1d5552', { align: 'center', weight: 800, maxW: 290 }); txt('Eight students each · know every one', 725, 210, 17, P.inkSoft, { align: 'center', weight: 600, maxW: 290 });
    fan(730, 104, 140, t, 6.5);
    glow(300, 400, 600, 'rgba(255,214,140,A)', 0.22);
  }
  function mentorMid(c, t, o, H) {
    var W0 = -900, WW = 4600, poly = panel(W0, 700, WW, 340, '#c9a878', 441, { rough: 5, sides: 'tb', rim: 10, vg: ['rgba(255,255,255,0.0)', 'rgba(60,40,20,0.26)'] });
    c.save(); C.path(poly); c.clip(); c.strokeStyle = 'rgba(90,60,20,0.2)'; c.lineWidth = 2.5; for (var gy = 0; gy < 6; gy++) { var yy = 704 + Math.pow(gy / 5, 1.6) * 330 + 22 * gy; c.beginPath(); c.moveTo(W0, yy); c.lineTo(W0 + WW, yy); c.stroke(); } c.restore();
    c.fillStyle = '#7a5a3a'; c.fillRect(W0, 694, WW, 14);
    // a round rug under the circle of chairs
    var rg = C.tornRect2(400, 820, 1000, 170, 451, 3, 'lr'); rimPoly(rg, 7); C.paperPiece(rg, '#d9a933', { shadow: false, grain: 0.25 });
    c.save(); C.path(rg); c.clip(); ['#8c2a2a', '#2f7f7a', '#fbf3da'].forEach(function (col, i) { c.strokeStyle = col; c.lineWidth = 12; c.beginPath(); c.ellipse(900, 905, 420 - i * 75, 62 - i * 11, 0, 0, TAU); c.stroke(); }); c.restore();
    // frosted glass door on the right
    sheet(1868, 228, 230, 484, '#3a4a50', 461, { rough: 2, lift: 6, blur: 12 });
    var dop = o.door || 0, lw = 206 * (1 - 0.8 * dop);
    var cor = c.createLinearGradient(0, 250, 0, 700); cor.addColorStop(0, '#fff3cf'); cor.addColorStop(1, '#e8cf94'); c.fillStyle = cor; c.fillRect(1880, 244, 206, 452);
    if (dop > 0) glow(1980, 470, 380 * dop + 100, 'rgba(255,246,214,A)', 0.5 * dop);
    sheet(1880, 244, lw, 452, '#9fc8c4', 462, { rough: 1.2, lift: 4, blur: 8, edge: false, vg: ['rgba(255,255,255,0.3)', 'rgba(20,60,60,0.25)'] });
    if (lw > 60) { txt('Vidya', 1880 + lw / 2, 330, 36, '#1d5552', { align: 'center', weight: 800 }); c.fillStyle = '#c8ccc6'; c.fillRect(1880 + lw - 24, 470, 8, 70); }
    mentorScreen(t, o.dots);
    if (H.behind) H.behind();
    if (H.seated) H.seated();
    if (H.front) H.front();
  }
  function mentorWorld(c, t, cam, o, H) {
    C.cardboard(o.ground || '#2f7f7a', 0.3);
    lay(cam, 0.55, function () { mentorBackdrop(c, t, o); });
    lay(cam, 1.0, function () { mentorMid(c, t, o, H); });
    lay(cam, 1.5, function () { C.confetti(o.confSeed || 17, C.T12(t), 'rgba(255,253,247,1)', 7, [-200, 100, 2400, 800]); palm(40, 1010, 1.3, t); });
  }
  function mentorCircle(c, t, turned, pops) {
    MEN.forEach(function (m, i) {
      var p = pops ? lnT(t, 0.1 + i * 0.1, 0.1 + i * 0.1 + 0.25) : 1; if (p <= 0) return;
      C.popIn(m[1], m[2] - 100, p, function () {
        chairBack(c, m[1], m[2], m[3], !!turned, ['#d9a933', '#2f7f7a', '#e2664f', '#4b6fa8', '#8c2a2a'][i]);
        CAST.draw(C.ctx, m[0], m[1], m[2], m[3] * 100, { pose: 'sit', flip: !!turned, face: turned ? 'smile' : (i % 2 ? 'neutral' : 'smile'), t: t + i, look: turned ? [-0.8, 0.2] : [0.85, 0.1], tilt: 0.05 * osc(t, 0.5, i), holdR: 'tablet', glow: 0.8, armL: ar(0.4, 1.2), armR: ar(0.7 + 0.05 * osc(t, 1.1, i), 1.2) });
      });
    });
  }
  var MMX = 1500;
  function mentS1m(c, t) {
    var cam = camOf(t, MCAM), s = osc(t, 0.55), mo = { pose: 'stand', flip: true, lean: 0.04 }, aim = armTo('meera', MMX, 962, MK, mo, 1360, 372);
    mentorWorld(c, t, cam, { dots: 0.05 }, {
      seated: function () { mentorCircle(c, t, false, true); },
      front: function () {
        stand('meera', MMX, 962, MK, arms(ARM.down, { face: 'talk', t: t, lean: 0.04, tilt: 0.04 * s, look: [-0.8, 0.1], armL: ar(0.12, 0.2), armR: ar(aim[0] + 0.08 * s, aim[1]) }), true);
        C.markRing2(1342, 358, 96, 58, lnT(t, 0.7, 1.1), { col: '#d9a933', w: 7 });
      }
    });
    C.banner('Vidya mentor room · 2032', 1236, 56, { size: 52, bg: '#fffdf7', fg: P.tealDark, rot: -0.025, p: lnT(t, 0, 0.3), seed: 9 });
  }
  function mentS2m(c, t) {
    var cam = camOf(t, [{ t: B(2), x: 960, y: 540, z: 1.0 }, { t: B(5), x: 944, y: 540, z: 1.06, ease: 'linear' }], B(4)), ring = ln(t, B(4), B(4) + 0.3);
    C.cardboard('#e2664f', 0.3);
    C.withCam(cam, function () {
      burstBG(t, 540, 520, 'rgba(255,240,215,0.45)', 1);
      C.confetti(51, C.T12(t), 'rgba(255,253,247,1)', 9, [0, 60, 1920, 860]);
      C.popIn(1400, 520, lnT(t, B(2), B(2) + 0.3), function () {
        c.save(); c.translate(1400, 520); c.rotate(0.02); c.scale(1.05, 1.05); c.translate(-1400, -520); c.translate(-1050 + 1400 - 330, -150 + 520 - 195 + 0);
        mentorScreen(t, null); c.restore();
      });
      var o = CAST.withTake({ face: 'talk', t: t, tilt: 0.03 * osc(t, 0.6), lean: 0.01, look: [0.75, -0.1] }, 'resolve', t, B(4) - 0.32);
      if (t < B(4) - 0.4) o.face = 'talk';
      if (t > 2.95) { o.face = 'smile'; o.tilt = -0.04; }
      bigFace('meera', 540, 500, 22, o);
      C.markRing2(1360, 534, 100, 64, ring, { col: '#fffdf7', w: 9 });
    });
  }
  function mentS3m(c, t) {
    var cam = camOf(t, MCAM, B(6)), pop = B(6), s = osc(t, 0.5);
    var mo = CAST.withTake({ face: 'neutral', t: t, lean: 0.04, tilt: 0.0, look: [0.8, 0.0], armL: ar(0.12, 0.2), armR: ar(0.2, 0.3) }, 'realize', t, pop - 0.3);
    var door = sm(t, B(5) - 0.1, 3.5);
    mentorWorld(c, t, cam, { door: door }, {
      seated: function () { mentorCircle(c, t, true, false); },
      front: function () {
        stand('meera', 1500, 962, MK, Object.assign(mo, { flip: false }), false);
        var px = lerp(1990, 1840, sm(t, B(5) - 0.05, 3.55));
        stand('extra:11', px, 962, 6.0, arms(ARM.clap, { face: t < pop ? 'neutral' : 'smile', t: t + 1, lean: 0.06, tilt: 0.08 * sm(t, pop, pop + 0.3), pose: t < 3.55 ? 'walk' : 'stand', walk: (t - 3.0) * 5.5, look: [-0.7, 0.2] }), true);
      }
    });
    var sp = lnT(t, pop - 0.04, pop + 0.2); if (sp > 0) { var q = w2s(cam, 1830, 470); c.save(); c.translate(q.x - 60, q.y - 190); var k = C.back(sp); c.scale(k, k); c.rotate(-0.04);
      shape(C.torn(-160, -50, 320, 100, 477, 3), '#fffdf7', { lift: 8, blur: 14, edgeW: 7 }); txt('धन्यवाद, मॅडम!', 0, -4, 46, '#8c2a2a', { font: C.FONTS.deva, up: false, align: 'center', weight: 400, maxW: 290 }); txt('Thank you, ma\'am', 0, 34, 20, P.inkSoft, { align: 'center', weight: 700 }); c.restore(); }
  }
  function mentS4m(c, t) {
    var cam = camOf(t, MCAM, B(9)), s = osc(t, 0.6), pop = B(9);
    var up = sm(t, B(7), B(7) + 0.3);
    mentorWorld(c, t, cam, {}, {
      seated: function () { mentorCircle(c, t, true, false); },
      front: function () {
        stand('meera', 1500, 962, MK, arms(ARM.down, { face: 'smile', t: t, lean: 0.03, tilt: -0.04 + 0.02 * s, look: [0, -0.3], holdR: 'phone', glow: 1, armL: ar(0.12, 0.2), armR: ar(lerp(0.3, 1.3, up), lerp(0.3, 1.5, up)) }), false);
        // three parents ring before the office does
        [['Mrs. Rao', B(7) + 0.25], ['Mr. Shaikh', B(8) - 0.05], ['Mrs. Patil', B(8) + 0.3]].forEach(function (q, i) {
          var p = lnT(t, q[1], q[1] + 0.25); if (p <= 0) return; var cc = C.ctx, bx = 1590 + i * 24, by = 520 - i * 74 - 20 * Math.sin(t * 3 + i);
          C.popIn(bx, by, p, function () { shape(C.torn(bx - 100, by - 26, 200, 52, 480 + i, 2), '#fffdf7', { lift: 6, blur: 10, edgeW: 5 }); cc.fillStyle = '#2f7f7a'; cc.beginPath(); cc.arc(bx - 76, by, 13, 0, TAU); cc.fill(); txt('☎', bx - 76, by + 1, 17, '#fff', { up: false, align: 'center', weight: 400, font: 'sans-serif' }); txt(q[0] + ' · calling', bx - 54, by + 1, 22, P.ink, { weight: 700, maxW: 140 }); });
        });
        var op = ln(t, B(8) + 0.35, B(8) + 0.6); if (op > 0) { var cc2 = C.ctx; cc2.save(); cc2.globalAlpha *= op; shape(C.torn(1700, 590, 190, 46, 490, 2), '#d9d4c6', { lift: 5, blur: 8, edgeW: 5 }); txt('Office · 0 calls', 1795, 614, 22, '#6a6258', { align: 'center', weight: 700 }); cc2.restore(); }
      }
    });
    C.inkStamp('Head mentor', 640, 340, lnT(t, pop - 0.12, pop + 0.12), { size: 120, col: '#2f7f7a', bg: '#f4ecd8', rot: -0.08, seed: 14 });
  }
  function drawMentor32(c, t) {
    if (t < B(2)) mentS1m(c, t); else if (t < B(5)) mentS2m(c, t); else if (t < B(7)) mentS3m(c, t); else mentS4m(c, t);
    cap(c, '2032. Meera now trains Vidya\'s *mentors*.', t, 0.3, 3.0);
    cap(c, 'Parents call her before they call the *office*.', t, 3.2, 6.05);
  }

  /* ---- sound: local times, every visible event ---- */
  function evM32(road) {
    var e = [[0, 'swish']], i; cutsFx(e);
    if (road.c2 === 'cut') {
      for (i = 0; i < 6; i++) e.push([0.05 + i * 0.08, 'popLow', i]);
      e.push([B(2) + 0.04, 'pop'], [B(4), 'pop'], [B(4) + 0.04, 'boing']);
      if (road.c1 === 'build') e.push([3.55, 'ding'], [3.7, 'ding'], [3.3, 'whooshIn'], [B(6), 'clank']);
      else { for (i = 0; i < 3; i++) e.push([B(6) + 0.02 + i * 0.08, 'popLow', i + 3]); e.push([3.3, 'whooshIn'], [B(6), 'clank']); }
    } else if (road.c1 === 'build') {
      for (i = 0; i < 6; i++) e.push([0.05 + i * 0.09, 'popLow', i]);
      for (i = 0; i < 5; i++) e.push([0.1 + i * 0.1, 'pop']);
      e.push([0.7, 'click'], [B(2) + 0.04, 'pop'], [B(4), 'pop'], [B(4) + 0.05, 'swish'], [B(5) - 0.1, 'creak'], [3.35, 'step'], [3.55, 'step'], [B(6), 'pop'], [B(6) + 0.02, 'boing']);
      e.push([B(7) + 0.25, 'notify'], [B(8) - 0.05, 'notify'], [B(8) + 0.3, 'notify'], [B(8) + 0.35, 'pop'], [B(9) - 0.45, 'whooshIn'], [B(9), 'clank']);
    } else {
      for (i = 0; i < 3; i++) e.push([0.05 + i * 0.1, 'popLow', i]);
      for (i = 0; i < 3; i++) e.push([B(2) + 0.08 + i * 0.14, 'pop']);
      e.push([B(4), 'pop'], [B(4) + 0.03, 'boing'], [3.3, 'whooshIn'], [B(6), 'clank'], [B(8), 'popLow', 0], [B(9), 'pop']);
    }
    return e.sort(function (a, b) { return a[0] - b[0]; });
  }
  PLACES.meera32 = { dur: B(10), year: 2032, events: evM32, draw: function (ctx, t, road) {
    C.use(ctx);
    if (road.c2 === 'cut') drawFlat(ctx, t, road); else if (road.c1 === 'build') drawMentor32(ctx, t); else drawEvening(ctx, t);
  } };
})(typeof window !== 'undefined' ? window : globalThis);
