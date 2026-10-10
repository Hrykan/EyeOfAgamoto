/* collage.js — shared paper-collage drawing kit. Global `C`. All drawing goes to C.ctx (set by index.html
   before every draw call; modules may also call C.use(ctx)). World space is always 1920×1080. */
(function (root) {
  'use strict';
  var C = { ctx: null };
  C.W = 1920; C.H = 1080;
  C.PALETTE = {
    saffron: '#e0863e', teal: '#2f7f7a', tealDark: '#1d5552', coral: '#e2664f', mustard: '#d9a933',
    cream: '#f4ead7', paper: '#fbf5e8', paperDark: '#e8dcc3', ink: '#1f1b18', inkSoft: '#4a423b',
    sky: '#f2c48d', skyNight: '#2b3550', wall: '#efe2c8', floor: '#c99a6b', board: '#26433f', wood: '#8a5a3b',
    green: '#1fa463', blue: '#1f6fd1', amber: '#e0702f', white: '#ffffff', highlight: 'rgba(240,196,64,0.75)'
  };
  C.FONTS = {
    serif: '"Instrument Serif", Georgia, serif',          // narration — always italic
    label: '"Barlow Condensed", "Arial Narrow", sans-serif', // labels — always UPPERCASE
    deva: '"Tiro Devanagari Hindi", serif'               // कल
  };
  C.use = function (ctx) { C.ctx = ctx; return C; };

  /* ---------- math ---------- */
  C.clamp = function (v, a, b) { return Math.max(a == null ? 0 : a, Math.min(b == null ? 1 : b, v)); };
  C.lerp = function (a, b, f) { return a + (b - a) * f; };
  C.prog = function (t, t0, t1) { return C.clamp((t - t0) / (t1 - t0)); };           // 0..1 between t0 and t1
  C.ease = function (f) { f = C.clamp(f); return f < .5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2; }; // inOutCubic
  C.easeOut = function (f) { f = C.clamp(f); return 1 - Math.pow(1 - f, 3); };
  C.easeIn = function (f) { f = C.clamp(f); return f * f * f; };
  C.back = function (f) { f = C.clamp(f); var c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(f - 1, 3) + c * Math.pow(f - 1, 2); };
  C.rand = function (seed) { var a = (seed * 2654435761) >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // Ambient motion that is seamless at clip joins: periodic over the clip, ~4 s period, same value at t=0 and t=dur.
  C.amb = function (t, dur, phase, harmonic) { var n = Math.max(1, Math.round(dur / 4)) * (harmonic || 1); return Math.sin(2 * Math.PI * n * t / dur + (phase || 0)); };

  /* ---------- paper ---------- */
  // Torn rectangle: returns a polygon (array of [x,y]) with ragged edges; deterministic per seed.
  C.torn = function (x, y, w, h, seed, rough) {
    var r = C.rand(seed || 1), pts = [], j = rough == null ? 5 : rough, step = 18;
    function edge(x0, y0, x1, y1, nx, ny) {
      var len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len / step));
      for (var i = 0; i < n; i++) { var f = i / n, d = (r() - .5) * 2 * j; pts.push([x0 + (x1 - x0) * f + nx * d, y0 + (y1 - y0) * f + ny * d]); }
    }
    edge(x, y, x + w, y, 0, 1); edge(x + w, y, x + w, y + h, 1, 0); edge(x + w, y + h, x, y + h, 0, 1); edge(x, y + h, x, y, 1, 0);
    return pts;
  };
  function path(pts) { var c = C.ctx; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  C.path = path;
  // Draw a paper polygon with soft shadow, fill and optional halftone. opts: {shadow:true, halftone:0..1, dot:color, stroke}
  C.paper = function (pts, fill, opts) {
    var c = C.ctx; opts = opts || {};
    c.save();
    if (opts.shadow !== false) { c.shadowColor = 'rgba(40,25,10,' + (opts.shadowAlpha || 0.28) + ')'; c.shadowBlur = opts.blur || 14; c.shadowOffsetX = 3; c.shadowOffsetY = opts.lift || 6; }
    path(pts); c.fillStyle = fill; c.fill();
    c.restore();
    if (opts.halftone) { c.save(); path(pts); c.clip(); C.halftone(pts, opts.dot || 'rgba(31,27,24,0.13)', opts.halftone); c.restore(); }
    if (opts.stroke) { c.save(); path(pts); c.strokeStyle = opts.stroke; c.lineWidth = opts.lw || 2; c.stroke(); c.restore(); }
  };
  C.halftone = function (pts, color, amt) {
    var c = C.ctx, minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    pts.forEach(function (p) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
    var s = 9; c.fillStyle = color;
    for (var yy = miny; yy < maxy; yy += s) for (var xx = minx + ((yy / s) % 2) * s / 2; xx < maxx; xx += s) {
      var f = (yy - miny) / Math.max(1, maxy - miny), rr = 1.7 * amt * (0.35 + f);
      c.beginPath(); c.arc(xx, yy, rr, 0, 6.283); c.fill();
    }
  };
  C.rect = function (x, y, w, h, fill, seed, opts) { C.paper(C.torn(x, y, w, h, seed || 7, opts && opts.rough), fill, opts); };

  /* ---------- figures (smooth silhouettes, never boxes) ---------- */
  // pose: 'sit' | 'stand' | 'point-at-board' | 'lean-in-to-group'. outfit: {body, skin, hair, saree:bool, dupatta}
  // (x, y) = feet/floor contact point (for 'sit', the seat point). h = standing height in px.
  C.figure = function (x, y, h, pose, outfit, flip, t) {
    var c = C.ctx; outfit = outfit || {}; t = t || 0;
    var body = outfit.body || C.PALETTE.teal, skin = outfit.skin || '#a8714f', hair = outfit.hair || '#1f1b18';
    var s = h / 100; c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.scale(s, s);
    c.shadowColor = 'rgba(40,25,10,0.25)'; c.shadowBlur = 10 / s; c.shadowOffsetY = 4 / s;
    var lean = pose === 'lean-in-to-group' ? 14 : 0, breath = Math.sin(t * 2.2) * 0.8;
    if (pose === 'sit') {
      // legs + chair-less seated silhouette
      c.fillStyle = outfit.legs || C.PALETTE.inkSoft;
      c.beginPath(); c.moveTo(-12, -4); c.bezierCurveTo(0, -9, 16, -8, 24, -3); c.bezierCurveTo(28, 2, 27, 18, 27, 32); c.quadraticCurveTo(25, 35, 18, 34); c.bezierCurveTo(19, 22, 18, 10, 15, 6); c.bezierCurveTo(4, 8, -6, 8, -13, 5); c.closePath(); c.fill();
      c.fillStyle = C.PALETTE.wood; c.beginPath(); if (c.roundRect) c.roundRect(-16, 4, 26, 5, 2); else c.rect(-16, 4, 26, 5); c.fill(); c.fillRect(-12, 8, 3, 26); c.fillRect(5, 8, 3, 26);
      c.fillStyle = body;
      c.beginPath(); c.moveTo(-14, 2); c.bezierCurveTo(-16, -22, -12, -40 + breath, 0, -42 + breath); c.bezierCurveTo(12, -40 + breath, 14, -22, 12, 2); c.closePath(); c.fill();
      c.strokeStyle = body; c.lineCap = 'round'; c.lineWidth = 7; c.beginPath(); c.moveTo(8, -32 + breath); c.quadraticCurveTo(16, -18, 28, -16); c.stroke();
      c.fillStyle = skin; c.beginPath(); c.arc(29, -16, 3.6, 0, 6.283); c.fill();
      head(2, -51 + breath, skin, hair, outfit);
    } else {
      var lx = pose === 'lean-in-to-group' ? 6 : 0;
      c.fillStyle = outfit.legs || C.PALETTE.inkSoft;
      if (outfit.saree) { c.fillStyle = body; c.beginPath(); c.moveTo(-13, -46); c.bezierCurveTo(-18, -20, -20, -4, -16, 0); c.lineTo(16, 0); c.bezierCurveTo(20, -4, 18, -20, 13, -46); c.closePath(); c.fill(); }
      else { c.beginPath(); c.moveTo(-10, -46); c.quadraticCurveTo(-12, -20, -9, 0); c.lineTo(-2, 0); c.lineTo(0, -30); c.lineTo(2, 0); c.lineTo(9, 0); c.quadraticCurveTo(12, -20, 10, -46); c.closePath(); c.fill(); }
      c.save(); c.translate(0, -46); c.rotate(lean * Math.PI / 180);
      c.fillStyle = body;
      c.beginPath(); c.moveTo(-14, 2); c.bezierCurveTo(-17, -16, -14, -32 + breath, 0, -34 + breath); c.bezierCurveTo(14, -32 + breath, 17, -16, 14, 2); c.closePath(); c.fill();
      if (outfit.dupatta || outfit.saree) { c.fillStyle = outfit.dupatta || C.PALETTE.saffron; c.beginPath(); c.moveTo(-12, -30); c.quadraticCurveTo(4, -14, 14, 2); c.lineTo(8, 4); c.quadraticCurveTo(-2, -12, -14, -24); c.closePath(); c.fill(); }
      // arms
      c.strokeStyle = body; c.lineCap = 'round'; c.lineWidth = 7;
      if (pose === 'point-at-board') { c.beginPath(); c.moveTo(10, -26); c.quadraticCurveTo(30, -40, 44 + Math.sin(t * 3) * 2, -50); c.stroke(); c.fillStyle = skin; c.beginPath(); c.arc(46 + Math.sin(t * 3) * 2, -51, 3.6, 0, 6.283); c.fill(); }
      else if (pose === 'lean-in-to-group') { c.beginPath(); c.moveTo(10, -24); c.quadraticCurveTo(22, -10, 26, 2); c.stroke(); }
      else { c.beginPath(); c.moveTo(11, -26); c.quadraticCurveTo(15, -12, 12, -2); c.stroke(); }
      head(lx * 0, -42 + breath, skin, hair, outfit);
      c.restore();
    }
    c.restore();
    function head(hx, hy, sk, hr, o) {
      c.fillStyle = sk; c.beginPath(); c.ellipse(hx, hy, 9.5, 11, 0, 0, 6.283); c.fill();
      c.shadowColor = 'transparent';
      c.fillStyle = hr; c.beginPath(); c.ellipse(hx - 1, hy - 4, 10.5, 8.5, -0.2, Math.PI * 0.95, Math.PI * 2.05); c.fill();
      if (o.bun) { c.beginPath(); c.arc(hx - 9, hy - 2, 4.5, 0, 6.283); c.fill(); }
      if (o.braid) { c.beginPath(); c.ellipse(hx - 8, hy + 8, 3, 9, 0.2, 0, 6.283); c.fill(); }
      if (o.glasses) { c.strokeStyle = C.PALETTE.ink; c.lineWidth = 1.4; c.beginPath(); c.arc(hx + 3, hy, 2.8, 0, 6.283); c.arc(hx + 9, hy, 2.8, 0, 6.283); c.stroke(); }
    }
  };
  // Sunanda Joshi: saffron saree, bun, glasses
  C.SUNANDA = { body: '#e0863e', dupatta: '#b9542d', saree: true, bun: true, glasses: true, skin: '#9a6648', hair: '#3a3330' };
  C.outfitFor = function (i) {
    var bodies = ['#2f7f7a', '#e2664f', '#d9a933', '#4b6fa8', '#7d5a8c', '#c98b4a', '#3f8f5f'], skins = ['#a8714f', '#8d5a3c', '#c48a63', '#7a4b33', '#b57e5a'];
    return { body: bodies[i % bodies.length], skin: skins[(i * 3) % skins.length], hair: '#211c19', braid: i % 3 === 1, bun: i % 5 === 3 };
  };

  /* ---------- type ---------- */
  // Narration caption on torn strips, words type in by p (0..1), emphasised words get a highlighter.
  // text: string; emph: array of words to highlight (or text may mark words with *word*). y: baseline centre.
  C.caption = function (text, emph, p, y, opts) {
    var c = C.ctx; opts = opts || {}; emph = emph || [];
    var size = opts.size || 54, x0 = opts.x == null ? C.W / 2 : opts.x;
    var words = text.split(/\s+/), marks = words.map(function (w) { var m = /^\*.*\*[.,!?]?$/.test(w) || emph.indexOf(w.replace(/[*.,!?]/g, '')) >= 0; return m; });
    words = words.map(function (w) { return w.replace(/\*/g, ''); });
    c.save(); c.font = 'italic ' + size + 'px ' + C.FONTS.serif;
    var sp = c.measureText(' ').width, widths = words.map(function (w) { return c.measureText(w).width; });
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + sp * (words.length - 1);
    var shown = Math.ceil(C.clamp(p) * words.length - 1e-6), stripP = C.easeOut(C.clamp(p * 4));
    if (p > 0) {
      var sw = (total + 70) * stripP; var pts = C.torn(x0 - (total + 70) / 2, y - size * 0.95, sw, size * 1.45, opts.seed || 11, 4);
      C.paper(pts, opts.bg || C.PALETTE.paper, { lift: 5 });
    }
    var x = x0 - total / 2;
    for (var i = 0; i < words.length; i++) {
      if (i < shown) {
        var wf = C.clamp(p * words.length - i), a = C.easeOut(wf * 3);
        if (marks[i]) { c.fillStyle = C.PALETTE.highlight; var hw = widths[i] * C.easeOut(C.clamp(wf * 2 - 0.3)); c.beginPath(); c.moveTo(x - 6, y - size * 0.55); c.lineTo(x + hw + 6, y - size * 0.6); c.lineTo(x + hw + 4, y + size * 0.12); c.lineTo(x - 4, y + size * 0.16); c.closePath(); c.fill(); }
        c.globalAlpha = a; c.fillStyle = opts.color || C.PALETTE.ink; c.fillText(words[i], x, y + (1 - a) * 8); c.globalAlpha = 1;
      }
      x += widths[i] + sp;
    }
    c.restore();
  };
  C.label = function (text, x, y, size, color, align, weight) {
    var c = C.ctx; c.save(); c.font = (weight || 700) + ' ' + (size || 28) + 'px ' + C.FONTS.label; c.fillStyle = color || C.PALETTE.ink;
    c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(String(text).toUpperCase(), x, y); c.restore();
  };
  // Rubber stamp that slams in (p 0..1): scales from 2.2 → 1 with a slight rotation and ink texture.
  C.stamp = function (text, x, y, p, opts) {
    if (p <= 0) return; var c = C.ctx; opts = opts || {};
    var col = opts.color || C.PALETTE.coral, size = opts.size || 64, f = C.clamp(p * 1.6), sc = 1 + 1.2 * Math.pow(1 - C.easeOut(f), 2);
    c.save(); c.translate(x, y); c.rotate((opts.rot == null ? -4 : opts.rot) * Math.PI / 180); c.scale(sc, sc); c.globalAlpha = C.clamp(f * 2);
    c.font = '800 ' + size + 'px ' + C.FONTS.label; var w = c.measureText(String(text).toUpperCase()).width;
    c.strokeStyle = col; c.lineWidth = 6; c.fillStyle = 'rgba(251,245,232,0.55)';
    c.beginPath(); if (c.roundRect) c.roundRect(-w / 2 - 28, -size * 0.75, w + 56, size * 1.5, 10); else c.rect(-w / 2 - 28, -size * 0.75, w + 56, size * 1.5); c.fill(); c.stroke();
    c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(text).toUpperCase(), 0, 4);
    c.restore();
  };
  // Hand-drawn ring drawn on by p (0..1)
  C.ring = function (x, y, rx, ry, p, color, lw) {
    if (p <= 0) return; var c = C.ctx; c.save(); c.strokeStyle = color || C.PALETTE.saffron; c.lineWidth = lw || 7; c.lineCap = 'round';
    c.beginPath(); var end = C.easeOut(p) * 2.15 * Math.PI;
    for (var a = 0; a <= end; a += 0.05) { var w = 1 + 0.06 * Math.sin(a * 3 + 1) + 0.05 * (a / 6.283); var px = x + Math.cos(a - 2) * rx * w, py = y + Math.sin(a - 2) * ry * w; if (a === 0) c.moveTo(px, py); else c.lineTo(px, py); }
    c.stroke(); c.restore();
  };
  // Callout: a torn label at (x,y) with a hand-drawn arrow to (tx,ty). p 0..1.
  C.callout = function (text, x, y, tx, ty, p, opts) {
    if (p <= 0) return; var c = C.ctx; opts = opts || {}; var f = C.easeOut(C.clamp(p * 1.5)), size = opts.size || 34;
    c.save(); c.font = '700 ' + size + 'px ' + C.FONTS.label; var w = c.measureText(String(text).toUpperCase()).width + 40;
    // arrow
    var ap = C.clamp(p * 2 - 0.3); if (ap > 0 && tx != null) {
      c.strokeStyle = opts.arrow || C.PALETTE.saffron; c.lineWidth = 5; c.lineCap = 'round'; var mx = (x + tx) / 2 + (ty - y) * 0.2, my = (y + ty) / 2 - (tx - x) * 0.2;
      c.beginPath(); c.moveTo(x, y); var N = 20, ex, ey; for (var i = 1; i <= N * ap; i++) { var u = i / N; ex = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * mx + u * u * tx; ey = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * my + u * u * ty; c.lineTo(ex, ey); } c.stroke();
      if (ap >= 1) { var ang = Math.atan2(ty - my, tx - mx); c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx - 22 * Math.cos(ang - 0.45), ty - 22 * Math.sin(ang - 0.45)); c.moveTo(tx, ty); c.lineTo(tx - 22 * Math.cos(ang + 0.45), ty - 22 * Math.sin(ang + 0.45)); c.stroke(); }
    }
    c.translate(x, y); c.rotate((opts.rot == null ? -2 : opts.rot) * Math.PI / 180); c.scale(0.6 + 0.4 * C.back(f), 0.6 + 0.4 * C.back(f)); c.globalAlpha = C.clamp(f * 2);
    C.paper(C.torn(-w / 2, -size * 0.8, w, size * 1.6, opts.seed || 5, 3), opts.bg || C.PALETTE.mustard, { lift: 6 });
    c.fillStyle = opts.color || C.PALETTE.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(text).toUpperCase(), 0, 2);
    c.restore();
  };
  // Torn newspaper headline (luck). p 0..1 flies in.
  C.headline = function (year, text, x, y, p, sign, seed) {
    if (p <= 0) return; var c = C.ctx, f = C.back(C.clamp(p * 1.4)); var w = 760, h = 150;
    c.save(); c.translate(x, y + (1 - f) * 300); c.rotate(((seed || 3) % 2 ? 3 : -3) * Math.PI / 180 * (1 + (1 - f) * 4)); c.globalAlpha = C.clamp(p * 3);
    C.paper(C.torn(-w / 2, -h / 2, w, h, seed || 3, 7), '#f7f1e3', { halftone: 0.5, lift: 10 });
    c.fillStyle = sign === '-' ? C.PALETTE.coral : C.PALETTE.green; c.fillRect(-w / 2 + 24, -h / 2 + 22, 8, h - 44);
    C.label(year + ' · ' + (sign === '-' ? 'BAD LUCK' : 'GOOD LUCK'), -w / 2 + 50, -h / 2 + 36, 24, C.PALETTE.inkSoft, 'left', 700);
    c.font = 'italic 40px ' + C.FONTS.serif; c.fillStyle = C.PALETTE.ink; c.textBaseline = 'middle';
    wrap(text, -w / 2 + 50, -h / 2 + 82, w - 90, 42);
    c.restore();
    function wrap(s, x0, y0, mw, lh) { var ws = s.split(' '), line = '', yy = y0; ws.forEach(function (wd) { var tst = line ? line + ' ' + wd : wd; if (c.measureText(tst).width > mw && line) { c.fillText(line, x0, yy); line = wd; yy += lh; } else line = tst; }); c.fillText(line, x0, yy); }
  };

  /* ---------- camera ---------- */
  C.REST = { x: 960, y: 540, z: 1 };
  // keys: [{t, x, y, z, ease?:'inout'|'out'|'in'|'linear'}], sorted by t. Two keys with the same t = a hard cut.
  C.track = function (t, keys) {
    if (!keys || !keys.length) return C.REST;
    if (t <= keys[0].t) return keys[0];
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (t >= a.t && t < b.t) { if (b.t === a.t) continue; var f = (t - a.t) / (b.t - a.t), e = b.ease === 'linear' ? f : b.ease === 'out' ? C.easeOut(f) : b.ease === 'in' ? C.easeIn(f) : C.ease(f); return { x: C.lerp(a.x, b.x, e), y: C.lerp(a.y, b.y, e), z: C.lerp(a.z, b.z, e) }; }
    }
    return keys[keys.length - 1];
  };
  // Draw fn() in world space seen through cam {x, y, z}: (x,y) is the world point at the screen centre.
  C.withCam = function (cam, fn) { var c = C.ctx; c.save(); c.translate(C.W / 2, C.H / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y); fn(); c.restore(); };

  /* ---------- finish ---------- */
  var grainCanvas = null;
  C.grain = function (t, amt) {
    var c = C.ctx; if (typeof document === 'undefined') return;
    if (!grainCanvas) { grainCanvas = []; for (var g = 0; g < 4; g++) { var gc = document.createElement('canvas'); gc.width = 256; gc.height = 256; var gx = gc.getContext('2d'), id = gx.createImageData(256, 256), r = C.rand(g + 1); for (var i = 0; i < id.data.length; i += 4) { var v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; } gx.putImageData(id, 0, 0); grainCanvas.push(gc); } }
    var fr = Math.floor((t || 0) * 12) % 4; c.save(); c.globalAlpha = amt == null ? 0.5 : amt; c.globalCompositeOperation = 'overlay';
    var pat = c.createPattern(grainCanvas[fr], 'repeat'); c.fillStyle = pat; c.translate((fr * 37) % 256, (fr * 91) % 256); c.fillRect(-256, -256, C.W + 512, C.H + 512); c.restore();
  };
  C.vignette = function (amt) {
    var c = C.ctx, g = c.createRadialGradient(C.W / 2, C.H / 2, C.H * 0.35, C.W / 2, C.H / 2, C.H * 1.05);
    g.addColorStop(0, 'rgba(30,18,8,0)'); g.addColorStop(1, 'rgba(30,18,8,' + (amt == null ? 0.45 : amt) + ')');
    c.save(); c.fillStyle = g; c.fillRect(0, 0, C.W, C.H); c.restore();
  };
  C.flash = function (a, color) { if (a <= 0) return; var c = C.ctx; c.save(); c.globalAlpha = C.clamp(a); c.fillStyle = color || '#fff'; c.fillRect(0, 0, C.W, C.H); c.restore(); };
  C.dirColor = function (delta, eps) { return Math.abs(delta) < (eps || 0.5) ? C.PALETTE.blue : delta > 0 ? C.PALETTE.green : C.PALETTE.amber; }; // up green · flat blue · down amber

  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.C = C;
})(this);
