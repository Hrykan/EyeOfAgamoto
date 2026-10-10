/* places-city.js — PLACES.street (2029) and PLACES.results (2030). See docs/story-bible.md (H2) and docs/animotion-upgrade.md.
   Vox paper-collage: a cardboard ground per shot, set pieces as torn cut-outs with white rims at 2-3 parallax depths, stamps,
   banners, sunbursts, confetti; shots cut on the 96 bpm beat grid; four-beat takes on the lead. Pure functions of (t, road). */
(function (root) {
  'use strict';
  var P = C.PALETTE, TAU = Math.PI * 2, CL = C.clamp, PR = C.prog, BT = C.BEAT;
  var PLACES = root.PLACES = root.PLACES || {};
  var HAS_DOC = typeof document !== 'undefined';
  var FL = '"Barlow Condensed","Tiro Devanagari Hindi","Arial Narrow",sans-serif';   // labels (falls back to Tiro for the rupee sign)
  var FD = '"Tiro Devanagari Hindi","Barlow Condensed",serif';                        // Devanagari
  var FS = C.FONTS.serif;
  try { if (HAS_DOC && document.fonts && document.fonts.load) document.fonts.load('400 40px "Tiro Devanagari Hindi"', '\u0935\u0921\u093e \u20b9'); } catch (e) {}
  var INK = 0;                                     // > 0 while drawing inside a sticker (it casts its own shadow, so inner pieces cast none)
  function PP(pts, fill, o) { if (INK) { o = Object.assign({}, o || {}); o.shadow = false; } return C.paper(pts, fill, o); }
  function stk(x, y, w, h, fn, o) { C.sticker(x, y, w, h, function (g) { INK++; try { fn(g); } finally { INK--; } }, o); }

  /* ================================================================ shared kit */
  function lerp(a, b, f) { return a + (b - a) * f; }
  function hex(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function shade(col, f) { var a = hex(col); return 'rgb(' + Math.round(a[0] * (1 - f)) + ',' + Math.round(a[1] * (1 - f)) + ',' + Math.round(a[2] * (1 - f)) + ')'; }
  function tint(col, f) { var a = hex(col); return 'rgb(' + Math.round(a[0] + (255 - a[0]) * f) + ',' + Math.round(a[1] + (255 - a[1]) * f) + ',' + Math.round(a[2] + (255 - a[2]) * f) + ')'; }
  function mixc(c1, c2, f) { var a = hex(c1), b = hex(c2); return 'rgb(' + Math.round(lerp(a[0], b[0], f)) + ',' + Math.round(lerp(a[1], b[1], f)) + ',' + Math.round(lerp(a[2], b[2], f)) + ')'; }
  function T(s, x, y, size, col, al, wt, font, ls) {
    var c = C.ctx; c.save(); c.font = (wt || 700) + ' ' + size + 'px ' + (font || FL); c.fillStyle = col || P.ink; c.textAlign = al || 'left'; c.textBaseline = 'middle';
    if (ls && 'letterSpacing' in c) c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.restore();
  }
  function fitSize(s, maxW, size, wt, font) { var c = C.ctx; c.save(); c.font = (wt || 700) + ' ' + size + 'px ' + (font || FL); while (c.measureText(s).width > maxW && size > 8) { size -= 2; c.font = (wt || 700) + ' ' + size + 'px ' + (font || FL); } c.restore(); return size; }
  function TF(s, x, y, maxW, size, col, al, wt, font, ls) { T(s, x, y, fitSize(s, maxW, size, wt, font), col, al, wt, font, ls); }
  function blob(cx, cy, rx, ry, seed, n, jit) { var r = C.rand(seed), pts = []; n = n || 14; jit = jit == null ? 0.18 : jit; for (var i = 0; i < n; i++) { var a = i / n * TAU, k = 1 + (r() - 0.5) * 2 * jit; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return pts; }
  function poly(pts, fill) { var c = C.ctx; C.path(pts); c.fillStyle = fill; c.fill(); }
  function rrect(x, y, w, h, r) { var c = C.ctx; c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  function tape(x, y, w, rot, seed) { var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot); PP(C.torn(-w / 2, -11, w, 22, seed || 3, 1.4), 'rgba(238,226,184,0.82)', { shadow: false }); c.restore(); }
  function fade(t, a, b, fi, fo) { return CL((t - a) / (fi || 0.4)) * CL((b - t) / (fo || 0.5)); }
  function rupees(n) { return '₹' + (Math.round(n / 500) * 500).toLocaleString('en-IN'); }
  function swing(ph, amt) { var s = Math.sin(ph) * (amt == null ? 0.55 : amt); return { armL: [s, 0.12], armR: [-s, 0.12] }; }
  function who(c, name, x, y, h, o) { return CAST.draw(c, name, x, y, h, o); }
  // head-and-shoulders portrait of a cast member, clipped to a (possibly torn) rectangle
  function portrait(c, name, bx, by, bw, bh, bg, o) {
    o = o || {}; c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.fillStyle = bg; c.fillRect(bx, by, bw, bh);
    var H = bh * (o.zoom || 2.9);
    who(c, name, bx + bw * (o.cx == null ? 0.44 : o.cx), by + bh * (o.cy == null ? 0.46 : o.cy) + 0.88 * H, H, { face: o.face || 'smile', t: o.t || 0, blink: false, look: o.look });
    c.restore();
  }

  function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }
  // caption through an off-screen strip so the strip and the text fade together
  var capCv = null;
  function cap(text, t, a, b) {
    if (t < a || t > b) return; var al = fade(t, a, b, 0.05, 0.45), p = PR(t, a, a + Math.max(1, (b - a) * 0.55));
    if (al < 0.003) return; if (al > 0.995 || !HAS_DOC) { C.caption(text, [], p, 880); return; }
    if (!capCv) { capCv = document.createElement('canvas'); capCv.width = 3840; capCv.height = 400; }
    var g = capCv.getContext('2d'), prev = C.ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 3840, 400); g.scale(2, 2); g.translate(0, -780);
    C.use(g); C.caption(text, [], p, 880); C.use(prev);
    prev.save(); prev.globalAlpha *= al; prev.drawImage(capCv, 0, 780, 1920, 200); prev.restore();
  }
  // shots on the beat grid: [{ a: first beat, b: end beat, keys: [[dt, x, y, z, ease?], ...] }]; returns { cam, i, lt, s }
  function shotsAt(t, shots) {
    var i = 0; for (var k = shots.length - 1; k >= 0; k--) if (t >= shots[k].a * BT - 1e-6) { i = k; break; }
    var s = shots[i], lt = t - s.a * BT;
    var cam = C.track(lt, s.keys.map(function (q) { return { t: q[0], x: q[1], y: q[2], z: q[3], ease: q[4] }; }));
    cam = C.bump(C.drift(cam, t), t);
    return { cam: cam, i: i, lt: lt, s: s };
  }
  // parallax: a layer with factor k moves k times as much as the camera (far < 1 < near)
  function pcam(cam, k) { return { x: 960 + (cam.x - 960) * k, y: 540 + (cam.y - 540) * k, z: 1 + (cam.z - 1) * k }; }
  function lay(cam, k, fn) { C.withCam(pcam(cam, k), fn); }
  function pop(t, tb, d) { return C.back(PR(t, tb, tb + (d || 0.34))); }
  function stampP(t, tb) { return 0.5 * (t - (tb - 0.2)) / 0.2; }          // C.inkStamp progress that LANDS (p = 0.5) on tb
  function tcol(col, a) { return col.charAt(0) === '#' ? 'rgba(' + hex(col).join(',') + ',' + a + ')' : col; }
  // cardboard ground + a slowly turning sunburst (screen space)
  function ground(col, ray, t, n, a) { C.cardboard(col); if (ray) C.sunburst(960, 540, 0, 1900, n || 26, ray, a == null ? 1 : a, t * 0.05); }
  // a torn print of a photo with a slow Ken Burns push inside the frame. Returns false if the photo is not loaded.
  function printKB(img, x, y, w, h, seed, zoom, fx, fy, o) {
    if (!img || !img.naturalWidth) return false; o = o || {}; var c = C.ctx, b = 14;
    C.paperPiece(C.tornRect2(x, y, w, h, seed, 6), '#f4ecd8', { sy: 10, blur: 18 });
    var inner = C.tornRect2(x + b, y + b, w - 2 * b, h - 2 * b, seed + 50, 3, 'tb'), iw = w - 2 * b, ih = h - 2 * b;
    var ir = img.naturalWidth / img.naturalHeight, r = iw / ih, cw = (ir > r ? ih * ir : iw) * zoom, ch = (ir > r ? ih : iw / ir) * zoom;
    c.save(); c.beginPath(); c.moveTo(inner[0][0], inner[0][1]); for (var i = 1; i < inner.length; i++) c.lineTo(inner[i][0], inner[i][1]); c.closePath(); c.clip();
    c.filter = o.filter || 'grayscale(1) contrast(1.15) brightness(1.06)';
    c.drawImage(img, x + b - (cw - iw) * fx, y + b - (ch - ih) * fy, cw, ch); c.filter = 'none';
    if (o.tint) { c.globalCompositeOperation = 'multiply'; c.fillStyle = o.tint; c.fillRect(x, y, w, h); c.globalCompositeOperation = 'source-over'; }
    c.restore(); return true;
  }
  // a wide paper strip (road, pavement) torn along its top and bottom edges
  function strip(x, y, w, h, fill, seed, o) { C.paperPiece(C.tornRect2(x, y, w, h, seed, 5, 'tb'), fill, Object.assign({ dots: '#000', dotA: 0.10, grain: 0.22, sy: 7, blur: 12 }, o || {})); }
  function kerbStrip(x0, y0, x1) { var c = C.ctx; c.fillStyle = '#e8e0cc'; c.fillRect(x0, y0, x1 - x0, 10); for (var x = x0; x < x1; x += 56) { c.fillStyle = (Math.floor((x - x0) / 56) % 2) ? '#26221f' : '#f2c230'; c.fillRect(x, y0 + 10, 56, 14); } }
  var FACE_PX = 0.88;

  /* ---------------- hoardings: Pune's coaching clutter ---------------- */
  function hoarding(x, y, w, h, o) {
    var c = C.ctx; c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(o.rot || 0);
    PP(C.torn(-w / 2, -h / 2, w, h, o.seed || 5, 2.2), o.bg, { halftone: o.ht == null ? 0.35 : o.ht, dot: 'rgba(31,27,24,0.14)', lift: 5, blur: 9 });
    c.strokeStyle = o.acc || o.fg; c.lineWidth = 3; c.strokeRect(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18);
    var faces = o.faces || 0, tw = w - 36, ty = -h / 2 + h * 0.2;
    if (faces) tw = w * 0.52;
    TF(o.title, -w / 2 + 20 + (faces ? 0 : 0), ty, faces ? tw : w - 40, h * 0.27, o.fg, 'left', 800);
    if (o.sub) TF(o.sub, -w / 2 + 20, ty + h * 0.23, faces ? tw : w - 40, h * 0.13, o.acc || o.fg, 'left', 700);
    if (o.tag) { var tg = o.tag; c.save(); c.translate(-w / 2 + 20, h / 2 - 28); PP(C.torn(0, -16, Math.min(w - 60, tg.length * h * 0.085 + 24), 32, (o.seed || 5) + 4, 1.5), o.acc || P.coral, { shadow: false }); T(tg, 12, 0, h * 0.14, o.bg, 'left', 800); c.restore(); }
    for (var i = 0; i < faces; i++) {
      var pw = h * 0.5, px = w / 2 - 12 - (faces - i) * (pw * 0.78) - 4, py = -h / 2 + h * 0.2 + (i % 2) * 6;
      c.save(); c.translate(px, py); c.beginPath(); c.arc(pw / 2, pw / 2, pw / 2, 0, TAU); c.clip(); c.translate(-px, -py);
      portrait(c, 'extra:' + (((o.seed || 0) % 11) * 2 + i * 5 + 1), px, py, pw, pw, mixc(o.bg, '#ffffff', 0.5), { face: 'grin', zoom: 3.1 }); c.restore();
      c.strokeStyle = o.fg; c.lineWidth = 2.5; c.beginPath(); c.arc(px + pw / 2, py + pw / 2, pw / 2, 0, TAU); c.stroke();
    }
    if (o.burst) { c.save(); c.translate(w / 2 - h * 0.34, h / 2 - h * 0.28); c.rotate(0.2); var pts = [], r = h * 0.3; for (var k = 0; k < 20; k++) { var a = k / 20 * TAU, rr = k % 2 ? r * 0.72 : r; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } PP(pts, o.burstBg || P.coral, { shadow: false, lift: 3 }); TF(o.burst, 0, 0, r * 1.2, h * 0.2, o.burstFg || '#fff', 'center', 800); c.restore(); }
    tape(-w / 2 + 28, -h / 2 + 4, 46, -0.5, (o.seed || 1) + 1); tape(w / 2 - 28, -h / 2 + 4, 46, 0.5, (o.seed || 1) + 2);
    c.restore();
  }
  var FAR_HOARDS = [
    { x: -640, y: 150, w: 310, h: 180, bg: '#f6d03c', fg: '#1f1b18', acc: '#d8322a', title: 'RANKERS’ ADDA', sub: 'NEET · JEE · FOUNDATION', tag: 'ADMISSIONS OPEN', faces: 3, rot: -0.025, seed: 101 },
    { x: -310, y: 270, w: 220, h: 126, bg: '#d6336c', fg: '#ffffff', acc: '#ffe27a', title: 'TOPPER’S PATH', sub: 'BATCHES FROM 1 JUNE', rot: 0.03, seed: 102 },
    { x: -120, y: 130, w: 262, h: 150, bg: '#1fa463', fg: '#ffffff', acc: '#fff3a8', title: 'IIT-JEE FOUNDATION', sub: 'CLASS 8 · 9 · 10', burst: '100%', burstBg: '#e2332a', rot: -0.02, seed: 103 },
    { x: 180, y: 262, w: 214, h: 128, bg: '#27a4d8', fg: '#0f2a44', acc: '#0f2a44', title: 'CRACK IT', sub: '100% RESULT*', tag: '*TERMS APPLY', rot: 0.02, seed: 104 },
    { x: 1050, y: 128, w: 250, h: 150, bg: '#ef7d1d', fg: '#ffffff', acc: '#1f1b18', title: 'SPARK MATHS HUB', sub: 'CLASS 11 · 12 · CET', faces: 2, rot: 0.02, seed: 105 },
    { x: 1310, y: 240, w: 230, h: 138, bg: '#7d3fb5', fg: '#ffffff', acc: '#ffd44a', title: 'MEDICOS’ MANTRA', sub: 'NEET REPEATERS', tag: 'BATCH FULL', rot: -0.02, seed: 106 },
    { x: 1030, y: 292, w: 200, h: 96, bg: '#e2332a', fg: '#ffffff', acc: '#ffe27a', title: 'ADMISSIONS OPEN', sub: 'LIMITED SEATS', rot: -0.03, seed: 107 }
  ];

  function windowBox(x, y, w, h, seed, col) {
    var c = C.ctx, r = C.rand(seed);
    PP(C.torn(x - 5, y - 5, w + 10, h + 10, seed, 1), '#f3ead6', { lift: 2, blur: 4, shadowAlpha: 0.2 });
    c.fillStyle = '#39404c'; c.fillRect(x, y, w, h);
    if (r() < 0.45) { c.fillStyle = col || '#d98a4a'; c.fillRect(x, y, w * 0.5, h); }                    // a curtain
    c.strokeStyle = 'rgba(243,234,214,0.8)'; c.lineWidth = 2; for (var i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x + i * w / 4, y); c.lineTo(x + i * w / 4, y + h); c.stroke(); }
    c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
    if (r() < 0.3) { PP([[x + w - 34, y + h - 26], [x + w + 6, y + h - 26], [x + w + 6, y + h + 2], [x + w - 34, y + h + 2]], '#e8e4da', { lift: 2, blur: 4, shadowAlpha: 0.25 }); c.fillStyle = '#9a958b'; for (var g = 0; g < 4; g++) c.fillRect(x + w - 30 + g * 8, y + h - 20, 4, 18); }   // AC unit
  }
  /* ---------------- vehicles ---------------- */
  function wheel(x, y, r, ang) {
    var c = C.ctx; c.save(); c.translate(x, y); c.fillStyle = '#26221f'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.fillStyle = '#b9b2a4'; c.beginPath(); c.arc(0, 0, r * 0.48, 0, TAU); c.fill(); c.rotate(ang); c.strokeStyle = '#6b655c'; c.lineWidth = 2;
    for (var i = 0; i < 4; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-r * 0.48, 0); c.lineTo(r * 0.48, 0); c.stroke(); }
    c.restore();
  }
  // black-and-yellow auto-rickshaw, side view. (x,y) = ground under the middle; dir +1 faces right.
  function auto(x, y, s, dir, dist, o) {
    o = o || {}; var c = C.ctx; c.save(); c.translate(x, y); c.scale(dir * s, s);
    c.shadowColor = 'rgba(40,25,10,0.3)'; c.shadowBlur = 10; c.shadowOffsetY = 5;
    var body = o.body || '#25221f', roof = o.roof || '#f2c230';
    // lower body
    c.fillStyle = body; c.beginPath(); c.moveTo(-76, -30); c.lineTo(-76, -58); c.quadraticCurveTo(-74, -66, -60, -66); c.lineTo(40, -62); c.quadraticCurveTo(66, -58, 74, -30); c.lineTo(66, -22); c.lineTo(-70, -22); c.closePath(); c.fill();
    c.shadowColor = 'transparent';
    // canopy
    c.fillStyle = roof; c.beginPath(); c.moveTo(-74, -64); c.quadraticCurveTo(-76, -112, -50, -114); c.lineTo(34, -112); c.quadraticCurveTo(52, -108, 58, -92); c.lineTo(48, -90); c.lineTo(30, -66); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.moveTo(-60, -108); c.lineTo(20, -108); c.lineTo(14, -100); c.lineTo(-62, -100); c.closePath(); c.fill();
    // open side: cabin interior, driver, a passenger
    c.fillStyle = '#4a4540'; c.beginPath(); c.moveTo(-68, -64); c.lineTo(28, -64); c.lineTo(46, -88); c.lineTo(-68, -92); c.closePath(); c.fill();
    c.fillStyle = o.pax || '#d9628c'; c.beginPath(); c.arc(-40, -82, 9, 0, TAU); c.fill(); c.fillRect(-52, -74, 24, 14);        // passenger
    c.fillStyle = '#8d5a3c'; c.beginPath(); c.arc(-40, -87, 6.5, 0, TAU); c.fill();
    c.fillStyle = '#c9b88a'; c.beginPath(); c.arc(10, -78, 9, 0, TAU); c.fill(); c.fillRect(0, -70, 20, 16);                     // driver's khaki shirt
    c.fillStyle = '#9a6648'; c.beginPath(); c.arc(10, -88, 6.4, 0, TAU); c.fill();
    c.fillStyle = '#2b2623'; c.beginPath(); c.arc(10, -92, 6.6, Math.PI * 1.05, TAU * 0.99); c.fill();
    // windscreen + nose + headlamp
    c.fillStyle = 'rgba(190,226,240,0.85)'; c.beginPath(); c.moveTo(34, -90); c.lineTo(48, -90); c.lineTo(34, -66); c.lineTo(28, -66); c.closePath(); c.fill();
    c.fillStyle = body; c.beginPath(); c.moveTo(48, -52); c.quadraticCurveTo(78, -50, 84, -28); c.lineTo(66, -24); c.lineTo(46, -34); c.closePath(); c.fill();
    c.fillStyle = '#fff6c9'; c.beginPath(); c.arc(76, -44, 5, 0, TAU); c.fill();
    c.fillStyle = roof; c.fillRect(-74, -40, 120, 6);                                                                           // yellow beltline
    c.fillStyle = '#d9628c'; c.fillRect(-14, -58, 20, 8); c.fillStyle = '#fbf5e8'; c.fillRect(-12, -56, 16, 4);               // number plate
    var ang = dist * 0.06; wheel(50, -17, 17, ang); wheel(-44, -17, 17, ang);
    c.restore();
  }
  function scooter(x, y, s, dir, dist, o) {
    o = o || {}; var c = C.ctx; c.save(); c.translate(x, y); c.scale(dir * s, s);
    c.shadowColor = 'rgba(40,25,10,0.3)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
    var col = o.col || '#d8322a';
    c.fillStyle = col; c.beginPath(); c.moveTo(-50, -30); c.quadraticCurveTo(-52, -52, -30, -52); c.lineTo(8, -46); c.quadraticCurveTo(30, -38, 36, -22); c.lineTo(10, -20); c.lineTo(-44, -20); c.closePath(); c.fill();   // body
    c.beginPath(); c.moveTo(30, -26); c.quadraticCurveTo(44, -62, 46, -90); c.lineTo(58, -88); c.quadraticCurveTo(58, -50, 50, -22); c.closePath(); c.fill();                                                             // front shield
    c.shadowColor = 'transparent'; c.fillStyle = '#2b2623'; c.beginPath(); c.moveTo(-46, -50); c.lineTo(-10, -52); c.lineTo(-6, -58); c.lineTo(-48, -60); c.closePath(); c.fill();                                      // seat
    c.strokeStyle = '#2b2623'; c.lineWidth = 4; c.beginPath(); c.moveTo(44, -88); c.lineTo(36, -98); c.lineTo(52, -100); c.stroke();
    wheel(42, -14, 14, dist * 0.07); wheel(-38, -14, 14, dist * 0.07);
    // rider
    c.fillStyle = o.shirt || '#4b6fa8'; c.beginPath(); c.moveTo(-34, -60); c.quadraticCurveTo(-34, -104, -14, -106); c.lineTo(8, -98); c.lineTo(20, -84); c.lineTo(10, -78); c.lineTo(-2, -86); c.lineTo(-10, -62); c.closePath(); c.fill();
    c.fillStyle = o.skin || '#9a6648'; c.beginPath(); c.arc(-6, -116, 9, 0, TAU); c.fill();
    c.fillStyle = o.helmet || '#f2c230'; c.beginPath(); c.arc(-6, -118, 10.5, Math.PI * 0.95, TAU * 1.02); c.fill();
    c.fillStyle = '#2c3442'; c.fillRect(-14, -66, 28, 12); c.fillRect(10, -62, 8, 30);
    c.restore();
  }
  // ground traffic: deterministic from t. Returns drawables for a lane, far first.
  /* ---------------- vada-pav cart, gulmohar, wires ---------------- */
  function steam(x, y, t, n, col) {
    var c = C.ctx; c.save(); for (var i = 0; i < n; i++) { var u = ((t * 0.5 + i / n) % 1), a = Math.sin(u * Math.PI) * 0.5; c.fillStyle = (col || 'rgba(255,255,255,') + a + ')'; c.beginPath(); c.arc(x + Math.sin(u * 7 + i * 2) * 10, y - u * 90, 8 + u * 14, 0, TAU); c.fill(); } c.restore();
  }
  function cart(x, y, t) {                                                // (x,y) = ground at the cart's centre
    var c = C.ctx; c.save(); c.translate(x, y);
    // vendor behind the cart
    var fry = Math.sin(t * 5) * 0.12;
    who(c, 'extra:26', 56, -6, 300, { face: 'neutral', t: t, armL: [0.3, 1.1], armR: [0.95 + fry, 0.7 + fry], flip: true, blink: true });
    // wheels (a handcart: two big wooden wheels)
    [[-92, -4], [96, -4]].forEach(function (w) { c.fillStyle = '#6b4a2f'; c.beginPath(); c.arc(w[0], w[1] - 34, 36, 0, TAU); c.fill(); c.fillStyle = '#b98a57'; c.beginPath(); c.arc(w[0], w[1] - 34, 28, 0, TAU); c.fill(); c.strokeStyle = '#6b4a2f'; c.lineWidth = 3; for (var i = 0; i < 4; i++) { c.save(); c.translate(w[0], w[1] - 34); c.rotate(i * Math.PI / 4); c.beginPath(); c.moveTo(-28, 0); c.lineTo(28, 0); c.stroke(); c.restore(); } });
    PP(C.torn(-150, -156, 308, 96, 71, 2), '#a8703f', { halftone: 0.4, dot: 'rgba(60,30,10,0.18)', lift: 5 });         // counter box
    PP(C.torn(-150, -160, 308, 18, 72, 1.5), '#c98f55', { lift: 3 });
    PP(C.torn(-130, -122, 120, 56, 73, 1.5), '#e0a82e', { shadow: false });
    T('वडापाव', -70, -102, 40, '#8f1f12', 'center', 400, FD); T('₹20', -70, -78, 24, '#8f1f12', 'center', 800);
    // display: pav stack + vada tray
    for (var i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#f0d9a8' : '#e8c88c'; c.beginPath(); c.ellipse(-110 + i * 6, -168 - i * 2, 22, 11, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#e0a82e'; for (i = 0; i < 6; i++) { c.beginPath(); c.arc(-10 + i * 17, -170, 9, 0, TAU); c.fill(); }
    c.fillStyle = '#3d7a3b'; c.fillRect(-12, -158, 100, 5);
    // kadhai on a flame
    var fl = 0.7 + 0.3 * Math.sin(t * 17);
    c.fillStyle = '#e2664f'; c.beginPath(); c.moveTo(70, -160); c.quadraticCurveTo(86, -190 * fl + 4, 100, -160); c.fill(); c.fillStyle = '#ffd44a'; c.beginPath(); c.moveTo(78, -160); c.quadraticCurveTo(87, -178 * fl, 94, -160); c.fill();
    PP([[56, -166], [118, -166], [110, -186], [64, -186]], '#33302d', { lift: 3, blur: 6 }); c.fillStyle = '#6b655c'; c.fillRect(60, -168, 54, 4);
    steam(88, -194, t, 4);
    // awning on bamboo poles
    c.strokeStyle = '#8a6a3b'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-136, -150); c.lineTo(-140, -330); c.moveTo(140, -150); c.lineTo(146, -330); c.stroke();
    for (var s = 0; s < 8; s++) PP([[-170 + s * 44, -330], [-126 + s * 44, -330], [-122 + s * 44, -296 + (s % 2) * 3], [-174 + s * 44, -296 + (s % 2) * 3]], s % 2 ? '#fbf5e8' : '#d8322a', { lift: 3, blur: 7, shadowAlpha: 0.24 });
    c.strokeStyle = '#2b2623'; c.lineWidth = 2; c.beginPath(); c.moveTo(-60, -296); c.lineTo(-60, -280); c.moveTo(60, -296); c.lineTo(60, -280); c.stroke();
    c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(-60, -272, 7, 0, TAU); c.arc(60, -272, 7, 0, TAU); c.fill();
    PP(C.torn(-128, -392, 256, 54, 74, 1.6), '#f6d03c', { lift: 4, blur: 8 }); T('वडा पाव', -56, -366, 40, '#8f1f12', 'center', 400, FD); T('HOT · ₹20', 78, -366, 26, '#8f1f12', 'center', 800);
    c.restore();
  }
  function gulmohar(x, y, t) {
    var c = C.ctx; c.save(); c.translate(x, y);
    PP([[-22, 0], [22, 0], [18, -130], [34, -230], [70, -330], [48, -334], [10, -260], [0, -200], [-10, -262], [-52, -340], [-76, -330], [-34, -226], [-20, -130]], '#6b4a35', { lift: 5, blur: 10, halftone: 0.3 });
    var seeds = [[-180, -400, 150, 90], [-70, -470, 160, 100], [70, -450, 170, 96], [190, -390, 140, 88], [10, -380, 150, 90], [-110, -350, 120, 70], [120, -340, 120, 70]];
    seeds.forEach(function (b, i) { PP(blob(b[0] + Math.sin(t * 0.8 + i) * 3, b[1], b[2], b[3], 600 + i, 18, 0.16), i % 3 === 0 ? '#2f7f4a' : '#3e9457', { lift: 6, blur: 12, halftone: 0.2, dot: 'rgba(255,255,255,0.18)' }); });
    var r = C.rand(77);
    for (var k = 0; k < 90; k++) { var a = r() * TAU, d = Math.sqrt(r()) * 1, bx = Math.cos(a) * d * 250, by = -400 + Math.sin(a) * d * 120; if (r() < 0.3) continue; c.fillStyle = r() < 0.5 ? '#e8452a' : '#f06a2a'; c.beginPath(); c.ellipse(bx, by, 11 + r() * 7, 8 + r() * 5, r() * 3, 0, TAU); c.fill(); }
    c.restore();
  }
  function petals(t, x0, x1, ytop, ybot, n, seed) {
    var c = C.ctx, r = C.rand(seed); c.save();
    for (var i = 0; i < n; i++) { var px = lerp(x0, x1, r()), ph = r(), sp = 0.12 + r() * 0.12, u = ((t * sp + ph) % 1 + 1) % 1, y = lerp(ytop, ybot, u), x = px + Math.sin(u * 9 + i) * 26 + u * 40; c.save(); c.translate(x, y); c.rotate(u * 7 + i); c.fillStyle = i % 3 ? '#e8452a' : '#f2894a'; c.beginPath(); c.ellipse(0, 0, 7, 4, 0, 0, TAU); c.fill(); c.restore(); }
    c.restore();
  }
  function wires(t) {
    var c = C.ctx; c.save(); c.strokeStyle = 'rgba(40,36,34,0.85)'; c.lineWidth = 2.4; c.lineCap = 'round';
    [[48, 30], [64, 38], [86, 50], [102, 62]].forEach(function (w, i) { c.beginPath(); c.moveTo(-1200, w[0] - 6 * i); for (var x = -1200; x <= 2800; x += 200) c.quadraticCurveTo(x + 100, w[0] + w[1] + (i % 2) * 6 + 18 * Math.sin(x * 0.01 + i), x + 200, w[0] + 2 * Math.sin(x * 0.013 + i)); c.stroke(); });
    c.restore();
  }
  function crow(x, y, t, ph) { var c = C.ctx; c.save(); c.translate(x, y); c.fillStyle = '#2b2623'; c.beginPath(); c.ellipse(0, 0, 11, 7, -0.2, 0, TAU); c.fill(); c.beginPath(); c.arc(11, -6, 5, 0, TAU); c.fill(); c.beginPath(); c.moveTo(15, -7); c.lineTo(24, -5); c.lineTo(15, -4); c.fill(); c.beginPath(); c.moveTo(-10, 2); c.lineTo(-24, 6 + Math.sin(t * 2 + ph) * 1.5); c.lineTo(-10, 6); c.fill(); c.restore(); }
  function kerb(y0, x0, x1) { var c = C.ctx; c.fillStyle = '#e8e0cc'; c.fillRect(x0, y0, x1 - x0, 12); for (var x = x0; x < x1; x += 60) { c.fillStyle = (Math.floor(x / 60) % 2) ? '#26221f' : '#f2c230'; c.fillRect(x, y0 + 12, 60, 14); } }
  /* ---------------- the BrightPath banner (glossy vinyl, not torn paper) ---------------- */
  var BP = { x: 0, y: 0, w: 580, h: 288 };
  function brightBanner(t, u, o) {
    o = o || {}; var c = C.ctx, vis = BP.h * u; if (u <= 0.001) return;
    c.save(); c.beginPath(); c.rect(BP.x - 20, BP.y - 20, BP.w + 40, vis + 20 + 20); c.clip();
    var wave = (1 - u) * 14 + 3;
    c.save(); c.translate(BP.x, BP.y);
    if (!INK) { c.shadowColor = 'rgba(20,10,60,0.35)'; c.shadowBlur = 16; c.shadowOffsetY = 8; }
    var g = c.createLinearGradient(0, 0, BP.w, BP.h); g.addColorStop(0, '#2218c8'); g.addColorStop(0.55, '#5a2de0'); g.addColorStop(1, '#9a35e6');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(BP.w, 0); for (var x = BP.w; x >= 0; x -= 20) c.lineTo(x, vis + Math.sin(x * 0.03 + t * 3) * wave * 0.4); c.closePath(); c.fill(); c.shadowColor = 'transparent';
    c.clip();
    // circuit-ish lines
    c.strokeStyle = 'rgba(190,170,255,0.22)'; c.lineWidth = 2; for (var i = 0; i < 6; i++) { c.beginPath(); c.moveTo(BP.w * 0.52, 30 + i * 36); c.lineTo(BP.w * 0.62 + (i % 3) * 14, 30 + i * 36); c.lineTo(BP.w * 0.7, 52 + i * 36); c.stroke(); }
    // logo mark: a bright star-eye
    c.save(); c.translate(70, 64); c.fillStyle = '#c6f432'; c.beginPath(); for (var k = 0; k < 8; k++) { var a = k / 8 * TAU, r = k % 2 ? 14 : 34; c.lineTo(Math.cos(a - 1.57) * r, Math.sin(a - 1.57) * r); } c.closePath(); c.fill(); c.fillStyle = '#2218c8'; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill(); c.restore();
    T('BrightPath', 108, 62, 76, '#ffffff', 'left', 800, FL, 1);
    T('AI ACADEMY', 114, 120, 44, '#c6f432', 'left', 800, FL, 6);
    T('Your own AI tutor, 24\u00d77.', 112, 162, 27, '#e6dcff', 'left', 500);
    // girl with a tablet, in a bubble
    c.save(); c.beginPath(); c.arc(BP.w - 92, 112, 66, 0, TAU); c.clip(); portrait(c, 'extra:5', BP.w - 158, 46, 132, 132, '#ffd44a', { face: 'grin', zoom: 3.2, t: t }); c.restore();
    c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.beginPath(); c.arc(BP.w - 92, 112, 66, 0, TAU); c.stroke();
    PP(C.torn(BP.w - 172, 168, 160, 34, 3, 1.2), '#ffffff', { lift: 3, blur: 6 }); T('Doubt solved ✓', BP.w - 92, 185, 24, '#2218c8', 'center', 800);
    // price band
    c.fillStyle = '#ffd44a'; c.fillRect(0, BP.h - 74, BP.w, 74); c.fillStyle = '#1b1263'; c.fillRect(0, BP.h - 78, BP.w, 6);
    T('₹9,999 a year', 28, BP.h - 37, 66, '#1b1263', 'left', 800, FL); T('SAME SYLLABUS', BP.w - 22, BP.h - 50, 22, '#1b1263', 'right', 800, FL, 2); T('NO WAITING LIST', BP.w - 22, BP.h - 24, 22, '#e2332a', 'right', 800, FL, 2);
    // gloss sweep
    var sx = ((t * 0.28) % 1.6 - 0.3) * BP.w, sg = c.createLinearGradient(sx - 60, 0, sx + 60, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.28)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sg; c.beginPath(); c.moveTo(sx - 60, 0); c.lineTo(sx + 100, 0); c.lineTo(sx + 40, BP.h); c.lineTo(sx - 120, BP.h); c.closePath(); c.fill();
    c.restore();
    // eyelets + ropes at the top
    c.fillStyle = '#e9e4f5'; [14, BP.w / 2, BP.w - 14].forEach(function (ex) { c.beginPath(); c.arc(BP.x + ex, BP.y + 12, 6, 0, TAU); c.fill(); });
    c.restore();
    // the roll at the bottom edge, shrinking as the banner unrolls
    if (u < 0.995) {
      var ry = BP.y + vis + Math.sin(BP.w * 0.03 + t * 3) * wave * 0.4, rr = 5 + 20 * (1 - u);
      c.save(); if (!INK) { c.shadowColor = 'rgba(20,10,60,0.4)'; c.shadowBlur = 10; c.shadowOffsetY = 5; } var rg = c.createLinearGradient(0, ry - rr, 0, ry + rr); rg.addColorStop(0, '#9a8cf0'); rg.addColorStop(0.5, '#4a2fd8'); rg.addColorStop(1, '#1b1263');
      c.fillStyle = rg; rrect(BP.x - 6, ry - rr, BP.w + 12, rr * 2, rr); c.fill(); c.restore();
      c.strokeStyle = '#d9c9a0'; c.lineWidth = 3; c.beginPath(); c.moveTo(BP.x + BP.w, ry); c.quadraticCurveTo(BP.x + BP.w + 40, ry + 80, o.ropeX || BP.x + BP.w + 60, o.ropeY || 500); c.stroke();
    }
  }

  /* ================================================================ street 2029 */
  var SKYC = '#8fc6e8', GY = 820;
  function isCollapse(road) { var h = false; (road.luck || []).forEach(function (l) { if (l.id === 'collapse' && l.hit) h = true; }); return h; }
  function kindOf(road) { return road.c1 === 'build' ? (road.c2 === 'retrain' ? 'bretrain' : 'bcut') : 'ban'; }
  function hstk(i, x, y, w, h, rot) { var spec = Object.assign({}, FAR_HOARDS[i], { rot: rot == null ? FAR_HOARDS[i].rot : rot }); stk(x, y, w, h, function () { hoarding(0, 0, w, h, spec); }); }
  function printOrFallback(img, x, y, w, h, seed, zoom, fx, fy) {
    if (printKB(img, x, y, w, h, seed, zoom, fx, fy)) return;
    C.paperPiece(C.tornRect2(x, y, w, h, seed, 6), '#f4ecd8', { sy: 10, blur: 18 }); C.paperPiece(C.tornRect2(x + 14, y + 14, w - 28, h - 28, seed + 5, 3, 'tb'), '#b9b2a2', {});
    T('FC ROAD', x + w / 2, y + h / 2, h * 0.22, '#f4ead7', 'center', 800, FL, 4);
  }
  function ladderL(x, y0, y1, tilt) {
    var c = C.ctx; c.save(); c.strokeStyle = '#9a6a3b'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y0); c.lineTo(x + tilt, y1); c.moveTo(x + 40, y0); c.lineTo(x + 40 + tilt, y1); c.stroke(); c.lineWidth = 5;
    for (var i = 0; i <= 9; i++) { var f = i / 9, yy = lerp(y0, y1, f), xx = x + tilt * f; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 40, yy); c.stroke(); } c.restore();
  }
  // the gulmohar canopy as a cut-out (blossoms and leaves); used as a near-layer branch
  function canopyL(t) {
    var c = C.ctx; [[100, 90, 140, 80], [250, 60, 150, 84], [400, 100, 140, 80], [190, 150, 120, 64], [330, 160, 110, 60]].forEach(function (b, i) { PP(blob(b[0] + Math.sin(t * 0.8 + i) * 3, b[1], b[2], b[3], 600 + i, 16, 0.16), i % 3 === 0 ? '#2f7f4a' : '#3e9457', { halftone: 0.2, dot: 'rgba(255,255,255,0.18)' }); });
    var r = C.rand(77); for (var k = 0; k < 70; k++) { var a = r() * TAU, d = Math.sqrt(r()), bx = 250 + Math.cos(a) * d * 220, by = 100 + Math.sin(a) * d * 80; c.fillStyle = r() < 0.5 ? '#e8452a' : '#f06a2a'; c.beginPath(); c.ellipse(bx, by, 11 + r() * 7, 8 + r() * 5, r() * 3, 0, TAU); c.fill(); }
  }
  /* ---- Vidya's front: the modest board, the stair door, a classroom window ---- */
  function vidyaFront(t, o) {
    o = o || {}; var c = C.ctx;
    PP(C.torn(0, 0, 640, 740, 31, 3), '#ecd0aa', { halftone: 0.3, dot: 'rgba(90,60,30,0.12)' }); PP(C.torn(-8, -6, 656, 26, 32, 2), '#b99c7a', {});
    c.fillStyle = 'rgba(120,90,60,0.12)'; for (var s = 0; s < 5; s++) c.fillRect(40 + s * 120, 24, 16, 160 + (s * 53) % 80);
    for (var i = 0; i < 3; i++) {
      var wx = 26 + i * 204, wy = 50, ww = 168, wh = 150;
      PP(C.torn(wx - 8, wy - 8, ww + 16, wh + 16, 40 + i, 1.4), '#f3ead6', {});
      c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip(); c.fillStyle = '#f2d79b'; c.fillRect(wx, wy, ww, wh); c.fillStyle = 'rgba(255,240,190,0.5)'; c.fillRect(wx, wy, ww, wh * 0.4);
      if (i === 0 && o.meera) who(c, 'meera', wx + ww * 0.55, wy + wh * 0.5 + FACE_PX * 420, 420, { face: o.meeraFace || 'smile', t: t, armL: CAST.ARMS.down.armL, armR: [2.7 + Math.sin(t * 7) * 0.22, 0.4], flip: true });
      else for (var k = 0; k < 3; k++) who(c, 'extra:' + (30 + i * 3 + k), wx + 34 + k * 62, wy + wh + 110, 270, { t: t + k, face: k === 1 ? 'talk' : 'neutral' });
      c.restore(); c.strokeStyle = '#6b4a35'; c.lineWidth = 5; c.strokeRect(wx, wy, ww, wh); c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh * 0.5); c.lineTo(wx + ww, wy + wh * 0.5); c.stroke();
    }
    c.strokeStyle = '#4a423b'; c.lineWidth = 4; c.beginPath(); c.moveTo(20, 252); c.lineTo(620, 252); c.moveTo(20, 226); c.lineTo(620, 226); c.stroke(); for (var b = 0; b < 19; b++) { c.beginPath(); c.moveTo(26 + b * 31.5, 226); c.lineTo(26 + b * 31.5, 252); c.stroke(); }
    [[60, '#c2522d'], [250, '#d9a933'], [470, '#c2522d']].forEach(function (pt, k) { PP(C.torn(pt[0], 224, 34, 28, 60 + k, 1), pt[1], {}); c.fillStyle = k === 1 ? '#e8452a' : '#3e9457'; c.beginPath(); c.arc(pt[0] + 17, 218, 18, Math.PI, TAU); c.fill(); });
    var bx = 22, by = 286, bw = 596, bh = 118;
    PP(C.torn(bx, by, bw, bh, 33, 2), '#1d5552', { halftone: 0.3, dot: 'rgba(255,255,255,0.08)' }); c.strokeStyle = '#f4ead7'; c.lineWidth = 3; c.strokeRect(bx + 10, by + 10, bw - 20, bh - 20);
    T('VIDYA CLASSES', bx + bw / 2, by + 48, 70, '#f4ead7', 'center', 800, FL, 3); T('PHYSICS · CHEMISTRY · MATHS · SINCE 2009', bx + bw / 2, by + 92, 25, '#e8c58a', 'center', 700, FL, 2);
    var dx = 48, dy = 450, dw = 140, dh = 290;
    PP(C.torn(dx - 12, dy - 12, dw + 24, dh + 12, 34, 1.6), '#8a5a3b', {});
    var dg = c.createLinearGradient(dx, dy, dx, dy + dh); dg.addColorStop(0, '#f2c48d'); dg.addColorStop(0.3, '#6a4a32'); dg.addColorStop(1, '#2b2018'); c.fillStyle = dg; c.fillRect(dx, dy, dw, dh);
    c.fillStyle = 'rgba(0,0,0,0.25)'; for (var st = 0; st < 7; st++) { c.beginPath(); c.moveTo(dx + 6 + st * 8, dy + dh - st * 30); c.lineTo(dx + dw - 6, dy + dh - st * 30 - 22); c.lineTo(dx + dw - 6, dy + dh - st * 30 - 2); c.lineTo(dx + 6 + st * 8, dy + dh - st * 30 + 20); c.fill(); }
    c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(dx + dw / 2, dy + 26, 10, 0, TAU); c.fill();
    PP(C.torn(228, 476, 150, 92, 35, 1.4), '#fbf5e8', {}); T('1st FLOOR ↑', 303, 506, 28, '#1d5552', 'center', 800); T('Admissions · 10–6', 303, 542, 20, '#4a423b', 'center', 500);
    PP(C.torn(420, 520, 200, 220, 37, 1.5), '#8d9aa3', {}); c.strokeStyle = 'rgba(40,50,60,0.35)'; c.lineWidth = 2; for (var y = 532; y < 740; y += 10) { c.beginPath(); c.moveTo(424, y); c.lineTo(616, y); c.stroke(); }
    if (o.fee) { c.save(); c.translate(520, 600); c.rotate(-0.05); PP(C.torn(-92, -58, 184, 116, 36, 1.6), '#ffd44a', {}); T('NEW FEE', 0, -30, 30, '#8f1f12', 'center', 800, FL, 2); T(o.fee, 0, 16, 60, '#1f1b18', 'center', 800); tape(-64, -60, 40, -0.3, 8); tape(64, -60, 40, 0.3, 9); c.restore(); }
  }
  function bpFront(t) {
    var c = C.ctx;
    PP(C.torn(0, 0, 520, 560, 131, 3), '#e9e1f7', { halftone: 0.25, dot: 'rgba(60,40,120,0.10)' }); PP(C.torn(-8, -6, 536, 22, 132, 2), '#c9bfe6', {});
    c.save(); c.translate(36, 26); c.scale(0.86, 0.86); brightBanner(t, 1, {}); c.restore();
    PP(C.torn(60, 292, 400, 38, 133, 1.4), '#c6f432', {}); T('ADMISSIONS OPEN · JOIN TODAY', 260, 311, 26, '#1b1263', 'center', 800, FL, 2);
    PP(C.torn(150, 350, 220, 210, 134, 1.5), '#3b3470', {});
    var g = c.createLinearGradient(0, 360, 0, 560); g.addColorStop(0, '#d8ecff'); g.addColorStop(1, '#8fc6e8'); c.fillStyle = g; c.fillRect(162, 362, 196, 198);
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(182, 362); c.lineTo(230, 362); c.lineTo(186, 560); c.lineTo(162, 560); c.closePath(); c.fill(); c.strokeStyle = '#3b3470'; c.lineWidth = 5; c.beginPath(); c.moveTo(260, 362); c.lineTo(260, 560); c.stroke();
  }
  /* ---- MegaRank (invented): the board, the notice, the padlock ---- */
  function megaBoardL(t) {
    var c = C.ctx, w = 1100, h = 290; c.save(); c.rotate(0.032 + Math.sin(t * 1.3) * 0.004);
    PP(C.torn(0, 0, w, h, 301, 2.5), '#a8121f', { halftone: 0.4, dot: 'rgba(0,0,0,0.16)' });
    var g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,90,60,0.35)'); g.addColorStop(1, 'rgba(120,0,20,0.25)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#f2c230'; c.lineWidth = 6; c.strokeRect(14, 14, w - 28, h - 28);
    T('MEGARANK', 48, 100, 150, '#f2c230', 'left', 800, FL, 2); T('ACADEMY', 52, 196, 78, '#fbf5e8', 'left', 800, FL, 14); T('INDIA’S No.1 · JEE · NEET · FOUNDATION', 52, 250, 32, '#f2c230', 'left', 700, FL, 3);
    for (var i = 0; i < 6; i++) { var px = 640 + (i % 3) * 150, py = 40 + Math.floor(i / 3) * 130, pw = 118; c.save(); c.beginPath(); c.arc(px + pw / 2, py + pw / 2, pw / 2, 0, TAU); c.clip(); portrait(c, 'extra:' + (40 + i * 5), px, py, pw, pw, ['#ffe27a', '#9fd2c6', '#f2a0b4'][i % 3], { face: 'grin', zoom: 3.1 }); c.restore(); c.strokeStyle = '#fbf5e8'; c.lineWidth = 4; c.beginPath(); c.arc(px + pw / 2, py + pw / 2, pw / 2, 0, TAU); c.stroke(); }
    PP(blob(1010, 215, 78, 54, 302, 18, 0.06), '#f2c230', {}); T('2,000+', 1010, 200, 46, '#a8121f', 'center', 800); T('SELECTIONS', 1010, 238, 24, '#a8121f', 'center', 800, FL, 1);
    tape(36, 8, 56, -0.4, 303); c.restore();
  }
  function noticeL(t) {
    var c = C.ctx; c.save(); c.rotate(-0.045 + Math.sin(t * 1.7) * 0.012);
    PP(C.torn(0, 0, 160, 208, 311, 1.5), '#fbf8ef', {});
    T('CLOSED', 80, 42, 54, '#8c2a2a', 'center', 800, FL, 3); c.strokeStyle = '#8c2a2a'; c.lineWidth = 4; c.strokeRect(18, 16, 124, 52);
    c.fillStyle = '#4a423b'; for (var i = 0; i < 5; i++) c.fillRect(22, 88 + i * 14, 116 - (i === 4 ? 60 : (i * 17) % 22), 4);
    T('Until further notice', 80, 160, 18, '#1f1b18', 'center', 700, FL, 1);
    c.strokeStyle = '#1f1b18'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(70, 194); c.quadraticCurveTo(88, 172, 98, 192); c.quadraticCurveTo(108, 174, 130, 190); c.stroke();
    tape(14, 6, 44, -0.6, 312); tape(146, 6, 44, 0.6, 313); tape(12, 200, 40, 0.4, 314); c.restore();
  }
  function padlockL(t, shake) {
    var c = C.ctx, a = Math.sin(t * 2.2) * 0.04 + shake; c.save();
    PP(C.torn(-34, -44, 68, 28, 322, 0.8), '#6f6d69', {}); c.fillStyle = '#2b2623'; c.beginPath(); c.arc(-22, -30, 4, 0, TAU); c.arc(22, -30, 4, 0, TAU); c.fill();
    c.strokeStyle = '#8f8c86'; c.lineWidth = 8; c.beginPath(); c.moveTo(0, -28); c.lineTo(0, 2); c.stroke();
    c.translate(0, 6); c.rotate(a);
    c.strokeStyle = '#8f8c86'; c.lineWidth = 9; c.beginPath(); c.moveTo(-17, 18); c.lineTo(-17, 4); c.arc(0, 4, 17, Math.PI, TAU); c.lineTo(17, 18); c.stroke();
    var g = c.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, '#d9a933'); g.addColorStop(0.5, '#f2d36a'); g.addColorStop(1, '#a8801f'); c.fillStyle = g; rrect(-30, 16, 60, 54, 8); c.fill();
    c.fillStyle = '#3a2f1c'; c.beginPath(); c.arc(0, 40, 6, 0, TAU); c.fill(); c.fillRect(-2, 42, 4, 14); c.restore();
  }
  function noteL(i) {                                                     // a ₹500-style note, no portrait (a pattern + the figure)
    var c = C.ctx, w = 150, h = 68; PP(C.torn(0, 0, w, h, 700 + i, 1.2), i % 2 ? '#b7c9a4' : '#c2d3b0', { halftone: 0.3, dot: 'rgba(40,70,40,0.25)' });
    c.strokeStyle = 'rgba(60,90,60,0.7)'; c.lineWidth = 2; c.strokeRect(7, 7, w - 14, h - 14); c.beginPath(); c.arc(w / 2, h / 2, 20, 0, TAU); c.stroke();
    T('₹500', 24, 22, 20, '#2f4a2f', 'left', 800); T('₹500', w - 24, h - 20, 20, '#2f4a2f', 'right', 800);
  }
  function headStk(who_, x, y, r, face, bg, t) {
    stk(x - r, y - r, 2 * r, 2 * r, function (g) { g.save(); g.beginPath(); g.arc(r, r, r, 0, TAU); g.clip(); portrait(g, who_, 0, 0, 2 * r, 2 * r, bg, { face: face, zoom: 3.2, t: t }); g.restore(); }, { rimW: 6, dots: false });
  }

  /* ---- shot 1, hoarding variants: FC Road establishing ---- */
  var KID = [{ who: 'extra:0', h: 336, x0: 150 }, { who: 'extra:22', h: 330, x0: 340 }, { who: 'aarav', h: 352, x0: 545 }];
  function roadStripWorld() { strip(-400, 596, 2800, 172, '#6f6b66', 11); var c = C.ctx; c.fillStyle = 'rgba(255,255,255,0.8)'; for (var x = -400; x < 2400; x += 150) c.fillRect(x, 676, 84, 8); }
  function paveWorld() { kerbStrip(-400, 764, 2400); strip(-400, 786, 2800, 96, '#e6dcc4', 12, { dotA: 0.08 }); }
  function hoardS1(t, S, kind) {
    var c = C.ctx, T2 = C.T12(t);
    ground(SKYC, 'rgba(255,255,255,0.22)', t, 24);
    lay(S.cam, 0.5, function () {
      c.save(); c.translate(560, 350); c.rotate(-0.035); printOrFallback(C.IMG('fc-road'), -430, -250, 860, 500, 7, 1.4 + 0.2 * C.ease(PR(t, 0, 3 * BT)), 0.62, 1.0); tape(-380, -256, 90, -0.5, 3); tape(380, -256, 90, 0.5, 4); c.restore();
      hstk(0, 20, 120, 330, 190, -0.07); hstk(1, 930, 70, 300, 172, 0.06); hstk(3, 1000, 340, 250, 145, -0.04); hstk(2, 60, 470, 280, 160, 0.05);
    });
    lay(S.cam, 0.8, function () {
      var u = C.ease(PR(T2, 0.25, 1.85));
      ladderL(960, 250, 600, 16); who(c, 'extra:11', 996, 340, 150, { t: t, face: 'focused', armL: [2.2, 0.3], armR: [2.55 + Math.sin(T2 * 4) * 0.12, 0.2] });
      if (u > 0.002) stk(1000, 180, 580, 340, function () { brightBanner(T2, u, { ropeX: 600, ropeY: 440 }); });
      roadStripWorld();
      var ap = PR(T2, -0.7, 2.6) ; var ax = lerp(-420, 1750, ap);                         // the real auto-rickshaw photo crosses on twos
      var img = C.IMG('auto-rickshaw'); if (img) C.photoSticker(img, ax, 735 - 250 * img.naturalHeight / img.naturalWidth, 250, { res: 1.2 });
      auto(lerp(2300, -300, PR(T2, -0.7, 3.2)), 750, 0.72, -1, T2 * 400, { pax: '#e0a82e' });
    });
    lay(S.cam, 1.0, function () {
      paveWorld(); cart(1760, 836, T2);
      var i; for (i = 0; i < 3; i++) {
        var k = KID[i], x = k.x0 + 250 * t, ph = x / (11.1 * k.h / 100) + i * 0.7;
        who(c, k.who, x, GY, k.h, Object.assign({ t: t + i, face: k.who === 'aarav' ? 'smile' : (i ? 'talk' : 'grin'), holdR: k.who === 'aarav' ? 'bag' : null }, walkO(ph, k.who === 'aarav' ? { armR: [-0.2, 0.9] } : null)));
      }
    });
    lay(S.cam, 1.22, function () { stk(1380, -90, 560, 300, function () { canopyL(T2); }); petals(T2, 1200, 2000, 100, 700, 14, 5); });
    wiresScreen(T2);
    C.banner('FC ROAD · 2029', 680, 150, { size: 64, rot: -0.03, p: PR(T2, 0, 0.4) });
  }
  function walkO(ph, extra) { return Object.assign({ pose: 'walk', walk: ph }, swing(ph), extra || {}); }
  function wiresScreen(t) { var c = C.ctx; c.save(); c.strokeStyle = 'rgba(40,36,34,0.8)'; c.lineWidth = 2.4; [[40, 20], [58, 30], [80, 40]].forEach(function (w, i) { c.beginPath(); c.moveTo(-20, w[0]); for (var x = -20; x < 1960; x += 240) c.quadraticCurveTo(x + 120, w[0] + w[1] + 6 * Math.sin(x * 0.01 + i), x + 240, w[0] + 2 * Math.sin(x * 0.013 + i)); c.stroke(); }); c.restore(); }

  /* ---- shot 2: push-in on the glossy banner; ₹500 notes spring in, the tag counts up, the stamp lands on the beat ---- */
  function hoardS2(t, S) {
    var c = C.ctx, T2 = C.T12(t), cam = C.shake(S.cam, t, 4 * BT);
    ground('#d9a933', 'rgba(150,100,10,0.26)', t, 22);
    lay(cam, 0.6, function () { hstk(0, -140, 80, 330, 190, -0.08); hstk(1, 1010, 20, 300, 172, 0.07); hstk(6, 1240, 560, 220, 105, -0.05); hstk(3, -60, 600, 260, 150, 0.06); });
    lay(cam, 0.9, function () {
      stk(330, 190, 580, 330, function () { brightBanner(T2, 1, {}); });
      C.inkStamp('₹9,999', 860, 505, stampP(t, 4 * BT), { size: 118, col: '#8c2a2a', rot: -0.12, bg: '#d9a933', seed: 5 });
    });
    lay(cam, 1.12, function () {
      var n = 0, N = 20;
      for (var i = 0; i < N; i++) {
        var tb = 1.97 + i * 0.024, p = C.back(PR(t, tb, tb + 0.2)); if (p <= 0) continue; n++;
        c.save(); c.translate(1090 + Math.sin(i * 2.3) * 9, 470 - i * 8); c.rotate(Math.sin(i * 1.7) * 0.05); c.scale(p, p); c.translate(-75, -34); noteL(i); c.restore();
      }
      if (n > 0) C.banner('₹' + fmt(Math.min(9999, n * 500)), 1090, 250, { size: 60 * C.countScale(n, 0, N, 0.75, 1.35), rot: 0.04, p: 1, bg: '#fffdf7' });
    });
  }

  /* ---- shot 3: the big face. Aarav notices the hoarding: a double take whose pop lands on beat 6 ---- */
  function bigFace(name, H, hx, hy, o, flip) {         // head centre at (hx, hy); feet far below the frame. Returns CAST's result.
    var c = C.ctx; o = Object.assign({ pivot: 'chest', flip: !!flip }, o); o.lift = (o.lift || 0) * (H / 340);
    return who(c, name, hx - (flip ? -1 : 1) * 1.5 * H / 100, hy + FACE_PX * H, H, o);
  }
  function hoardS3(t, S, kind) {
    var c = C.ctx, T2 = C.T12(t), H = 2700, pop6 = 6 * BT;
    ground('#2f7f7a', 'rgba(255,255,255,0.13)', t, 22);
    lay(S.cam, 0.55, function () { hstk(0, 40, 700, 330, 190, -0.06); hstk(1, 1500, 640, 300, 172, 0.06); });
    lay(S.cam, 0.9, function () { c.save(); c.translate(1480, 190); c.rotate(0.09); c.scale(1.25, 1.25); stk(-290, -144, 580, 290, function () { brightBanner(T2, 1, {}); }); c.restore(); });
    var base = { t: t, face: 'smile', look: [0.2, 0.25], armL: CAST.ARMS.down.armL, armR: CAST.ARMS.down.armR };
    var o = CAST.doubleTake(base, t, pop6 - 0.47);
    if (t > pop6 + 0.4) { o.face = kind === 'ban' ? 'worried' : kind === 'bretrain' ? 'surprised' : 'surprised'; }
    var r = lay2(S.cam, 1.0, function () { return bigFace('aarav', H, 700, 500, o, false); });
    if (t > pop6 && t < pop6 + 0.35) {                                           // surprise lines at the pop
      lay(S.cam, 1.0, function () { c.save(); c.strokeStyle = '#f4ead7'; c.lineWidth = 9; c.lineCap = 'round'; var u = C.easeOut(PR(t, pop6, pop6 + 0.3)); for (var i = 0; i < 7; i++) { var a = -2.9 + i * 0.36, r0 = 330 + u * 40, r1 = r0 + 70 * (1 - u * 0.5); c.beginPath(); c.moveTo(700 + Math.cos(a) * r0, 440 + Math.sin(a) * r0); c.lineTo(700 + Math.cos(a) * r1, 440 + Math.sin(a) * r1); c.stroke(); } c.restore(); });
    }
    if (kind === 'ban') lay(S.cam, 1.0, function () { C.sweatDrop(980, 250, PR(t, pop6 + 0.5, pop6 + 0.95), 3.2); });
  }
  function lay2(cam, k, fn) { var out; C.withCam(pcam(cam, k), function () { out = fn(); }); return out; }

  /* ---- shot 4: the road between the two doors ---- */
  function hoardS4(t, S, kind, road) {
    var c = C.ctx, T2 = C.T12(t), fee = kind === 'bcut' ? rupees(Agamoto.at(road, 2029).fees) : null;
    ground(SKYC, 'rgba(255,255,255,0.22)', t, 24);
    lay(S.cam, 0.55, function () { hstk(4, 560, 40, 280, 160, 0.04); hstk(5, 900, 20, 260, 150, -0.05); hstk(0, 200, -40, 330, 190, 0.05); });
    lay(S.cam, 0.82, function () { stk(120, 90, 520, 560, function () { bpFront(T2); }); });
    lay(S.cam, 0.9, function () {
      strip(-400, 640, 2800, 130, '#6f6b66', 41); c.fillStyle = 'rgba(255,255,255,0.8)'; for (var x = -400; x < 2400; x += 150) c.fillRect(x, 700, 84, 7);
      for (var z = 0; z < 7; z++) { c.save(); PP(C.torn(780 + z * 56, 652, 30, 112, 50 + z, 1.2), '#fffdf7', { shadow: false }); c.restore(); }              // zebra crossing
      auto(lerp(-300, 2300, PR(T2, 4.2, 7.6)), 748, 0.7, 1, T2 * 400, { pax: '#4b8fb8' }); auto(lerp(2400, -400, PR(T2, 4.2, 8.2)), 708, 0.6, -1, T2 * 400, { pax: '#d9628c' });
      kerbStrip(-400, 764, 2400);
    });
    lay(S.cam, 1.0, function () {
      stk(1230, 80, 640, 740, function () { vidyaFront(T2, { meera: kind === 'bretrain', meeraFace: t > 5.0 ? 'grin' : 'smile', fee: fee }); });
      strip(-400, 790, 2800, 92, '#e6dcc4', 12, { dotA: 0.08 });
      kidsS4(t, kind);
    });
    lay(S.cam, 1.22, function () { petals(T2, 600, 1900, 80, 760, 12, 8); });
  }
  function kidsS4(t, kind) {
    var c = C.ctx, T2 = t, door = 1348, i;
    var st = [{ who: 'extra:0', h: 336, x: 800 }, { who: 'extra:22', h: 330, x: 905 }, { who: 'aarav', h: 352, x: 1010 }];
    for (i = 0; i < 3; i++) {
      var k = st[i], lead = k.who === 'aarav', x = k.x, y = GY, h = k.h, o = { t: t + i, face: lead ? 'surprised' : 'grin', look: [0.4, -0.3] };
      if (lead) { o.holdR = 'bag'; o.armR = [0.3, 1.0]; }
      if (kind === 'ban') {
        if (!lead) {
          var d = C.ease(PR(t, 4.7 + i * 0.08, 6.1)), tx = i === 0 ? 350 : 440, mv = d > 0.02 && d < 0.98, wph = d * 26 + i;
          x = lerp(k.x, tx, d); y = lerp(GY, 664, d); h = k.h * lerp(1, 0.58, d);
          o = { t: t + i, pose: mv ? 'walk' : 'stand', walk: wph, flip: true, face: 'grin', armL: mv ? [Math.sin(wph) * 0.5, 0.12] : [0.1, 0.1], armR: i === 0 ? [2.5 + Math.sin(t * 7) * 0.3, 0.3] : (mv ? [-Math.sin(wph) * 0.5, 0.12] : [0.1, 0.1]) };
        } else {
          o.flip = true; o.look = [0.5, 0.2]; o.tilt = 0.04; var t0 = t < 5.3 ? 5.0 - 0.32 : 9 * BT - 0.4; o = CAST.withTake(o, t < 5.3 ? 'worry' : 'sag', t, t0);
          if (t >= 5.3) o.face = 'sad';
        }
      } else {
        var order = lead ? 0 : (i === 1 ? 1 : 2), b0 = 4.6 + order * 0.15, sp = PR(t, b0, b0 + 1.2), e = C.ease(sp), tx2 = lead ? door : door - 50 - order * 36;
        x = lerp(k.x, tx2, e); var mv2 = sp > 0.02 && sp < 0.98, wph2 = (x - k.x) / (11.1 * k.h / 100) + i;
        if (!lead) o = Object.assign({ t: t + i, face: 'grin', look: [0.3, 0] }, mv2 ? walkO(wph2) : { pose: 'stand' });
        else {
          o = Object.assign({ t: t + i, face: 'smile', holdR: 'bag', look: [0.3, -0.2] }, mv2 ? walkO(wph2, { armR: [-0.2, 0.9] }) : { pose: 'stand', armR: [0.3, 1.0] });
          o = CAST.withTake(o, kind === 'bretrain' ? 'joy' : 'resolve', t, 5.0 - (kind === 'bretrain' ? 0.3 : 0.32));
          if (kind === 'bretrain' && t > 5.15 && t < 5.9) { o.holdR = null; o.holdL = 'bag'; o.armL = [0.3, 1.0]; o.armR = [2.6 + Math.sin(t * 7) * 0.25, 0.4]; }
        }
        var inn = PR(t, b0 + 1.2, b0 + 1.6); if (inn > 0) { y = GY - inn * 40; o.alpha = 1 - inn; }
      }
      if (o.alpha != null && o.alpha <= 0.01) continue;
      var res = who(c, k.who, x, y, h, o);
      if (kind === 'ban' && lead && t > 5.15 && t < 5.9) C.sweatDrop(res.head.x + 34, res.head.y - 78, PR(t, 5.2, 5.6), 1.25);
    }
  }

  /* ================================================================ the collapse variant: MegaRank shuts, Vidya's door fills up */
  var CROWD2 = [
    { who: 'extra:7', x: 440, h: 326, face: 'worried', pose: 'phone' },
    { who: 'extra:2', x: 575, h: 338, face: 'surprised', pose: 'placard' },
    { who: 'extra:11', x: 775, h: 322, face: 'sad', pose: 'rattle' },
    { who: 'extra:6', x: 1130, h: 334, face: 'worried', pose: 'read' },
    { who: 'extra:15', x: 1292, h: 320, face: 'talk', pose: 'talk', flip: true },
    { who: 'extra:10', x: 1395, h: 336, face: 'worried', pose: 'think' },
    { who: 'extra:19', x: 1510, h: 318, face: 'surprised', pose: 'phone', flip: true }
  ];
  function crowdMega(t) {
    var c = C.ctx, back = [[500, 'extra:3', 'sad'], [680, 'extra:14', 'worried'], [1215, 'extra:21', 'surprised'], [1590, 'extra:25', 'worried']];
    back.forEach(function (b, i) { who(c, b[1], b[0], GY - 30, 292, { t: t + i * 0.7, face: b[2], flip: b[0] > 900, armL: CAST.ARMS.phoneLook.armL, armR: CAST.ARMS.phoneLook.armR, holdR: 'phone', glow: 1 }); });
    CROWD2.forEach(function (m, i) {
      var o = { t: t + i * 0.9, face: m.face, flip: !!m.flip, look: [0.6, -0.1] }, sw = Math.sin(t * 1.6 + i);
      if (m.pose === 'phone') { o.holdR = 'phone'; o.glow = 0.5; o.armR = [1.9, 1.7]; o.armL = [0.2, 1.0]; o.face = t % 4 < 2 ? 'worried' : 'talk'; }
      else if (m.pose === 'read') { Object.assign(o, CAST.ARMS.phoneLook); o.holdR = 'phone'; o.glow = 1; o.look = [0.3, 0.5]; o.tilt = 0.1; }
      else if (m.pose === 'rattle') { o.armR = [1.5 + Math.sin(t * 14) * 0.1 * CL(1 - Math.abs(t - 2.8)), 0.55]; o.armL = [0.2, 0.2]; o.look = [0.8, 0.5]; }
      else if (m.pose === 'placard') { o.armR = [2.75 + sw * 0.15, 0.2]; o.armL = [0.15, 0.2]; o.face = t % 2.4 < 1.2 ? 'talk' : 'surprised'; }
      else if (m.pose === 'talk') { o.armR = [1.0 + sw * 0.3, 0.8]; o.armL = [0.2, 0.9]; o.look = [0.7, 0]; }
      else if (m.pose === 'think') { Object.assign(o, CAST.ARMS.think); o.look = [0.5, -0.2]; }
      var r = who(c, m.who, m.x, GY, m.h, o);
      if (m.pose === 'placard') { c.save(); c.translate(r.handR.x + 10, r.handR.y - 56); c.rotate(-0.1 + sw * 0.06); PP(C.torn(-92, -46, 184, 92, 360, 1.4), '#f2e6c4', {}); c.strokeStyle = '#8a6a3b'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 46); c.lineTo(0, 96); c.stroke(); T('GIVE OUR', 0, -18, 34, '#8c2a2a', 'center', 800, FL, 1); T('FEES BACK!', 0, 18, 40, '#8c2a2a', 'center', 800, FL, 1); c.restore(); }
    });
    who(c, 'extra:0', 1440, GY + 4, 214, { t: t + 2, face: 'worried', flip: true, armL: [0.15, 0.2], armR: [0.15, 0.2] });
  }
  function shutterBay(x, y, w, seed) {
    var c = C.ctx; C.paperPiece(C.tornRect2(x, y, w, 840 - y, seed, 3), '#8d9aa3', { dots: '#000', dotA: 0.14, sy: 6, blur: 10 });
    c.strokeStyle = 'rgba(30,40,50,0.4)'; c.lineWidth = 2; for (var yy = y + 12; yy < 828; yy += 12) { c.beginPath(); c.moveTo(x + 6, yy); c.lineTo(x + w - 6, yy); c.stroke(); }
    c.fillStyle = 'rgba(120,70,40,0.16)'; for (var r = 0; r < 4; r++) c.fillRect(x + 24 + r * 70 + (seed % 7) * 8, y + 30, 14, 90 + r * 20);
  }
  function collS1(t, S) {
    var c = C.ctx, T2 = C.T12(t), shake = CL(1 - Math.abs(t - 2.8)) * Math.sin(t * 16) * 0.12;
    ground(SKYC, 'rgba(255,255,255,0.22)', t, 24);
    lay(S.cam, 0.5, function () {
      c.save(); c.translate(250, 340); c.rotate(-0.05); printOrFallback(C.IMG('fc-road'), -210, -140, 420, 280, 9, 1.5 + 0.2 * C.ease(PR(t, 0, 3 * BT)), 0.6, 1.0); tape(-170, -146, 70, -0.5, 3); tape(170, -146, 70, 0.5, 4); c.restore();
      hstk(1, 1590, 130, 300, 172, 0.06); hstk(3, 1640, 400, 250, 145, -0.05); hstk(0, 20, 570, 300, 172, -0.06);
    });
    lay(S.cam, 0.85, function () {
      C.paperPiece(C.tornRect2(360, 300, 1200, 540, 21, 4, 'tb'), '#7d2a38', { dots: '#000', dotA: 0.14, sy: 8, blur: 16 });
      shutterBay(380, 560, 380, 31); shutterBay(780, 540, 360, 32); shutterBay(1160, 560, 380, 33);
      stk(420, 40, 1100, 330, function () { megaBoardL(t); });
      stk(870, 500, 160, 208, function () { noticeL(t); });
      stk(925, 690, 70, 100, function () { C.ctx.translate(35, 50); padlockL(t, shake); });
    });
    lay(S.cam, 1.0, function () { strip(-400, 790, 2800, 130, '#e6dcc4', 12, { dotA: 0.08 }); crowdMega(t); });
    lay(S.cam, 1.14, function () {
      strip(-400, 912, 2800, 220, '#6f6b66', 71); c.fillStyle = 'rgba(255,255,255,0.8)'; for (var x = -400; x < 2400; x += 150) c.fillRect(x, 1040, 90, 8);
      auto(lerp(-400, 2300, PR(T2, -0.7, 3.6)), 1042, 0.95, 1, T2 * 500, { pax: '#4b8fb8' });
      var img = C.IMG('auto-rickshaw'); if (img) C.photoSticker(img, lerp(2200, -500, PR(T2, 0.2, 2.6)), 1052 - 250 * img.naturalHeight / img.naturalWidth, 250, { res: 1.2 });
    });
    wiresScreen(T2);
    C.banner('FC ROAD \u00b7 2029', 1560, 96, { size: 60, rot: 0.03, p: PR(T2, 0, 0.4) });
  }
  function collS2(t, S) {
    var c = C.ctx, T2 = C.T12(t), cam = C.shake(S.cam, t, 4 * BT);
    ground('#d9a933', 'rgba(150,100,10,0.26)', t, 22);
    lay(cam, 0.8, function () {
      C.paperPiece(C.tornRect2(330, -40, 1260, 1180, 22, 5), '#8d9aa3', { dots: '#000', dotA: 0.14, sy: 10, blur: 22 });
      c.strokeStyle = 'rgba(30,40,50,0.4)'; c.lineWidth = 3; for (var yy = -20; yy < 1100; yy += 18) { c.beginPath(); c.moveTo(344, yy); c.lineTo(1576, yy); c.stroke(); }
      c.fillStyle = 'rgba(120,70,40,0.16)'; for (var r = 0; r < 6; r++) c.fillRect(380 + r * 190, 40, 22, 260 + r * 25);
      C.paperPiece(C.tornRect2(700, 800, 520, 40, 24, 2), '#5b5a58', {});
    });
    lay(cam, 0.95, function () {
      c.save(); c.translate(820, 90); c.rotate(0.0); c.scale(1.5, 1.5); stk(0, 0, 160, 208, function () { noticeL(t); }); c.restore();
      c.save(); c.translate(960, 560); c.scale(1.9, 1.9); stk(-40, -60, 80, 130, function () { C.ctx.translate(0, 8); padlockL(t, CL(1 - Math.abs(t - 2.5) * 1.2) * Math.sin(t * 18) * 0.12); }); c.restore();
      C.inkStamp('SHUT', 1250, 470, stampP(t, 4 * BT), { size: 190, col: '#8c2a2a', rot: -0.1, bg: '#8d9aa3', seed: 9 });
    });
    lay(cam, 1.1, function () {
      var oL = CAST.withTake({ t: t, face: 'worried', look: [0.7, 0.2], armL: CAST.ARMS.down.armL, armR: CAST.ARMS.down.armR }, 'sag', t, 4 * BT - 0.4);
      bigFace('extra:11', 1700, 230, 640, oL, false);
      var oR = CAST.withTake({ t: t, face: 'neutral', look: [0.7, 0.3], armL: CAST.ARMS.down.armL, armR: CAST.ARMS.down.armR }, 'surprise', t, 4 * BT - 0.3);
      bigFace('extra:6', 1700, 1700, 660, oR, true);
    });
  }
  var QHEADS = (function () { var a = [], i, rows = [[700, 62, 8, 960], [790, 70, 6, 900]]; for (i = 0; i < 14; i++) { var rr = i < 8 ? rows[0] : rows[1], k = i < 8 ? i : i - 8; a.push({ who: 'extra:' + (50 + i * 3), x: rr[3] - k * rr[1] * 1.75 + (i < 8 ? 0 : -50), y: rr[0] + (k % 2) * 8, r: rr[1], face: i % 3 === 0 ? 'smile' : 'neutral', bg: ['#ffe27a', '#9fd2c6', '#f2a0b4', '#bfd7f2'][i % 4], tb: 3.2 + i * 0.032 }); } return a; })();
  function gainStudents() { var CO = Agamoto.company(), g = 0; CO.luck.forEach(function (l) { if (l.id === 'collapse') g = (l.effects.students || 0) * CO.measures.students.scale; }); return g; }
  function collS3(t, S) {
    var c = C.ctx, T2 = C.T12(t), gain = gainStudents();
    ground('#e0863e', 'rgba(255,238,190,0.28)', t, 22);
    lay(S.cam, 0.55, function () { hstk(4, -40, 90, 300, 172, -0.05); hstk(5, 380, 40, 280, 160, 0.04); });
    lay(S.cam, 0.9, function () { stk(1000, 80, 640, 740, function () { vidyaFront(T2, {}); }); });
    lay(S.cam, 1.0, function () {
      strip(-400, 790, 2800, 92, '#e6dcc4', 12, { dotA: 0.08 });
      QHEADS.forEach(function (h, i) { var p = PR(t, h.tb, h.tb + 0.22); if (p > 0) C.popIn(h.x, h.y, p, function () { headStk(h.who, h.x, h.y + Math.sin(T2 * 3 + i) * 2, h.r, h.face, h.bg, t); }); });
      who(c, 'sunanda', 1262, GY, 560, { t: t, flip: true, face: t < 3.9 ? 'smile' : 'talk', armL: CAST.ARMS.clap.armL, armR: [1.1 + Math.sin(t * 3) * 0.04, 1.0], look: [0.5, 0.1] });
    });
    var n = gain * C.ease(PR(t, 3.2, 3.8)); if (n > 1) C.banner('+' + fmt(n) + ' STUDENTS', 560, 330, { size: 56 * C.countScale(n, 0, gain, 0.8, 1.4), rot: -0.03, p: 1, bg: '#fffdf7' });
  }
  function collS4(t, S) {
    var c = C.ctx, T2 = C.T12(t);
    ground('#2f7f7a', 'rgba(255,255,255,0.13)', t, 22);
    lay(S.cam, 0.5, function () { for (var i = 0; i < 14; i++) headStk(QHEADS[i].who, 60 + i * 62, 760 + (i % 2) * 24 + Math.sin(T2 * 3 + i) * 3, 40, QHEADS[i].face, QHEADS[i].bg, t); });
    lay(S.cam, 0.8, function () { stk(1340, 120, 640, 740, function () { vidyaFront(T2, {}); }); });
    var o = CAST.withTake({ t: t, face: 'focused', look: [0.5, 0.15], armL: CAST.ARMS.down.armL, armR: CAST.ARMS.down.armR }, 'realize', t, 8 * BT - 0.3);
    lay(S.cam, 1.0, function () { bigFace('sunanda', 2800, 1180, 500, o, true); });
  }

  /* ---- the street place ---- */
  var SH_H = [{ a: 0, b: 3, keys: [[0, 960, 540, 1.0], [1.875, 1010, 530, 1.1, 'linear']] },
    { a: 3, b: 5, keys: [[0, 760, 380, 1.3], [1.25, 740, 372, 1.5, 'linear']] },
    { a: 5, b: 7, keys: [[0, 960, 540, 1.0], [1.25, 960, 540, 1.06, 'linear']] }];
  PLACES.street = { dur: 10 * BT, year: 2029, draw: function (ctx, t, road) {
    C.use(ctx); var kind = kindOf(road);
    if (isCollapse(road)) {
      var S = shotsAt(t, [{ a: 0, b: 3, keys: [[0, 960, 540, 1.0], [1.875, 1000, 535, 1.08, 'linear']] }, { a: 3, b: 5, keys: [[0, 960, 540, 1.0], [1.25, 960, 520, 1.12, 'linear']] },
        { a: 5, b: 7, keys: [[0, 900, 540, 1.0], [1.25, 940, 540, 1.07, 'linear']] }, { a: 7, b: 10, keys: [[0, 960, 540, 1.0], [1.875, 960, 540, 1.05, 'linear']] }]);
      [collS1, collS2, collS3, collS4][S.i](t, S);
      cap('2029. A big coaching chain shuts *overnight*.', t, 0.3, 2.9); cap('Parents look for a name they *trust*.', t, 3.4, 6.05);
    } else {
      var s4 = kind === 'ban' ? { a: 7, b: 10, keys: [[0, 900, 540, 1.0], [1.875, 820, 555, 1.16, 'linear']] } : { a: 7, b: 10, keys: [[0, 1000, 540, 1.0], [1.875, 1180, 525, 1.14, 'linear']] };
      var S2 = shotsAt(t, SH_H.concat([s4]));
      if (S2.i === 0) hoardS1(t, S2, kind); else if (S2.i === 1) hoardS2(t, S2); else if (S2.i === 2) hoardS3(t, S2, kind); else hoardS4(t, S2, kind, road);
      var cap2 = kind === 'bretrain' ? 'Aarav already has AI, and a *mentor*.' : kind === 'bcut' ? 'Vidya is cheaper now. Aarav *stays*.' : 'Two of Aarav’s friends cross the *road*.';
      cap('2029. Across the road, an AI academy *opens*.', t, 0.3, 2.9); cap(cap2, t, 3.4, 6.05);
    }
  } };

  PLACES.street.events = function (road) {
    var kind = kindOf(road), ev = [[1.8, 'swish'], [1.875, 'clack'], [3.05, 'swish'], [3.125, 'clack'], [4.3, 'swish'], [4.375, 'clack']], i;
    if (isCollapse(road)) {
      ev.push([0.3, 'whoosh'], [2.05, 'whooshIn'], [2.5, 'clank'], [3.2, 'popLow', 0], [3.2, 'zip', 0], [3.3, 'zip', 1], [3.4, 'zip', 2], [3.5, 'zip', 3], [3.8, 'ding'], [5.0, 'pop', 4], [5.1, 'ding']);
    } else {
      for (i = 0; i < 5; i++) ev.push([0.2 + i * 0.36, 'step']);
      ev.push([0.35, 'whoosh'], [1.97, 'pop', 0], [2.1, 'pop', 1], [2.2, 'popLow', 2], [2.05, 'whooshIn'], [2.5, 'clank'], [2.55, 'cash'], [3.75, 'pop', 4]);
      if (kind === 'ban') { for (i = 0; i < 4; i++) ev.push([4.8 + i * 0.3, 'step']); ev.push([5.0, 'blip', 0], [5.3, 'drip']); }
      else { for (i = 0; i < 4; i++) ev.push([4.7 + i * 0.3, 'step']); ev.push([5.0, kind === 'bretrain' ? 'ding' : 'blip'], [5.8, 'creak']); }
    }
    return ev;
  };

  var LANE = 845, STEP = 750, FLOORY = 758;            // lane baseline, step top (seat), standing-in-doorway baseline
  var SKIES = {
    festive: { top: '#f7a76a', mid: '#fbcf8f', hor: '#ffe9b8', wall: ['#f09aae', '#fff0d0', '#9fd2c6'], ground: '#d6b58c', tint: 'rgba(255,170,70,0.10)' },
    calm: { top: '#a9cde0', mid: '#cfe4e8', hor: '#f3efdc', wall: ['#e6cfb2', '#f3e8d4', '#c9d5c2'], ground: '#cdc3b0', tint: 'rgba(255,248,225,0.10)' },
    dusk: { top: '#1d2150', mid: '#6a3f78', hor: '#f08a5a', wall: ['#4b4f82', '#7a6a9a', '#3f6f86'], ground: '#4a4a66', tint: 'rgba(30,25,80,0.18)' }
  };
  function litWin(x, y, w, h, v, seed) { var c = C.ctx; if (v === 'dusk') { PP(C.torn(x - 5, y - 5, w + 10, h + 10, seed, 1), '#2a2a46', { lift: 2, blur: 4 }); var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffd98a'); g.addColorStop(1, '#f5a95a'); c.fillStyle = g; c.fillRect(x, y, w, h); c.strokeStyle = '#2a2a46'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke(); } else windowBox(x, y, w, h, seed, '#e2664f'); }
  function slabUpper(x, w, top, col, seed, v, o) {
    var c = C.ctx; o = o || {};
    PP(C.torn(x, top, w, 760 - top, seed, 3), col, { halftone: 0.3, dot: v === 'dusk' ? 'rgba(255,255,255,0.06)' : 'rgba(60,40,20,0.10)', lift: 8, blur: 20 });
    PP(C.torn(x - 10, top - 14, w + 20, 26, seed + 1, 2), shade(col, 0.16), { lift: 3, blur: 8 });
    for (var fy = top + 56; fy < 480; fy += 150) for (var wx = x + 40; wx < x + w - 90; wx += 150) litWin(wx, fy, 62, 90, v, seed * 3 + wx % 89 + fy);
    if (o.laundry) { var ly = o.laundry; c.strokeStyle = 'rgba(40,30,20,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 20, ly); c.quadraticCurveTo(x + 140, ly + 18, x + 260, ly); c.stroke(); ['#e2664f', '#fbf5e8', '#3f6fa8', '#e0a82e', '#d6336c'].forEach(function (cl, k) { var px = x + 40 + k * 44; PP([[px, ly + 4], [px + 28, ly + 6], [px + 26, ly + 56], [px - 1, ly + 52]], v === 'dusk' ? shade(cl, 0.35) : cl, { lift: 2, blur: 4, shadowAlpha: 0.2 }); }); }
    if (o.tank) { PP(C.torn(x + w * 0.55, top - 84, 84, 74, seed + 9, 2), v === 'dusk' ? '#2a2f4a' : '#3b4a54', { lift: 3, blur: 6 }); }
  }
  function shopSign(x, y, w, h, bg, fg, title, sub, seed, v) {
    var c = C.ctx; PP(C.torn(x, y, w, h, seed, 2), bg, { halftone: 0.3, dot: 'rgba(0,0,0,0.12)', lift: 6, blur: 12 });
    c.strokeStyle = fg; c.lineWidth = 3; c.strokeRect(x + 8, y + 8, w - 16, h - 16);
    TF(title, x + w / 2, y + h * 0.42, w - 50, h * 0.52, fg, 'center', 800, FL, 3); if (sub) TF(sub, x + w / 2, y + h * 0.8, w - 60, h * 0.17, fg, 'center', 700, FL, 2);
    if (v === 'dusk') { c.save(); c.globalAlpha = 0.18; var g = c.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w * 0.7); g.addColorStop(0, '#fff6c9'); g.addColorStop(1, 'rgba(255,246,201,0)'); c.fillStyle = g; c.fillRect(x - 100, y - 100, w + 200, h + 200); c.restore(); }
  }
  // Swati Tailors, ground floor: opening x 690..1230, floor 735..., sign above; interior with fabric bolts, a mannequin, the machine
  function tailorShop(t, v, o) {
    o = o || {}; var c = C.ctx, ox = 690, ow = 540, top = 332, bottom = 760, shut = o.shutter == null ? 0.2 : o.shutter;
    // interior
    var warm = v === 'dusk' ? ['#ffe2a0', '#f2b866'] : ['#f6e6b8', '#e9cf94'];
    var g = c.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, warm[0]); g.addColorStop(1, warm[1]); c.fillStyle = g; c.fillRect(ox, top, ow, bottom - top);
    c.fillStyle = 'rgba(120,70,30,0.12)'; for (var s = 0; s < 8; s++) c.fillRect(ox + s * 70, top, 4, bottom - top);
    // shelves of fabric bolts (left)
    var cols = ['#d6336c', '#2aa7a1', '#f2a900', '#6fbf3b', '#7d3fb5', '#e2332a', '#2f6fd1'];
    [420, 520, 620].forEach(function (sy, r) { c.fillStyle = '#8a5a3b'; c.fillRect(ox + 8, sy, 200, 8); for (var b = 0; b < 6; b++) { c.fillStyle = cols[(b + r * 2) % cols.length]; rrect(ox + 14 + b * 31, sy - 64, 28, 64, 10); c.fill(); c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(ox + 18 + b * 31, sy - 60, 5, 56); } });
    // blouse patterns pinned up + calendar + Ganpati
    [[ox + 250, 380, '#fbf5e8'], [ox + 292, 392, '#f2c48d'], [ox + 336, 378, '#fbf5e8']].forEach(function (q, k) { c.save(); c.translate(q[0], q[1]); c.rotate((k - 1) * 0.05); PP(C.torn(0, 0, 36, 52, 440 + k, 1), q[2], { lift: 2, blur: 4, shadowAlpha: 0.2 }); c.strokeStyle = '#4a423b'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(8, 12); c.quadraticCurveTo(18, 24, 28, 12); c.moveTo(8, 30); c.lineTo(28, 30); c.stroke(); c.restore(); });
    PP(C.torn(ox + 400, 386, 60, 80, 450, 1), '#fbf5e8', { lift: 2, blur: 4 }); T('JUNE', ox + 430, 402, 15, '#c8202a', 'center', 800); for (var d = 0; d < 12; d++) c.fillRect(ox + 408 + (d % 4) * 12, 414 + Math.floor(d / 3) * 12, 8, 6);
    c.fillStyle = '#e0702f'; c.beginPath(); c.arc(ox + 28, 360, 12, 0, TAU); c.fill(); c.fillStyle = '#f6d03c'; c.beginPath(); c.arc(ox + 28, 363, 6, 0, TAU); c.fill();
    // sewing machine on a table (right) with a wheel, and the stool
    PP(C.torn(ox + 330, 640, 190, 14, 460, 1), '#8a5a3b', { lift: 3, blur: 5 }); c.fillStyle = '#6b4a2f'; c.fillRect(ox + 344, 654, 10, 100); c.fillRect(ox + 496, 654, 10, 100);
    c.fillStyle = '#26221f'; rrect(ox + 372, 596, 124, 46, 8); c.fill(); c.fillRect(ox + 470, 574, 18, 28); c.fillStyle = '#6b655c'; c.beginPath(); c.arc(ox + 392, 604, 16, 0, TAU); c.fill(); c.fillStyle = '#d6336c'; c.fillRect(ox + 396, 620, 70, 16);
    // mannequin torso in a marigold blouse
    c.fillStyle = '#c9a36b'; c.fillRect(ox + 262, 610, 8, 140); c.beginPath(); c.ellipse(ox + 266, 758, 30, 8, 0, 0, TAU); c.fill();
    PP([[ox + 234, 520], [ox + 298, 520], [ox + 306, 600], [ox + 290, 640], [ox + 242, 640], [ox + 226, 600]], '#f2a900', { lift: 3, blur: 6 }); c.strokeStyle = '#d6336c'; c.lineWidth = 4; c.beginPath(); c.moveTo(ox + 238, 536); c.quadraticCurveTo(ox + 266, 560, ox + 294, 536); c.stroke();
    // tube light
    c.fillStyle = '#f4f7ff'; c.fillRect(ox + 150, top + 4, 260, 8); var tg = c.createLinearGradient(0, top + 10, 0, top + 260); tg.addColorStop(0, v === 'dusk' ? 'rgba(235,245,255,0.55)' : 'rgba(255,255,255,0.25)'); tg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = tg; c.fillRect(ox + 40, top + 12, ow - 80, 250);
    // roller shutter pulled up
    var sh = (top - 8) + 130 * shut + (o.shutterDown || 0); PP(C.torn(ox - 6, top - 14, ow + 12, sh - top + 14, 470, 1.4), '#8d9aa3', { halftone: 0.3, dot: 'rgba(30,40,50,0.16)', lift: 6, blur: 10 });
    c.strokeStyle = 'rgba(30,40,50,0.4)'; c.lineWidth = 2; for (var yy = top; yy < sh - 4; yy += 11) { c.beginPath(); c.moveTo(ox, yy); c.lineTo(ox + ow, yy); c.stroke(); }
    c.fillStyle = '#5b5a58'; c.fillRect(ox + ow / 2 - 14, sh - 10, 28, 10);
    // jambs
    PP(C.torn(ox - 26, top - 20, 26, bottom - top + 20, 471, 1), '#e0c9a2', { lift: 3, blur: 6 }); PP(C.torn(ox + ow, top - 20, 26, bottom - top + 20, 472, 1), '#e0c9a2', { lift: 3, blur: 6 });
    // the step: top surface and front face
    PP(C.torn(ox - 40, STEP - 4, ow + 80, 30, 473, 1), v === 'dusk' ? '#7d7aa0' : '#d8d0c0', { lift: 4, blur: 6 });
    PP(C.torn(ox - 40, STEP + 26, ow + 80, LANE - STEP - 26 + 10, 474, 1), v === 'dusk' ? '#5c5a82' : '#bfb6a4', { lift: 4, blur: 8, halftone: 0.3, dot: 'rgba(0,0,0,0.12)' });
  }
  function toran(x0, x1, y, t) { var c = C.ctx; c.save(); c.lineCap = 'round'; for (var x = x0; x <= x1; x += 22) { var sag = Math.sin((x - x0) / (x1 - x0) * Math.PI) * 26, sw = Math.sin(t * 2 + x * 0.05) * 2; c.strokeStyle = '#4c8f3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + sag); c.lineTo(x + sw, y + sag + 22); c.stroke(); c.fillStyle = (Math.floor(x / 22) % 2) ? '#f2a900' : '#e8641a'; c.beginPath(); c.arc(x + sw, y + sag + 28, 11, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.arc(x + sw - 3, y + sag + 24, 4, 0, TAU); c.fill(); } c.restore(); }
  function bunting(x0, x1, y0, y1, t, v) {
    var c = C.ctx; c.save(); c.strokeStyle = 'rgba(40,30,20,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 50, x1, y1); c.stroke();
    var cols = ['#f2a900', '#d6336c', '#2aa7a1', '#6fbf3b', '#e2332a']; for (var i = 1; i < 26; i++) { var u = i / 26, x = lerp(x0, x1, u), y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (Math.max(y0, y1) + 50) + u * u * y1, sw = Math.sin(t * 2.6 + i) * 0.1; c.save(); c.translate(x, y); c.rotate(sw); PP([[-13, 0], [13, 0], [0, 34]], cols[i % 5], { lift: 2, blur: 4, shadowAlpha: 0.2 }); c.restore(); } c.restore();
  }
  function streetLamp(x, t, v) {
    var c = C.ctx; PP(C.torn(x - 6, 120, 12, 730, 481, 1), '#3b3b4c', { lift: 3, blur: 6 }); PP(C.torn(x - 40, 106, 90, 20, 482, 1), '#3b3b4c', { lift: 3, blur: 6 });
    c.fillStyle = '#ffe6a0'; c.beginPath(); c.ellipse(x - 20, 130, 22, 10, 0, 0, TAU); c.fill();
    if (v === 'dusk') { var g = c.createRadialGradient(x - 20, 140, 4, x - 20, 140, 360); g.addColorStop(0, 'rgba(255,214,120,0.55)'); g.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = g; c.fillRect(x - 420, -200, 800, 900); }
  }
  function newspaper(t, p) {
    var c = C.ctx, W = 800, H = 1060, x = -W / 2, y = -H / 2; c.save();
    PP(C.torn(x, y, W, H, 601, 1.6), '#efe6cf', { halftone: 0.16, dot: 'rgba(60,45,20,0.10)', lift: 16, blur: 28, shadowAlpha: 0.38 });
    var yg = c.createLinearGradient(x, y, x + W, y + H); yg.addColorStop(0, 'rgba(210,180,110,0.18)'); yg.addColorStop(0.5, 'rgba(255,255,255,0)'); yg.addColorStop(1, 'rgba(190,150,80,0.18)'); c.fillStyle = yg; c.fillRect(x, y, W, H);
    var fg = c.createLinearGradient(0, 36, 0, 64); fg.addColorStop(0, 'rgba(0,0,0,0.0)'); fg.addColorStop(0.5, 'rgba(0,0,0,0.13)'); fg.addColorStop(1, 'rgba(255,255,255,0.0)'); c.fillStyle = fg; c.fillRect(x, 36, W, 28);        // fold
    T('EST. 1931  ·  PUNE  ·  VOL. CXI', 0, -500, 15, '#4a423b', 'center', 700, FL, 4);
    T('Pune Herald', 0, -446, 104, '#1f1b18', 'center', 400, FS);
    c.fillStyle = '#1f1b18'; c.fillRect(x + 24, -386, W - 48, 5); c.fillRect(x + 24, -378, W - 48, 2); c.fillRect(x + 24, -358, W - 48, 2);
    T('SATURDAY, 15 JUNE 2030', x + 28, -368, 16, '#1f1b18', 'left', 700, FL, 2); T('PUNE EDITION', 0, -368, 16, '#1f1b18', 'center', 700, FL, 2); T('₹6', x + W - 28, -368, 16, '#1f1b18', 'right', 700, FL, 2);
    // headline, left column
    T('VIDYA STUDENT', x + 30, -306, 62, '#1f1b18', 'left', 800, FL); T('TOPS', x + 28, -218, 168, '#1f1b18', 'left', 800, FL); T('STATE', x + 28, -88, 168, '#1f1b18', 'left', 800, FL);
    // highlighter swipe behind TOPS STATE (marker, p 0..1)
    if (p > 0) { c.save(); c.globalAlpha = 0.9; c.fillStyle = 'rgba(255,212,74,0.72)'; var hw = 330 * C.easeOut(p); c.beginPath(); c.moveTo(x + 22, -160 + 2); c.lineTo(x + 22 + hw, -164); c.lineTo(x + 18 + hw, -20); c.lineTo(x + 18, -16); c.closePath(); c.fill(); c.restore(); T('TOPS', x + 28, -218, 168, '#1f1b18', 'left', 800, FL); T('STATE', x + 28, -88, 168, '#1f1b18', 'left', 800, FL); }
    // photo of Aarav
    var px = x + 400, py = -354, pw = 346, ph = 372;
    PP(C.torn(px - 8, py - 8, pw + 16, ph + 16, 602, 1.2), '#fbf8ef', { lift: 4, blur: 8 });
    portrait(c, 'aarav', px, py, pw, ph, '#c6d3e2', { face: 'grin', zoom: 2.6, cx: 0.46, cy: 0.5, t: t });
    c.fillStyle = 'rgba(176,150,104,0.30)'; c.fillRect(px, py, pw, ph); c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip(); C.halftone([[px, py], [px + pw, py], [px + pw, py + ph], [px, py + ph]], 'rgba(40,30,20,0.30)', 1.25); c.restore();
    T('Aarav Kale, 18, of Hadapsar', px + pw / 2, py + ph + 28, 21, '#4a423b', 'center', 700, FL, 1);
    // sub-head + body
    c.font = 'italic 36px ' + FS; T('A tailor’s son is No. 1 in the state.', x + 30, 62, 36, '#1f1b18', 'left', 400, FS);
    T('PUNE:', x + 30, 110, 22, '#c8202a', 'left', 800, FL, 2);
    var r = C.rand(603); c.fillStyle = 'rgba(31,27,24,0.55)'; for (var i = 0; i < 14; i++) { var lw = 340 + (r() - 0.5) * 60; c.fillRect(x + 100, 102 + i * 22, i === 13 ? 120 : lw, 5); }
    for (i = 0; i < 4; i++) c.fillRect(x + 30, 126 + i * 22, 56, 5);
    for (i = 0; i < 12; i++) c.fillRect(x + 470, 110 + i * 22, i === 11 ? 90 : 300 + (r() - 0.5) * 50, 5);
    PP(C.torn(x + 470, 386, 300, 84, 604, 1), 'rgba(255,212,74,0.5)', { shadow: false }); c.strokeStyle = '#1f1b18'; c.lineWidth = 3; c.strokeRect(x + 470, 386, 300, 84); T('\u201cShe sewed. I studied.\u201d', x + 620, 428, 30, '#1f1b18', 'center', 400, FS);
    [['FLYOVER WORK TO END BY AUGUST', 0], ['SWARGATE GETS NEW BUS BAYS', 1], ['CHAI UP BY \u20b92, AGAIN', 2]].forEach(function (q) { var cx = x + 30 + q[1] * 252; TF(q[0], cx, 496, 214, 17, '#1f1b18', 'left', 800, FL, 1); });
    c.restore();
  }


  /* ================================================================ results 2030 */
  function resultsKind(road) {
    var topper = false; (road.luck || []).forEach(function (l) { if (l.id === 'topper' && l.hit) topper = true; });
    if (topper) return 'topper'; return Agamoto.at(road, 2030).results >= 50 ? 'ok' : 'low';
  }
  // Swati Tailors as one cut-out: the building, the sign, the open shop and the step (v: festive | calm | dusk)
  function shopSticker(x, y, t, v, o) {
    o = o || {};
    stk(x, y, 720, 830, function () {
      C.ctx.translate(-600, -40); var S = SKIES[v], c = C.ctx;
      slabUpper(640, 640, 70, S.wall[1], 503, v, {});
      PP(C.torn(700, 130, 520, 110, 504, 1.6), shade(S.wall[1], 0.06), {});
      c.strokeStyle = '#4a423b'; c.lineWidth = 4; c.beginPath(); c.moveTo(720, 214); c.lineTo(1200, 214); c.moveTo(720, 188); c.lineTo(1200, 188); c.stroke(); for (var b = 0; b < 17; b++) { c.beginPath(); c.moveTo(726 + b * 29, 188); c.lineTo(726 + b * 29, 214); c.stroke(); }
      PP(C.torn(950, 188, 36, 28, 505, 1), '#c2522d', {}); c.fillStyle = '#3e9457'; c.beginPath(); c.arc(968, 184, 20, Math.PI, TAU); c.fill();
      shopSign(690, 236, 540, 92, '#d6336c', '#ffffff', 'SWATI TAILORS', 'LADIES · BLOUSE SPECIALIST · ALTERATIONS', 506, v);
      tailorShop(t, v, o);
      if (o.festive) toran(700, 1220, 334, t);
    }, { res: 1.3 });
  }
  function signSticker(x, y, w, h, bg, fg, title, rot, seed) {
    var c = C.ctx; c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); stk(-w / 2, -h / 2, w, h, function () { shopSign(0, 0, w, h, bg, fg, title, null, seed, 'calm'); }); c.restore();
  }
  function medalL(t) {
    var c = C.ctx; c.save(); c.fillStyle = '#c8202a'; c.beginPath(); c.moveTo(-60, -10); c.lineTo(-20, -110); c.lineTo(20, -110); c.lineTo(-20, -10); c.closePath(); c.fill();
    c.fillStyle = '#e0863e'; c.beginPath(); c.moveTo(60, -10); c.lineTo(20, -110); c.lineTo(-20, -110); c.lineTo(20, -10); c.closePath(); c.fill();
    var g = c.createRadialGradient(-20, -20, 6, 0, 0, 100); g.addColorStop(0, '#fff3a8'); g.addColorStop(0.6, '#f2c230'); g.addColorStop(1, '#b8861a'); c.fillStyle = g; c.beginPath(); c.arc(0, 40, 92, 0, TAU); c.fill();
    c.strokeStyle = '#a8761a'; c.lineWidth = 6; c.beginPath(); c.arc(0, 40, 74, 0, TAU); c.stroke(); T('1', 0, 44, 120, '#7a4f0a', 'center', 800, FL); c.restore();
  }
  function pedhaTray(t, n) {
    var c = C.ctx; c.save();
    PP(blob(180, 120, 190, 118, 801, 24, 0.02), '#b8c0c8', { dots: '#000', dotA: 0.1 }); PP(blob(180, 120, 160, 94, 802, 24, 0.02), '#d6dde3', {});
    for (var i = 0; i < 40; i++) {
      var tb = 4.45 + i * 0.012, p = C.back(PR(t, tb, tb + 0.2)); if (p <= 0) continue;
      var col = i % 8, row = Math.floor(i / 8), x = 54 + col * 38 + (row % 2) * 19, y = 52 + row * 30;
      c.save(); c.translate(x, y); c.scale(p, p); c.fillStyle = '#d9a35a'; c.beginPath(); c.ellipse(0, 0, 18, 13, 0, 0, TAU); c.fill(); c.fillStyle = '#e8bd7a'; c.beginPath(); c.ellipse(-2, -3, 12, 7, 0, 0, TAU); c.fill(); c.fillStyle = '#7a4f1a'; c.beginPath(); c.arc(3, 1, 2, 0, TAU); c.fill(); c.restore();
    }
    c.restore();
  }
  function thali(x, y) { var c = C.ctx; c.save(); c.translate(x, y); c.fillStyle = '#b8c0c8'; c.beginPath(); c.ellipse(0, 0, 54, 14, 0, 0, TAU); c.fill(); c.fillStyle = '#e8edf0'; c.beginPath(); c.ellipse(0, -2, 44, 9, 0, 0, TAU); c.fill(); for (var i = 0; i < 7; i++) { c.fillStyle = '#d9a35a'; c.beginPath(); c.ellipse(-30 + i * 10, -6 - (i % 2) * 3, 8, 6, 0, 0, TAU); c.fill(); } c.restore(); }

  /* ---- the phone insert ---- */
  var RANKS = { ok: { v: 4812, cut: 25000 }, low: { v: 41370, cut: 25000 } };
  function phoneUI(t, o) {                                  // local 460 x 920
    var c = C.ctx, R = RANKS[o.kind], ok = o.kind === 'ok', W = 460, H = 920;
    PP(C.torn(0, 0, W, H, 901, 1), '#1f1b18', {}); rrect(18, 18, 424, 884, 40); c.fillStyle = '#fbf8ef'; c.fill();
    T('10:02', 56, 50, 22, '#1f1b18', 'left', 700); for (var b = 0; b < 4; b++) { c.fillStyle = '#1f1b18'; c.fillRect(360 + b * 8, 56 - b * 4, 5, 6 + b * 4); } c.strokeStyle = '#1f1b18'; c.lineWidth = 2; c.strokeRect(396, 40, 26, 14);
    PP(C.torn(30, 78, 400, 118, 902, 1.2), '#1d5552', {}); T('STATE ENTRANCE', W / 2, 118, 52, '#f4ead7', 'center', 800, FL, 3); T('RESULT · 2030', W / 2, 168, 30, '#e8c58a', 'center', 700, FL, 4);
    c.save(); c.beginPath(); c.arc(78, 262, 40, 0, TAU); c.clip(); portrait(c, 'aarav', 38, 222, 80, 80, '#c6d3e2', { face: 'neutral', zoom: 3.2, t: t }); c.restore(); c.strokeStyle = '#1d5552'; c.lineWidth = 4; c.beginPath(); c.arc(78, 262, 40, 0, TAU); c.stroke();
    T('AARAV KALE', 134, 246, 38, '#1f1b18', 'left', 800); T('Roll no. 3021 4488', 134, 282, 24, '#4a423b', 'left', 500);
    if (t < o.tLoad) {                                                                  // fetching
      var a = t * 6; c.strokeStyle = '#1d5552'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.arc(W / 2, 520, 54, a, a + 4.2); c.stroke(); T('Fetching your result…', W / 2, 640, 34, '#4a423b', 'center', 600);
      c.fillStyle = 'rgba(31,27,24,0.1)'; for (var k = 0; k < 3; k++) c.fillRect(70, 700 + k * 26, 320 - k * 50, 12);
    } else {
      var f = C.easeOut(PR(t, o.tC0, o.tC1)), val = R.v * f; T('YOUR RANK', W / 2, 372, 28, '#4a423b', 'center', 800, FL, 6);
      T(fmt(val), W / 2, 470, 118 * C.countScale(val, 0, R.v, 0.62, 1.0), ok ? '#1d5552' : '#1f1b18', 'center', 800, FL);
      var tx = 50, tw = 360, ty = 590; c.fillStyle = '#d9d2c3'; c.fillRect(tx, ty, tw, 22); c.fillStyle = '#6fbf3b'; c.fillRect(tx, ty, tw * R.cut / 60000, 22);
      c.fillStyle = '#1f1b18'; c.fillRect(tx + tw * R.cut / 60000 - 2, ty - 14, 4, 50); T('CUT-OFF 25,000', tx + tw * R.cut / 60000, ty + 58, 22, '#1f1b18', 'center', 800, FL, 1);
      var px = tx + tw * Math.min(1, val / 60000); c.fillStyle = ok ? '#1d5552' : '#8c2a2a'; c.beginPath(); c.moveTo(px, ty - 6); c.lineTo(px - 14, ty - 36); c.lineTo(px + 14, ty - 36); c.closePath(); c.fill();
      if (f >= 1) {
        var vp = C.back(PR(t, o.tC1, o.tC1 + 0.25)); c.save(); c.translate(W / 2, 748); c.scale(vp, vp);
        if (ok) { PP(C.torn(-190, -42, 380, 84, 903, 1.2), '#d9f0c8', {}); T('✓ SEAT · ENGINEERING COLLEGE, PUNE', 0, 2, 25, '#1d5552', 'center', 800, FL, 1); }
        else { PP(C.torn(-190, -42, 380, 84, 904, 1.2), '#f0d6c8', {}); T('BELOW CUT-OFF · NO SEAT', 0, 2, 28, '#8c2a2a', 'center', 800, FL, 1); }
        c.restore();
      }
    }
    if (o.notif > 0) {                                                                  // the "results are out" notification slides in and away
      var ny = C.lerp(-90, 96, C.easeOut(PR(o.notif, 0, 0.25))) - C.easeIn(PR(o.notif, 0.9, 1.15)) * 190;
      c.save(); PP(C.torn(36, ny, 388, 78, 905, 1.2), '#ffffff', {}); c.fillStyle = '#1d5552'; c.beginPath(); c.arc(76, ny + 39, 18, 0, TAU); c.fill(); T('Results are out ▸', 108, ny + 28, 28, '#1f1b18', 'left', 800); T('State Entrance 2030 · now', 108, ny + 56, 20, '#4a423b', 'left', 500); c.restore();
    }
  }
  function phoneSticker(x, y, rot, sc, t, o) { var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc); stk(-230, -460, 460, 920, function () { phoneUI(t, o); }); c.restore(); }
  function bubbleFace(x, y, r, name, face, t, bg, o) {
    stk(x - r, y - r, 2 * r, 2 * r, function (g) { g.save(); g.beginPath(); g.arc(r, r, r, 0, TAU); g.clip(); portrait(g, name, 0, 0, 2 * r, 2 * r, bg, { face: face, zoom: 2.9, t: t, look: (o && o.look) || [0.7, -0.1] }); g.restore(); }, { rimW: 9 });
  }

  /* ---- topper variant ---- */
  function paperWorld(t, p, ride) {
    var c = C.ctx, e = C.ease(PR(t, -0.35, 0.2)); c.save(); c.translate(1090, 545 + (1 - e) * 760 * (ride ? 1 : 0)); c.rotate(-0.035 - (1 - e) * 0.2 * (ride ? 1 : 0)); c.scale(0.95, 0.95); newspaper(t, p); c.restore();
  }
  function topS1(t, S) {
    var c = C.ctx, T2 = C.T12(t), cam = C.shake(S.cam, t, 2 * BT);
    ground('#1d5552', 'rgba(224,134,62,0.34)', t, 26); C.confetti(41, T2, '#f2c230', 16, [0, 0, 1920, 940]);
    lay(cam, 1.0, function () { paperWorld(t, 0, true); C.inkStamp('TOPPER', 1010, 690, stampP(t, 2 * BT), { size: 150, col: '#8c2a2a', rot: -0.13, bg: '#efe6cf', seed: 4 }); });
    C.banner('RESULTS DAY · 2030', 440, 250, { size: 62, rot: -0.06, p: PR(T2, 0, 0.4) });
  }
  function topS2(t, S) {
    var c = C.ctx, T2 = C.T12(t);
    ground('#d9a933', 'rgba(150,100,10,0.26)', t, 24);
    lay(S.cam, 1.0, function () {
      paperWorld(t, PR(t, 4 * BT, 4 * BT + 0.4), false);
      C.markRing2(1254, 385, 232, 250, PR(t, 4 * BT - 0.05, 4 * BT + 0.5), { col: '#d0702a', w: 10 });
    });
  }
  function topS3(t, S) {
    var c = C.ctx, T2 = C.T12(t), H = 2700, pop6 = 6 * BT;
    ground('#b84a62', 'rgba(255,230,200,0.32)', t, 26); C.confetti(43, T2, '#fbf5e8', 22, [0, 0, 1920, 940]); C.confetti(47, T2, '#f2c230', 14, [0, 0, 1920, 940]);
    lay(S.cam, 0.8, function () { var p = PR(t, pop6, pop6 + 0.34); if (p > 0) C.popIn(1470, 330, p, function () { c.save(); c.translate(1470, 330); c.rotate(0.08); c.scale(1.5, 1.5); stk(-100, -140, 200, 260, function () { C.ctx.translate(100, 110); medalL(t); }); c.restore(); }); });
    var o = CAST.withTake({ t: t, face: 'smile', look: [0.5, 0.1], armL: CAST.ARMS.down.armL, armR: CAST.ARMS.down.armR }, 'joy', t, pop6 - 0.3);
    lay(S.cam, 1.0, function () { bigFace('aarav', H, 700, 500, o, false); });
  }
  var NEIGH = [{ who: 'extra:3', x: 1180, h: 372, flip: true, pose: 'take' }, { who: 'extra:10', x: 1300, h: 384, flip: true, pose: 'clap' }, { who: 'extra:15', x: 1420, h: 366, flip: true, pose: 'phone' }, { who: 'extra:6', x: 1535, h: 380, flip: true, pose: 'clap' }, { who: 'extra:4', x: 1230, h: 244, flip: true, pose: 'hop', kid: 1 }, { who: 'extra:0', x: 1480, h: 236, flip: true, pose: 'hop', kid: 2 }];
  function topS4(t, S) {
    var c = C.ctx, T2 = C.T12(t);
    ground('#f0a030', 'rgba(255,240,170,0.34)', t, 24); C.confetti(45, T2, '#d6336c', 14, [0, 0, 1920, 940]);
    lay(S.cam, 0.55, function () { signSticker(10, 250, 400, 74, '#f6d03c', '#8f1f12', 'PATIL KIRANA STORES', -0.05, 507); signSticker(1500, 230, 420, 74, '#1fa463', '#ffffff', 'SAI MEDICALS · 24×7', 0.05, 508); bunting(-80, 2000, 120, 150, T2, 'festive'); });
    lay(S.cam, 0.9, function () { shopSticker(600, 40, T2, 'festive', { festive: true, shutter: 0.1 }); });
    lay(S.cam, 1.0, function () {
      strip(-400, 832, 2800, 160, '#d6b58c', 61, { dotA: 0.12 });
      NEIGH.forEach(function (m, i) {
        var o = { t: t + i * 0.7, flip: !!m.flip, face: m.kid ? 'grin' : 'smile', look: [0.5, 0.1] }, sw = Math.sin(T2 * 9 + i);
        if (m.pose === 'clap') { o = Object.assign(o, CAST.ARMS.clap); o.armR = [1.15 + sw * 0.18, 0.95]; o.face = 'grin'; }
        else if (m.pose === 'take') { o.armR = [1.45 + Math.sin(t * 3) * 0.05, 0.2]; o.armL = [0.2, 0.2]; o.face = 'grin'; }
        else if (m.pose === 'phone') { o.holdR = 'phone'; o.armR = [1.9, 1.7]; o.armL = [0.2, 1.0]; o.glow = 0.4; }
        else if (m.pose === 'hop') { o.lift = Math.abs(Math.sin(t * 7 + m.kid * 2)) * 34; o.armL = [2.6, 0.2]; o.armR = [2.6, 0.2]; }
        who(c, m.who, m.x, GY + 2, m.h, o);
      });
      // Swati hands out pedhas; she notices Aarav on beat 8 and turns (the hop hides the turn)
      var seen = t >= 8 * BT, sw0 = CAST.withTake({ t: t, flip: seen, face: 'cry', armL: [0.9, 0.7], armR: seen ? CAST.ARMS.hug.armR : [1.4 + Math.sin(t * 4) * 0.06, 0.3], look: [0.5, 0] }, 'joy', t, 8 * BT - 0.3);
      if (seen) { sw0.armL = CAST.ARMS.hug.armL; sw0.armR = CAST.ARMS.hug.armR; } else sw0.holdL = null;
      var sr = who(c, 'swati', 1010, GY + 2, 392, sw0); if (!seen) thali(sr.handL.x + 6, sr.handL.y - 6);
      // Aarav runs in, then the hug lands on beat 9
      var run = PR(t, 4.2, 9 * BT), ax = lerp(120, 888, C.ease(run)), ph = ax / (11.1 * 408 / 100), hugging = t >= 9 * BT - 0.05;
      var ao = hugging ? CAST.withTake({ t: t, face: 'grin', armL: CAST.ARMS.hug.armL, armR: CAST.ARMS.hug.armR, lean: 0.12 }, 'joy', t, 9 * BT - 0.3) : Object.assign({ t: t, face: 'grin', lean: 0.18 }, walkO(ph * 1.6, { armL: [Math.sin(ph * 1.6) * 0.9, 0.5], armR: [-Math.sin(ph * 1.6) * 0.9, 0.5] }));
      who(c, 'aarav', ax, GY + 4, 408, ao);
    });
    lay(S.cam, 0.4, function () { c.save(); c.translate(230, 240); c.rotate(-0.04); pedhaTray(t, 40); var n = Math.round(40 * C.ease(PR(t, 4.45, 4.95))); if (n > 0) C.banner(n + ' PEDHAS', 200, -22, { size: 52 * C.countScale(n, 0, 40, 0.8, 1.3), rot: 0.03, p: 1, bg: '#fffdf7' }); c.restore(); });
  }

  /* ---- no topper: the phone, the rank, the face, the step ---- */
  function phoneS1(t, S, kind) {
    var c = C.ctx, T2 = C.T12(t), ok = kind === 'ok';
    ground(ok ? '#5b8f9e' : '#3c4558', ok ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)', t, 24);
    lay(S.cam, 1.0, function () {
      bubbleFace(470, 560, 230, 'aarav', t > 1.2 ? (ok ? 'worried' : 'worried') : 'worried', t, '#f2c48d', { look: [0.8, -0.1] });
      phoneSticker(1260, 560, 0.04, 0.96, T2, { kind: kind, tLoad: 99, notif: t - 0.3, tC0: 99, tC1: 99 });
    });
    C.banner('RESULTS DAY · 2030', 560, 130, { size: 62, rot: -0.04, p: PR(T2, 0, 0.4) });
  }
  function phoneS2(t, S, kind) {
    var c = C.ctx, T2 = C.T12(t), ok = kind === 'ok', cam = C.shake(S.cam, t, 4 * BT);
    ground(ok ? '#e8dcc3' : '#d9d2c3', ok ? 'rgba(29,85,82,0.12)' : 'rgba(60,40,30,0.10)', t, 22);
    lay(cam, 1.0, function () {
      phoneSticker(960, 540, 0.02, 1.0, t, { kind: kind, tLoad: 1.95, tC0: 1.95, tC1: 2.5, notif: -1 });
      C.inkStamp(ok ? 'RANK 4,812' : 'NO SEAT', ok ? 1245 : 1270, ok ? 400 : 420, stampP(t, 4 * BT), { size: ok ? 92 : 104, col: ok ? '#1d5552' : '#1f1b18', rot: -0.1, bg: ok ? '#e8dcc3' : '#d9d2c3', seed: 6 });
    });
  }
  function phoneS3(t, S, kind) {
    var c = C.ctx, T2 = C.T12(t), ok = kind === 'ok', H = 2700, pop6 = 6 * BT;
    ground(ok ? '#d9a933' : '#2b3550', ok ? 'rgba(150,100,10,0.24)' : 'rgba(255,255,255,0.07)', t, 22);
    lay(S.cam, 0.9, function () { phoneSticker(1560, 400, 0.12, 0.62, T2, { kind: kind, tLoad: 0, tC0: 0, tC1: 0.01, notif: -1 }); });
    var base = { t: t, face: 'worried', look: [0.5, 0.1], armL: CAST.ARMS.down.armL, armR: CAST.ARMS.down.armR };
    var o = CAST.withTake(base, ok ? 'realize' : 'sag', t, pop6 - (ok ? 0.3 : 0.4));
    lay(S.cam, 1.0, function () { bigFace('aarav', H, 700, 500, o, false); });
  }
  function stepScene(t, S, kind) {
    var c = C.ctx, T2 = C.T12(t), ok = kind === 'ok', v = ok ? 'calm' : 'dusk', SK = SKIES[v];
    ground(ok ? '#cfe4e8' : '#6a3f78', ok ? 'rgba(255,248,225,0.4)' : 'rgba(240,138,90,0.28)', t, 24);
    lay(S.cam, 0.55, function () { signSticker(10, 250, 400, 74, '#f6d03c', '#8f1f12', 'PATIL KIRANA STORES', -0.05, 507); signSticker(1500, 230, 420, 74, '#1fa463', '#ffffff', 'SAI MEDICALS · 24×7', 0.05, 508); });
    lay(S.cam, 0.9, function () { shopSticker(600, 40, T2, v, { shutter: ok ? 0.1 : 0.6 }); });
    lay(S.cam, 1.0, function () {
      strip(-400, 832, 2800, 160, ok ? '#cdc3b0' : '#4a4a66', 61, { dotA: 0.12 });
      var seatY = 744, h = 470, sh = 452;
      if (ok) {
        // Aarav on the step with the phone; Swati reads over his shoulder, the relief arrives on beat 8
        var ao = CAST.withTake({ t: t, pose: 'sit', face: 'smile', holdR: 'phone', glow: 1, armR: [1.2, 1.2], armL: [0.5, 1.2], look: [0.3, 0.6], lean: 0.1 }, 'joy', t, 8 * BT - 0.3);
        who(c, 'aarav', 1040, seatY, h, ao);
        var so = CAST.withTake({ t: t, face: 'worried', look: [0.7, 0.4], lean: 0.12, armL: CAST.ARMS.down.armL, armR: t < 8 * BT - 0.3 ? [1.0, 0.5] : [0.9, 2.3] }, 'realize', t, 8 * BT - 0.3);
        who(c, 'swati', 860, GY + 18, sh, so);
        var bp = PR(t, 8 * BT + 0.15, 8 * BT + 0.9); if (bp > 0) { c.save(); c.globalAlpha *= (1 - bp) * 0.9; for (var i = 0; i < 4; i++) { c.fillStyle = '#fbf5e8'; c.beginPath(); c.arc(930 + bp * 80 + i * 20, 440 - bp * 40 - i * 6, 10 + i * 6 * bp, 0, TAU); c.fill(); } c.restore(); }
      } else {
        var sit = t >= 4.9, head = CAST.withTake({ t: t, pose: 'sit', face: 'sad', armL: CAST.ARMS.headInHands.armL, armR: CAST.ARMS.headInHands.armR, lean: 0.16 }, t < 9 * BT - 0.3 ? 'sag' : 'resolve', t, t < 9 * BT - 0.3 ? 4.375 - 0.3 : 9 * BT - 0.3);
        if (t >= 9 * BT - 0.1) { head.lean = 0.1; head.armL = [0.4, 1.2]; head.armR = [0.4, 1.2]; head.look = [0.6, -0.2]; }
        who(c, 'aarav', 960, seatY, h, head);
        if (!sit) { var wx = lerp(680, 780, C.ease(PR(t, 4.375, 4.9))), wph = (wx - 680) / (11.1 * sh / 100); who(c, 'swati', wx, GY + 18, sh, Object.assign({ t: t, face: 'worried', lean: 0.05, look: [0.5, 0.3] }, walkO(wph * 1.2, { holdR: 'cup' }))); }
        else { who(c, 'swati', 780, seatY, sh, { t: t, pose: 'sit', face: t > 5.3 ? 'talk' : 'worried', squash: 0.14 * (1 - PR(t, 4.9, 5.25)), armR: [1.0, 0.1], armL: [0.3, 0.9], look: [0.6, 0.3], lean: 0.08 }); }
      }
    });
    if (!ok) C.inkStamp('DROP YEAR', 1290, 470, stampP(t, 8 * BT), { size: 92, col: '#f4ead7', rot: -0.1, bg: '#6a3f78', seed: 7 });
  }

  var RS = function (kind) {
    var sh = [{ a: 0, b: 3, keys: [[0, 960, 540, 1.0], [1.875, 990, 530, 1.06, 'linear']] }];
    if (kind === 'topper') return sh.concat([{ a: 3, b: 5, keys: [[0, 1070, 400, 1.6], [1.25, 1090, 395, 1.78, 'linear']] }, { a: 5, b: 7, keys: [[0, 960, 540, 1.0], [1.25, 960, 540, 1.06, 'linear']] }, { a: 7, b: 10, keys: [[0, 960, 540, 1.0], [1.875, 930, 575, 1.32, 'linear']] }]);
    return [{ a: 0, b: 3, keys: [[0, 960, 540, 1.0], [1.875, 1000, 545, 1.06, 'linear']] }, { a: 3, b: 5, keys: [[0, 980, 520, 1.5], [1.25, 970, 520, 1.7, 'linear']] }, { a: 5, b: 7, keys: [[0, 960, 540, 1.0], [1.25, 960, 540, 1.06, 'linear']] }, { a: 7, b: 10, keys: [[0, 960, 600, 1.3], [1.875, 960, 610, 1.5, 'linear']] }];
  };
  PLACES.results = { dur: 10 * BT, year: 2030, draw: function (ctx, t, road) {
    C.use(ctx); var kind = resultsKind(road), S = shotsAt(t, RS(kind));
    if (kind === 'topper') { [topS1, topS2, topS3, topS4][S.i](t, S); cap('2030. Aarav tops the state *exam*.', t, 0.3, 2.9); cap('Swati hands out pedhas to the whole *lane*.', t, 3.4, 6.05); }
    else {
      [phoneS1, phoneS2, phoneS3, stepScene][S.i](t, S, kind);
      cap(kind === 'ok' ? '2030. Aarav gets a seat, *just*.' : '2030. Aarav misses the *cut-off*.', t, 0.3, 2.9); cap(kind === 'ok' ? 'An engineering college in Pune. Swati *exhales*.' : 'He’ll take a drop year and try *again*.', t, 3.4, 6.05);
    }
  } };

  PLACES.results.events = function (road) {
    var kind = resultsKind(road), ev = [[1.8, 'swish'], [1.875, 'clack'], [3.05, 'swish'], [3.125, 'clack'], [4.3, 'swish'], [4.375, 'clack']], i;
    if (kind === 'topper') {
      ev.push([0.2, 'clack'], [0.8, 'whooshIn'], [1.25, 'clank'], [2.45, 'swish'], [3.75, 'pop', 4], [3.95, 'ding']);
      for (i = 0; i < 6; i++) ev.push([4.45 + i * 0.07, 'pop', i]);
      for (i = 0; i < 6; i++) ev.push([4.5 + i * 0.18, 'step']);
      ev.push([5.625, 'pop', 3], [5.66, 'ding']);
    } else {
      ev.push([0.3, 'notify'], [0.9, 'blip', 0], [1.95, 'blip', 1], [2.1, 'blip', 2], [2.25, 'blip', 3], [2.05, 'whooshIn'], [2.5, 'clank'], [3.75, 'pop', 4]);
      if (kind === 'ok') { ev.push([4.0, 'ding'], [4.0, 'pop', 1], [5.0, 'pop', 2], [5.6, 'swish']); } else { ev.push([2.85, 'clonk'], [4.55, 'whooshIn'], [5.0, 'clank']); for (i = 0; i < 3; i++) ev.push([4.45 + i * 0.16, 'step']); ev.push([4.95, 'popLow', 1]); }
    }
    return ev;
  };

})(typeof window !== 'undefined' ? window : globalThis);
