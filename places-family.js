/* places-family.js — PLACES.bedroom (2027, night, 8.75 s = 14 beats) and PLACES.shop (2028, 6.25 s = 10 beats): Aarav and Swati at home.
   Vox paper-collage grammar (docs/animotion-upgrade.md): a flat cardboard ground per shot, set pieces as scissor-cut stickers at three
   parallax depths, a banner per place, ink stamps, sunbursts, numbers as objects, big-face close-ups with four-beat takes, phone/tablet
   inserts, local sound events. Pure draw functions of (t, road). Needs collage.js, kit2.js, cast.js. */
(function (root) {
  'use strict';
  var P = C.PALETTE, TAU = Math.PI * 2, CL = C.clamp, BT = C.BEAT;
  var PLACES = root.PLACES = root.PLACES || {};
  var HAS_DOC = typeof document !== 'undefined';
  var INK = '#1f1b18', CREAM = '#f4ead7', PAPER = '#fffdf7';

  /* ================= tiny helpers ================= */
  function hx(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, f) { a = hx(a); b = hx(b); f = CL(f); return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) + ',' + Math.round(a[2] + (b[2] - a[2]) * f) + ')'; }
  function rgba(h, a) { var q = hx(h); return 'rgba(' + q[0] + ',' + q[1] + ',' + q[2] + ',' + a + ')'; }
  function sm(t, a, b) { return C.ease(C.prog(t, a, b)); }
  function so(t, a, b) { return C.easeOut(C.prog(t, a, b)); }
  function bt(n) { return n * BT; }
  function bk(a) { return a <= 0 ? 0 : C.back(a); }            // spring-pop easing that is exactly 0 before it starts
  function fade(t, a, b, fi, fo) { return CL((t - a) / (fi || 0.4)) * CL((b - t) / (fo || 0.5)); }
  function fmtFee(f) { return '₹' + (Math.round(f / 500) * 500).toLocaleString('en-IN'); }
  var LBL = '"Barlow Condensed", "Tiro Devanagari Hindi", "Arial Narrow", sans-serif';

  // caption through an off-screen strip so the strip and its text fade together
  var capCv = null;
  function cap(text, t, a, b) {
    if (t < a || t > b) return; var al = fade(t, a, b, 0.05, 0.45), p = C.prog(t, a, a + Math.max(1, (b - a) * 0.55));
    if (al < 0.003) return; if (al > 0.995 || !HAS_DOC) { C.caption(text, [], p, 880); return; }
    if (!capCv) { capCv = document.createElement('canvas'); capCv.width = 3840; capCv.height = 400; }
    var g = capCv.getContext('2d'), prev = C.ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 3840, 400); g.scale(2, 2); g.translate(0, -780);
    C.use(g); C.caption(text, [], p, 880); C.use(prev);
    prev.save(); prev.globalAlpha *= al; prev.drawImage(capCv, 0, 780, 1920, 200); prev.restore();
  }

  // ---- layers: a multiplane camera. Far layers (k<1) move and zoom less than the subject plane; near layers (k>1) more.
  var VIEW = { x0: -1e9, y0: -1e9, x1: 1e9, y1: 1e9 }, CURZ = 1;
  function lay(cam, k, fn) {
    var lc = { x: 960 + (cam.x - 960) * k, y: 540 + (cam.y - 540) * k, z: 1 + (cam.z - 1) * k }, pv = VIEW, pz = CURZ;
    VIEW = { x0: lc.x - 960 / lc.z - 90, x1: lc.x + 960 / lc.z + 90, y0: lc.y - 540 / lc.z - 90, y1: lc.y + 540 / lc.z + 90 }; CURZ = lc.z;
    try { C.withCam(lc, fn); } finally { VIEW = pv; CURZ = pz; }
  }
  function vis(x, y, w, h) { return !(x > VIEW.x1 || x + w < VIEW.x0 || y > VIEW.y1 || y + h < VIEW.y0); }
  // a scissor-cut sticker whose drawing uses ABSOLUTE world coordinates (fn gets the sticker context; C.ctx is set to it too)
  function stk(x, y, w, h, fn, o) {
    if (!vis(x, y, w, h)) return; o = o || {};
    C.sticker(x, y, w, h, function (g) { g.translate(-x, -y); fn(g); }, Object.assign({ res: Math.min(2.2, Math.max(1.05, CURZ * 1.05)) }, o));
  }
  // a torn-paper piece inside a sticker or on a layer: flat fill, optional halftone
  function pc(x, y, w, h, fill, seed, o) {
    o = o || {}; var pts = C.tornRect2(x, y, w, h, seed, o.r == null ? 3 : o.r, o.sides);
    C.paperPiece(pts, fill, { dots: o.dots, dotA: o.dotA, sp: o.sp, r: o.dr, grain: o.grain == null ? 0.1 : o.grain, shadow: o.sh === true, blur: o.blur || 8, sx: 2, sy: o.sy == null ? 5 : o.sy }); return pts;
  }
  function poly(pts, fill, o) { o = o || {}; C.paperPiece(pts, fill, { dots: o.dots, dotA: o.dotA, grain: o.grain == null ? 0.1 : o.grain, shadow: o.sh === true, blur: o.blur || 8, sy: 5, sx: 2 }); return pts; }
  function rr(x, y, w, h, r) { var c = C.ctx; c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  function ell(x, y, rx, ry, fill, rot) { var c = C.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fillStyle = fill; c.fill(); }
  function seg(x0, y0, x1, y1, col, lw, cp) { var c = C.ctx; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = cp || 'round'; c.stroke(); }
  function disc(x, y, r, fill, dotCol, op) {      // a flat circle of coloured light with a halftone ring: collage "lighting" (op 'screen' makes it glow)
    var pts = [], n = 44, c = C.ctx; for (var i = 0; i < n; i++) { var a = i / n * TAU, w = 1 + 0.012 * Math.sin(i * 3.1); pts.push([x + Math.cos(a) * r * w, y + Math.sin(a) * r * w]); }
    c.save(); if (op) c.globalCompositeOperation = op; C.paperPiece(pts, fill, { shadow: false, dots: dotCol, dotA: 0.5, sp: 12, r: 2.4, grain: 0.08 }); c.restore();
  }
  function ink(txt, x, y, size, col, rot, align) { var c = C.ctx; c.save(); c.translate(x, y); c.rotate(rot || 0); c.font = 'italic ' + size + 'px ' + C.FONTS.serif; c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'alphabetic'; c.fillText(txt, 0, 0); c.restore(); }
  function lbl(txt, x, y, size, col, align, weight) { var c = C.ctx; c.save(); c.font = (weight || 600) + ' ' + size + 'px ' + LBL; c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(txt, x, y); c.restore(); }
  // wrapped chat/label text; nChars reveals it as if typed (layout always uses the full text)
  function wtext(txt, x, y, maxW, lh, size, col, nChars, weight) {
    var c = C.ctx; c.save(); c.font = (weight || 600) + ' ' + size + 'px ' + LBL; c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    var ws = txt.split(' '), line = '', lines = []; ws.forEach(function (w) { var tst = line ? line + ' ' + w : w; if (c.measureText(tst).width > maxW && line) { lines.push(line); line = w; } else line = tst; }); lines.push(line);
    var shown = 0; lines.forEach(function (ln, i) { var take = Math.max(0, Math.min(ln.length, (nChars == null ? 1e9 : nChars) - shown)); if (take > 0) c.fillText(ln.slice(0, take), x, y + i * lh); shown += ln.length + 1; });
    c.restore(); return lines.length;
  }
  function measure(txt, maxW, size, weight) {
    var c = C.ctx; c.save(); c.font = (weight || 600) + ' ' + size + 'px ' + LBL; var ws = txt.split(' '), line = '', n = 1, widest = 0;
    ws.forEach(function (w) { var tst = line ? line + ' ' + w : w; if (c.measureText(tst).width > maxW && line) { widest = Math.max(widest, c.measureText(line).width); n++; line = w; } else line = tst; });
    widest = Math.max(widest, c.measureText(line).width); c.restore(); return { n: n, w: widest };
  }
  function mc(c, fn) { c.save(); fn(); c.restore(); }

  /* ================= shared props: sewing machine ================= */
  // Black cast-iron treadle machine in profile. (x, y) = top of the wooden table at the pillar (left) end; the arm reaches right to the needle.
  // run 0..1 scales the needle bob; spin is the hand-wheel angle; fy = where the iron legs stand.
  function machine(c, x, y, t, run, spin, fy) {
    var bedY = y - 20, nx = x + 232, arm = '#17181f', gold = '#c9a24a', iron = '#101118';
    pc(x - 70, y - 2, 420, 30, '#8a5a3b', 61, { r: 2, dots: 'rgba(0,0,0,0.5)', dotA: 0.18, sh: true });
    pc(x - 60, y + 26, 400, 16, '#5b3a26', 62, { r: 2 });
    [x - 40, x + 296].forEach(function (lx, i) {
      c.save(); c.strokeStyle = iron; c.lineWidth = 14; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(lx, y + 40); c.lineTo(lx + (i ? -4 : 4), fy - 12); c.stroke();
      c.lineWidth = 7; c.beginPath(); c.moveTo(lx, y + 60); c.bezierCurveTo(lx + (i ? 46 : -46), y + 60, lx + (i ? 46 : -46), y + 120, lx, y + 120); c.stroke();
      c.lineWidth = 12; c.beginPath(); c.moveTo(lx + (i ? -30 : -2), fy - 8); c.lineTo(lx + (i ? 28 : 38), fy - 8); c.stroke(); c.restore();
    });
    seg(x - 40, y + 150, x + 296, y + 150, iron, 7);
    var wx = x + 70, wy = y + 100, wr = 62;
    c.save(); c.strokeStyle = '#3a2a22'; c.lineWidth = 4; c.beginPath(); c.moveTo(wx - 8, wy - wr); c.lineTo(x - 26, y - 70); c.moveTo(wx + 10, wy - wr + 2); c.lineTo(x - 8, y - 33); c.stroke(); c.restore();
    c.save(); c.translate(wx, wy); c.beginPath(); c.arc(0, 0, wr, 0, TAU); c.fillStyle = iron; c.fill();
    c.fillStyle = '#2b2c36'; c.beginPath(); c.arc(0, 0, wr - 12, 0, TAU); c.fill(); c.fillStyle = iron; c.beginPath(); c.arc(0, 0, wr - 17, 0, TAU); c.fill();
    c.rotate(spin * 0.5); c.strokeStyle = '#3a3b48'; c.lineWidth = 6; for (var k = 0; k < 8; k++) { c.rotate(TAU / 8); c.beginPath(); c.moveTo(8, 0); c.lineTo(wr - 14, 0); c.stroke(); }
    c.fillStyle = gold; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill(); c.restore();
    var rock = Math.sin(spin * 0.5) * 0.06 * run;
    c.save(); c.translate(x + 160, fy - 14); c.rotate(rock); pc(-100, -8, 220, 18, '#1b1c25', 63, { r: 1.5 }); c.restore();
    seg(wx + Math.cos(spin * 0.5 + 1) * 24, wy + Math.sin(spin * 0.5 + 1) * 24, x + 190 + rock * 90, fy - 20, '#2a2b36', 6);
    // the sewing head: base plate, pillar, overarm, head block
    c.save(); c.fillStyle = arm;
    c.beginPath(); c.moveTo(x - 22, y - 2); c.lineTo(x - 22, bedY + 4); c.quadraticCurveTo(x - 24, bedY - 4, x - 8, bedY - 4); c.lineTo(nx + 46, bedY - 4); c.quadraticCurveTo(nx + 56, bedY - 2, nx + 50, y - 2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x - 8, bedY - 4); c.bezierCurveTo(x - 14, bedY - 80, x - 12, bedY - 130, x + 6, bedY - 168); c.quadraticCurveTo(x + 18, bedY - 190, x + 70, bedY - 188); c.lineTo(nx - 40, bedY - 188); c.quadraticCurveTo(nx + 6, bedY - 192, nx + 28, bedY - 172);
    c.lineTo(nx + 40, bedY - 120); c.lineTo(nx + 22, bedY - 100); c.lineTo(nx - 36, bedY - 100); c.lineTo(x + 70, bedY - 108); c.quadraticCurveTo(x + 52, bedY - 100, x + 52, bedY - 60); c.lineTo(x + 58, bedY - 4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(nx - 36, bedY - 186); c.quadraticCurveTo(nx + 2, bedY - 196, nx + 46, bedY - 176); c.lineTo(nx + 50, bedY - 112); c.quadraticCurveTo(nx + 12, bedY - 96, nx - 34, bedY - 104); c.closePath(); c.fill(); c.restore();
    c.save(); c.strokeStyle = gold; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 66, bedY - 150); c.bezierCurveTo(x + 100, bedY - 176, x + 130, bedY - 128, x + 164, bedY - 156); c.stroke();
    c.beginPath(); c.arc(x + 118, bedY - 148, 7, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(190,196,225,0.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 6, bedY - 120); c.bezierCurveTo(x - 10, bedY - 150, x + 4, bedY - 172, x + 40, bedY - 186); c.lineTo(nx - 40, bedY - 186); c.stroke(); c.restore();
    c.fillStyle = '#9a9eb2'; c.beginPath(); c.moveTo(nx - 12, bedY - 166); c.lineTo(nx + 22, bedY - 160); c.lineTo(nx + 26, bedY - 114); c.lineTo(nx - 10, bedY - 110); c.closePath(); c.fill();
    c.fillStyle = gold; c.fillRect(nx - 6, bedY - 144, 24, 3); ell(nx + 3, bedY - 128, 5, 5, '#4a4d60'); ell(nx + 12, bedY - 120, 3, 3, '#dfe2ee');
    c.save(); c.translate(x - 30, bedY - 80); c.fillStyle = '#0d0e14'; c.beginPath(); c.ellipse(0, 0, 12, 40, 0, 0, TAU); c.fill(); c.fillStyle = '#34353f'; c.beginPath(); c.ellipse(-3, 0, 8, 34, 0, 0, TAU); c.fill(); c.fillStyle = gold; c.beginPath(); c.arc(-2, Math.sin(spin) * 24, 4, 0, TAU); c.fill(); c.restore();
    c.fillStyle = '#d9a933'; c.fillRect(x + 150, bedY - 205, 3, 18); ell(x + 151, bedY - 214, 12, 10, '#c0392b'); ell(x + 151, bedY - 214, 12, 3, '#e8644f');
    var bob = Math.sin(t * 24) * 7 * run;
    c.save(); c.strokeStyle = '#e8e4d6'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 151, bedY - 224); c.quadraticCurveTo(x + 190, bedY - 232, nx - 20, bedY - 176 + bob * 0.5); c.lineTo(nx + 6, bedY - 150 + bob * 0.4); c.lineTo(nx + 6, bedY - 50 + bob); c.stroke(); c.restore();
    seg(nx + 6, bedY - 100, nx + 6, bedY - 38 + bob, '#a6a9b8', 5, 'butt'); seg(nx + 6, bedY - 38 + bob, nx + 6, bedY - 8 + bob, '#e4e7f2', 2, 'butt');
    c.fillStyle = '#8a8d9c'; c.fillRect(nx - 16, bedY - 22, 22, 7); c.fillRect(nx - 16, bedY - 22, 6, 18);
    return { nx: nx, bedY: bedY };
  }
  // cloth on the machine bed + the sewn part draping off the left end to the floor
  function cloth(c, m, col, col2, t, run, fy) {
    var bx = m.nx - 270, ex = m.nx + 160, by = m.bedY, wob = Math.sin(t * 2.4) * 2 * run, fx = bx - 70;
    c.save(); c.beginPath(); c.moveTo(bx + 30, by - 4); c.bezierCurveTo(fx + 40, by - 2, fx - 10, by + 20, fx - 20, by + 90); c.lineTo(fx - 36, fy - 14); c.lineTo(fx + 120, fy - 8); c.bezierCurveTo(fx + 100, by + 80, fx + 70, by + 30, bx + 70, by - 4); c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = col2; c.lineWidth = 3; c.globalAlpha *= 0.8; for (var i = 0; i < 4; i++) { c.beginPath(); c.moveTo(bx + 50 - i * 18, by + 2); c.bezierCurveTo(fx + 70 - i * 18, by + 40, fx + 40 - i * 22, fy - 80, fx + 10 + i * 24, fy - 12); c.stroke(); } c.restore();
    var pts = [[bx + 20, by - 3], [m.nx - 40, by - 12 + wob * 0.3], [m.nx + 10, by - 15 + wob * 0.6], [ex, by - 18 + wob], [ex + 10, by - 8], [ex + 2, by - 1], [bx + 20, by - 1]];
    c.save(); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]); c.closePath(); c.fillStyle = col2; c.fill(); c.restore();
    c.save(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.8; c.setLineDash([6, 5]); c.lineDashOffset = -t * 40 * run; c.beginPath(); c.moveTo(m.nx - 160, by - 7); c.lineTo(m.nx + 4, by - 9); c.stroke(); c.restore();
  }

  /* ================= BEDROOM: the set, as cut-outs ================= */
  var BR = { fanX: 905, deskX: 770, deskW: 440, deskTop: 724, aaravX: 322, aaravY: 842, stoolX: 676, swX: 1624, swY: 842, mx: 1230, my: 742, lampX: 1478, lampY: 470 };
  var SEAT = 842;                                   // seat height of both characters in the wide shot

  function pWindow(c, t) {
    var x = 110, y = 124, w = 400, h = 372;
    pc(x - 30, y - 30, w + 60, h + 60, '#6b5a8e', 21, { r: 4, dots: 'rgba(255,255,255,0.6)', dotA: 0.12 });
    c.save(); C.path(C.tornRect2(x, y, w, h, 31, 3)); c.clip();
    var im = C.IMG('pune-night');
    if (im) {                                        // the print of Pune at night, slowly pushed in
      var nw = im.naturalWidth, nh = im.naturalHeight, z = 1.12 + 0.05 * Math.sin(t * 0.4), sh = nh / z, sw = sh * w / h, fx = 0.56 + 0.03 * Math.sin(t * 0.3), fy = 0.5;
      var sx = Math.max(0, Math.min(nw - sw, fx * nw - sw / 2)), sy = Math.max(0, Math.min(nh - sh, fy * nh - sh / 2));
      c.filter = 'saturate(1.25) contrast(1.05) brightness(1.1)'; c.drawImage(im, sx, sy, sw, sh, x, y, w, h); c.filter = 'none';
    } else {                                         // fallback: a drawn night skyline
      var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0b1330'); g.addColorStop(0.7, '#27427a'); g.addColorStop(1, '#4b6ea8'); c.fillStyle = g; c.fillRect(x, y, w, h);
      var r = C.rand(9), bx = x - 10; while (bx < x + w) { var bw = 38 + r() * 46, bh = 90 + r() * 150; c.fillStyle = '#10193a'; c.fillRect(bx, y + h - bh, bw, bh); for (var wy = y + h - bh + 10; wy < y + h - 10; wy += 16) for (var wx = bx + 6; wx < bx + bw - 8; wx += 12) if (r() < 0.4) { c.fillStyle = '#ffd88a'; c.fillRect(wx, wy, 5, 7); } bx += bw + 3; }
    }
    c.restore();
    c.save(); c.strokeStyle = 'rgba(8,10,26,0.9)'; c.lineWidth = 7; c.lineCap = 'butt';               // iron grill
    for (var gx = x + 30; gx < x + w; gx += 52) { c.beginPath(); c.moveTo(gx, y - 2); c.lineTo(gx, y + h + 2); c.stroke(); }
    c.lineWidth = 8; [130, 255].forEach(function (o) { c.beginPath(); c.moveTo(x - 2, y + o); c.lineTo(x + w + 2, y + o); c.stroke(); }); c.restore();
    pc(x - 44, y + h + 8, w + 88, 28, '#8a77ad', 22, { r: 2, dots: 'rgba(255,255,255,0.5)', dotA: 0.12 });            // sill
    c.fillStyle = '#9fa9c0'; c.beginPath(); c.moveTo(x + 40, y + h + 8); c.lineTo(x + 76, y + h + 8); c.lineTo(x + 70, y + h - 40); c.lineTo(x + 46, y + h - 40); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(x + 50, y + h - 38, 4, 44);
    c.fillStyle = '#c0522d'; c.beginPath(); c.moveTo(x + 340, y + h + 8); c.lineTo(x + 372, y + h + 8); c.lineTo(x + 368, y + h - 28); c.lineTo(x + 344, y + h - 28); c.closePath(); c.fill();
    for (var lf = 0; lf < 5; lf++) { c.fillStyle = lf % 2 ? '#2f8f5f' : '#4fb87a'; c.beginPath(); c.ellipse(x + 356 + Math.sin(lf * 2.1) * 16, y + h - 44 - lf * 6 + Math.cos(t * 1.2 + lf) * 0.8, 6, 16, Math.sin(lf * 2.1) * 0.7, 0, TAU); c.fill(); }
    c.save(); c.beginPath(); c.moveTo(x + w - 10, y - 24); c.lineTo(x + w + 58, y - 24); c.lineTo(x + w + 52, y + h + 10); c.lineTo(x + w - 30 + Math.sin(t * 0.9) * 2, y + h + 10); c.quadraticCurveTo(x + w - 60, y + h * 0.5, x + w - 10, y - 24); c.closePath(); c.fillStyle = '#c0522d'; c.fill();
    c.clip(); c.fillStyle = 'rgba(255,225,170,0.35)'; for (var d = 0; d < 40; d++) { c.beginPath(); c.arc(x + w - 4 + (d % 5) * 14, y - 10 + Math.floor(d / 5) * 52, 3, 0, TAU); c.fill(); } c.restore();
  }
  function pCalendar(c) {
    var cx = 600, cy = 190; c.save(); c.translate(cx, cy); c.rotate(0.03);
    pc(0, 0, 138, 214, '#f1e4c8', 41, { r: 2 }); pc(8, 8, 122, 82, '#d9742f', 42, { r: 2 }); ell(69, 70, 34, 34, '#f3b04a'); ell(69, 70, 20, 20, '#e0452f');
    c.strokeStyle = '#fbe9b8'; c.lineWidth = 2; for (var r = 0; r < 9; r++) { var a = r * TAU / 9; c.beginPath(); c.moveTo(69 + Math.cos(a) * 38, 70 + Math.sin(a) * 38); c.lineTo(69 + Math.cos(a) * 52, 70 + Math.sin(a) * 52); c.stroke(); }
    ink('2027', 69, 126, 26, '#6a2a1c', 0, 'center'); lbl('OCTOBER', 69, 142, 15, '#4a423b', 'center', 700);
    for (var q = 0; q < 28; q++) lbl(String(q + 1), 20 + (q % 7) * 17.5, 160 + Math.floor(q / 7) * 14, 11, q === 11 ? '#fff' : '#4a423b', 'center', 600);
    ell(20 + 4 * 17.5, 160 + 14, 9, 8, 'rgba(210,50,40,0.9)'); lbl('12', 20 + 4 * 17.5, 160 + 14, 11, '#fff', 'center', 700); c.restore(); C.tape(cx + 70, cy + 6, 50, 0.03, { h: 20 });
  }
  function pNote(c) {
    c.save(); c.translate(938, 468); c.rotate(-0.035); pc(-110, -60, 222, 124, '#f4d977', 43, { r: 2.5 });
    ink('IIT 2030', 0, 22, 78, '#27489c', 0.02, 'center'); c.strokeStyle = '#27489c'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-84, 40); c.bezierCurveTo(-40, 32, 40, 46, 88, 36); c.stroke(); c.restore(); C.tape(938, 410, 56, -0.1, { h: 22 });
  }
  function pFormula(c) {
    c.save(); c.translate(1120, 452); c.rotate(0.05); pc(-70, -56, 142, 112, '#efe6d0', 44, { r: 2 });
    c.strokeStyle = '#2b3550'; c.lineWidth = 3; c.beginPath(); c.moveTo(-52, 20); c.lineTo(52, 2); c.stroke(); c.beginPath(); c.moveTo(-8, 14); c.lineTo(8, 36); c.lineTo(-24, 36); c.closePath(); c.stroke();
    c.strokeStyle = '#c0392b'; c.beginPath(); c.moveTo(46, -26); c.lineTo(50, -2); c.stroke(); c.beginPath(); c.moveTo(44, -8); c.lineTo(50, 0); c.lineTo(56, -8); c.stroke(); ink('τ = F × d', 0, -30, 26, '#2b3550', 0, 'center'); c.restore(); C.tape(1120, 398, 44, 0.2, { h: 20 });
  }
  function pClock(c, t) {
    c.save(); c.translate(1120, 236); ell(0, 0, 58, 58, '#2a2230'); ell(0, 0, 50, 50, '#f1e8d2');
    for (var hh = 0; hh < 12; hh++) { var ha = hh * TAU / 12; seg(Math.sin(ha) * 40, -Math.cos(ha) * 40, Math.sin(ha) * 46, -Math.cos(ha) * 46, '#2a2230', hh % 3 ? 2 : 4); }
    var mA = 40 / 60 * TAU, hA = (11 + 40 / 60) / 12 * TAU; seg(0, 0, Math.sin(hA) * 26, -Math.cos(hA) * 26, INK, 5); seg(0, 0, Math.sin(mA) * 38, -Math.cos(mA) * 38, INK, 3.4);
    var sA = Math.floor(t) * TAU / 60; seg(-Math.sin(sA) * 8, Math.cos(sA) * 8, Math.sin(sA) * 42, -Math.cos(sA) * 42, '#c0392b', 1.6); ell(0, 0, 4, 4, INK); c.restore();
  }
  function pSwitchboard(c) {
    pc(676, 468, 66, 96, '#cfc5ad', 57, { r: 1.5 }); for (var s = 0; s < 3; s++) { rr(690, 480 + s * 24, 16, 18, 3); c.fillStyle = '#f1e8d2'; c.fill(); }
    ell(722, 505, 9, 9, '#8a8068'); ell(722, 535, 9, 9, '#8a8068'); c.strokeStyle = '#1b1b22'; c.lineWidth = 3; c.beginPath(); c.moveTo(708, 468); c.bezierCurveTo(690, 430, 740, 410, 706, 380); c.stroke();
  }
  function pBag(c) {
    pc(1176, 322, 130, 22, '#6b4a33', 45, { r: 2 }); for (var hk = 0; hk < 3; hk++) ell(1202 + hk * 40, 334, 5, 5, '#c9a24a');
    c.save(); c.translate(1242, 350); c.rotate(0.02); pc(-44, 0, 96, 134, '#2c5b94', 46, { r: 2, dots: 'rgba(255,255,255,0.5)', dotA: 0.1 }); pc(-36, 70, 80, 56, '#244c7c', 47, { r: 2 }); seg(-44, 40, 52, 40, '#1d3a60', 4); ell(4, 96, 5, 5, '#d9a933'); c.restore();
  }
  function pPattern(c) { c.save(); c.translate(1372, 150); c.rotate(0.02); pc(-62, 0, 124, 190, '#c9a77a', 55, { r: 3 });
    c.strokeStyle = 'rgba(70,40,20,0.7)'; c.lineWidth = 2; c.setLineDash([7, 5]); c.beginPath(); c.moveTo(-40, 30); c.quadraticCurveTo(0, -5, 40, 30); c.lineTo(34, 150); c.quadraticCurveTo(0, 170, -34, 150); c.closePath(); c.stroke(); c.setLineDash([]);
    ink('Blouse 36', 0, 100, 24, '#5a2f18', 0, 'center'); c.restore(); C.tape(1372, 152, 42, 0.1, { h: 20 }); }
  function pShelf(c, t) {
    pc(1630, 270, 270, 20, '#6b4a33', 48, { r: 2 }); pc(1646, 190, 70, 80, '#d9a933', 49, { r: 2 }); ell(1681, 226, 16, 18, '#c0392b'); ell(1681, 226, 8, 9, '#f4d977');
    c.fillStyle = '#c9a24a'; c.beginPath(); c.moveTo(1760, 270); c.lineTo(1796, 270); c.lineTo(1788, 236); c.lineTo(1768, 236); c.closePath(); c.fill(); ell(1778, 232, 10, 4, '#e8c25a');
    var fl = 0.7 + 0.3 * Math.sin(t * 9) * Math.sin(t * 3.1); ell(1778, 222 - fl * 2, 3.6, 8 * fl, '#ffd27a');
    for (var fr = 0; fr < 5; fr++) pc(1650 + fr * 50, 292 + (fr % 2) * 4, 40, 12, ['#d0307a', '#1fb2b0', '#f2a516', '#5bbd2f', '#8e44ad'][fr], 50 + fr, { r: 1.5 });
  }
  function pGecko(c, t) {
    var gx = 1190 + 36 * so(t, 0.9, 1.6); c.save(); c.translate(gx, 262); c.rotate(-0.15); c.fillStyle = '#b8a97e'; c.beginPath(); c.ellipse(0, 0, 22, 7, 0, 0, TAU); c.fill(); ell(24, -1, 9, 6, '#b8a97e');
    c.strokeStyle = '#b8a97e'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-20, 0); c.quadraticCurveTo(-46, 6 + Math.sin(t * 3) * 3, -62, -4 + Math.sin(t * 3 + 1) * 5); c.stroke();
    [[-10, 6], [12, 6], [-10, -6], [12, -6]].forEach(function (p) { c.beginPath(); c.moveTo(p[0], p[1] * 0.4); c.lineTo(p[0] + 4 * (p[1] > 0 ? 1 : -1), p[1] * 2); c.stroke(); }); c.restore();
  }
  function pFan(c, t) {
    var cx = BR.fanX, cy = 74; seg(cx, 20, cx, cy, '#1a2038', 8); var ang = t * 8.2;
    for (var k = 0; k < 3; k++) {
      var a = ang + k * TAU / 3, cs = Math.cos(a), sn = Math.sin(a), by = cy + 34, x0 = cx + cs * 44, x1 = cx + cs * 270, y0 = by + sn * 4, y1 = by + sn * 26;
      c.fillStyle = sn > 0 ? '#6a73a0' : '#4d5688'; c.beginPath(); c.moveTo(x0, y0 - 7); c.lineTo(x1, y1 - 12); c.lineTo(x1, y1 + 12); c.lineTo(x0, y0 + 7); c.closePath(); c.fill();
    }
    pc(cx - 40, cy + 14, 80, 44, '#2f3763', 71, { r: 2 }); ell(cx, cy + 62, 16, 7, '#c9a24a'); rr(cx - 22, cy - 8, 44, 24, 8); c.fillStyle = '#232a4c'; c.fill();
  }
  function pLamp(c, t, k, pull) {
    var lx = BR.lampX, ly = BR.lampY; c.fillStyle = '#2d8a6c'; c.beginPath(); c.moveTo(lx - 12, ly - 72); c.lineTo(lx + 12, ly - 72); c.lineTo(lx + 44, ly - 10); c.lineTo(lx - 44, ly - 10); c.closePath(); c.fill();
    c.fillStyle = '#e8c25a'; c.fillRect(lx - 44, ly - 12, 88, 5); ell(lx, ly - 4, 17, 15, mix('#8a7a6a', '#ffe7b8', 0.2 + 0.8 * k)); ell(lx, ly - 4, 8, 8, mix('#9a8a7a', '#fff6dc', 0.2 + 0.8 * k));
    var by = ly + 98 + pull * 18; seg(lx - 38, ly - 10, lx - 38, by, '#f4ead7', 2.6); ell(lx - 38, by + 9, 6.5, 10, '#c98b4a');
    var a = t * 4.4, mx_ = lx + Math.cos(a) * 36 + Math.sin(t * 1.3) * 10, my_ = ly - 16 + Math.sin(a * 1.3) * 22; c.save(); c.translate(mx_, my_); c.fillStyle = 'rgba(245,238,215,0.95)';
    c.beginPath(); c.ellipse(-4, 0, 6, 2.4 + Math.abs(Math.sin(t * 38)) * 3.5, -0.3, 0, TAU); c.ellipse(4, 0, 6, 2.4 + Math.abs(Math.sin(t * 38)) * 3.5, 0.3, 0, TAU); c.fill(); c.restore();
  }
  function pDesk(c, build) {
    var dx = BR.deskX, dt = BR.deskTop, dw = BR.deskW;
    [dx + 12, dx + dw - 38].forEach(function (lx, i) { pc(lx, dt + 20, 26, 150, '#5b3a26', 80 + i, { r: 2 }); });
    pc(dx + 12, dt + 110, dw - 24, 14, '#5b3a26', 82, { r: 2 }); pc(dx - 10, dt - 4, dw + 20, 28, '#9a6a45', 83, { r: 2.5, dots: 'rgba(0,0,0,0.5)', dotA: 0.12 });
    ['#2c5b94', '#b0382f', '#d9a933', '#2f7f7a'].forEach(function (col, i) { pc(dx + dw - 150 + (i % 2) * 6, dt - 22 - i * 20, 118, 20, col, 84 + i, { r: 1.5 }); seg(dx + dw - 142, dt - 12 - i * 20, dx + dw - 40, dt - 12 - i * 20, 'rgba(255,255,255,0.45)', 2); });
    pc(dx + dw - 190, dt - 76, 24, 54, '#8a4cb0', 90, { r: 1.5 }); for (var pn = 0; pn < 3; pn++) seg(dx + dw - 178 + pn * 6, dt - 76, dx + dw - 182 + pn * 8, dt - 104, ['#f2c14e', '#e2664f', '#4b6fa8'][pn], 4);
    if (!build) { pc(dx + 130, dt - 10, 160, 14, '#f4ead7', 91, { r: 1.5 }); pc(dx + 130, dt - 22, 160, 14, '#e8dcc3', 92, { r: 1.5 }); }
  }
  function pTablet(c, t) {
    c.save(); c.translate(1016, BR.deskTop - 8); c.rotate(-0.16); rr(-96, -128, 192, 128, 9); c.fillStyle = '#0d1018'; c.fill(); rr(-88, -120, 176, 112, 4); var sg = c.createLinearGradient(-88, -120, 88, -8); sg.addColorStop(0, '#d6f4ff'); sg.addColorStop(1, '#8fd3f2'); c.fillStyle = sg; c.fill();
    lbl('TORQUE', -76, -102, 15, '#17536b', 'left', 800); for (var rw = 0; rw < 3; rw++) { rr(-76, -84 + rw * 25, 150, 17, 4); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); ell(-66, -75 + rw * 25, 4.5, 4.5, rw === 0 ? '#e2664f' : '#f2a516'); }
    c.restore();
  }
  function pTrunk(c) {
    var tx = 1700, ty = 744; pc(tx, ty, 200, 150, '#8f9cb4', 100, { r: 2.5, dots: 'rgba(255,255,255,0.6)', dotA: 0.12 });
    c.strokeStyle = '#6a7690'; c.lineWidth = 6; c.strokeRect(tx + 8, ty + 8, 184, 134); seg(tx, ty + 44, tx + 200, ty + 44, '#6a7690', 5);
    ell(tx + 100, ty + 64, 8, 8, '#c9a24a'); pc(tx + 70, ty + 90, 60, 30, '#c0392b', 101, { r: 1.5 }); ink('S. KALE', tx + 100, ty + 112, 24, '#f4ead7', 0, 'center');
    pc(tx + 6, ty - 40, 188, 44, '#a04a6b', 102, { r: 3, dots: 'rgba(255,220,180,0.6)', dotA: 0.16 }); pc(tx + 20, ty - 62, 150, 28, '#d49a52', 103, { r: 3, dots: 'rgba(60,30,10,0.6)', dotA: 0.12 });
  }
  function pMattress(c, build) {
    if (!build) {
      var pts = [[120, 806], [698, 806], [748, 906], [70, 906]]; poly(pts, '#5663a4', { dots: 'rgba(255,255,255,0.7)', dotA: 0.12 });
      pc(70, 904, 678, 46, '#3f4b86', 111, { r: 3, dots: 'rgba(0,0,0,0.5)', dotA: 0.16 }); for (var b = 0; b < 8; b++) ell(124 + b * 82, 928, 4, 4, '#28316a');
      c.save(); c.translate(252, 766); c.rotate(-0.1); pc(-70, -34, 150, 74, '#efe3c8', 112, { r: 4, dots: 'rgba(120,70,40,0.7)', dotA: 0.16 }); c.restore();
    } else {
      pc(124, 812, 300, 86, '#5663a4', 113, { r: 4, dots: 'rgba(255,255,255,0.7)', dotA: 0.12 }); ell(126, 855, 30, 44, '#6877b8'); ell(126, 855, 14, 22, '#4a5690');
      seg(214, 814, 214, 896, '#c9a24a', 5); seg(334, 814, 334, 896, '#c9a24a', 5);
      pc(154, 768, 220, 48, '#efe3c8', 114, { r: 4, dots: 'rgba(120,70,40,0.7)', dotA: 0.16 }); pc(194, 736, 140, 40, '#c0453a', 115, { r: 4, dots: 'rgba(255,220,200,0.7)', dotA: 0.16 });
    }
  }
  function pBlanket(c, t) {
    var x = 238, sag = Math.sin(t * 2.1) * 2;
    var pts = [[x, 762 + sag], [x + 60, 770 + sag], [x + 130, 790], [x + 190, 810], [x + 260, 836], [x + 340, 852], [x + 420, 862], [x + 450, 880], [x + 438, 902], [x + 360, 934], [x + 120, 948], [x - 10, 936], [x - 8, 880], [x - 14, 800]];
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) { var q = pts[i], n = pts[(i + 1) % pts.length]; c.quadraticCurveTo(q[0], q[1], (q[0] + n[0]) / 2, (q[1] + n[1]) / 2); } c.closePath(); c.fillStyle = '#8a4a82'; c.fill();
    c.save(); c.clip(); c.fillStyle = 'rgba(255,205,150,0.4)'; for (var gy = 760; gy < 960; gy += 13) for (var gx = 214 + ((gy / 13) % 2) * 7; gx < 700; gx += 14) { c.beginPath(); c.arc(gx, gy, 2.2, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(40,10,40,0.4)'; c.lineWidth = 5; c.lineCap = 'round'; [[x + 180, 800, x + 210, 900], [x + 260, 826, x + 300, 930], [x + 90, 776, x + 120, 880]].forEach(function (f) { c.beginPath(); c.moveTo(f[0], f[1]); c.quadraticCurveTo((f[0] + f[2]) / 2 + 14, (f[1] + f[3]) / 2, f[2], f[3]); c.stroke(); });
    c.strokeStyle = 'rgba(255,225,190,0.7)'; c.lineWidth = 4; c.setLineDash([2, 9]); c.beginPath(); c.moveTo(x - 4, 910); c.quadraticCurveTo(x + 200, 944, x + 440, 896); c.stroke(); c.setLineDash([]); c.restore();
  }
  function pDrape(c, t, x, y, h, col, col2, flip) {  // a near-layer cloth hanging from the top edge of the frame, swaying
    var sway = Math.sin(t * 1.1) * 8, w = 120 * (flip ? -1 : 1);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w + sway * 0.6, y + h * 0.5); c.quadraticCurveTo(x + w * 0.6 + sway, y + h * 0.8, x + w * 0.7 + sway, y + h); c.lineTo(x + w * 0.1 + sway, y + h - 14); c.quadraticCurveTo(x + w * 0.05, y + h * 0.6, x, y + h * 0.5); c.closePath(); c.fillStyle = col; c.fill();
    c.save(); c.clip(); c.strokeStyle = col2; c.lineWidth = 8; for (var i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x + w * i / 5, y); c.quadraticCurveTo(x + w * i / 5 + sway * 0.8, y + h * 0.5, x + w * i / 5 + sway, y + h); c.stroke(); } c.restore();
    c.fillStyle = col2; c.fillRect(Math.min(x, x + w), y, Math.abs(w), 14);
  }

  /* ================= BEDROOM: shot 1 — the room, then the push-in ================= */
  function bedWorld(c, t, cam, v) {
    var tt = C.T12(t), build = v.build, S0 = BR.swY;
    lay(cam, 0.85, function () {                                // light, as flat colour: cyan from the screen, tungsten from the lamp
      var cx = build ? 800 : 400;
      C.sunburst(cx, 640, 80, 760, 22, 'rgba(110,205,255,0.10)', 1, tt * 0.1); disc(cx, 650, 330, 'rgba(70,175,235,0.26)', '#bfe9ff');
      C.sunburst(1520, 560, 80, 900, 20, 'rgba(255,214,150,0.09)', 1, -tt * 0.08); disc(1530, 650, 390, 'rgb(150,78,24)', 'rgb(255,190,110)', 'screen');
    });
    lay(cam, 0.72, function () {                                // the wall: far plane
      c.save(); seg(BR.fanX, -400, BR.fanX, 30, '#1a2038', 8); c.restore();
      stk(60, 84, 570, 470, function (g) { pWindow(g, tt); });
      stk(590, 184, 160, 232, function (g) { pCalendar(g); });
      stk(1055, 172, 130, 130, function (g) { pClock(g, tt); });
      stk(815, 395, 250, 150, function (g) { pNote(g); });
      stk(1040, 385, 170, 140, function (g) { pFormula(g); });
      stk(660, 372, 100, 200, function (g) { pSwitchboard(g); });
      stk(1160, 310, 170, 190, function (g) { pBag(g); });
      stk(1300, 140, 150, 215, function (g) { pPattern(g); });
      stk(1620, 180, 290, 130, function (g) { pShelf(g, tt); });
      stk(1100, 232, 200, 70, function (g) { pGecko(g, tt); }, { rimW: 4 });
      stk(600, 14, 610, 160, function (g) { pFan(g, tt); }, { rimW: 5 });
    });
    lay(cam, 1, function () {                                   // the subject plane: floor, furniture, people
      pc(-600, 738, 3200, 800, '#2d2558', 33, { r: 8, sides: 't', dots: '#000', dotA: 0.16, sp: 12, grain: 0.2, sh: true, sy: -3, blur: 14 });
      pc(1190, 944, 690, 92, '#8c3f55', 106, { r: 3, sh: true }); [['#e0a63a', 956], ['#2f7f7a', 976], ['#e0a63a', 1002], ['#e8e0cc', 1020]].forEach(function (b, i) { pc(1204, b[1], 662, 7, b[0], 107 + i, { r: 1.2 }); });
      seg(BR.lampX, -400, BR.lampX, BR.lampY - 70, '#0d1226', 3);
      if (!build) {
        stk(60, 700, 730, 262, function (g) { pMattress(g, false); });
        var A = { armL: [0.55, 1.15], armR: [1.32 + Math.sin(t * 2.7 + 1) * 0.04, 1.66 + Math.sin(t * 2.2) * 0.03] };
        stk(150, 500, 450, 440, function (g) { g.save(); g.beginPath(); g.rect(100, 460, 560, 448); g.clip();
          CAST.draw(g, 'aarav', BR.aaravX, BR.aaravY, 560, Object.assign({ pose: 'sit', face: t < 1.25 ? 'neutral' : 'focused', t: t, lean: -0.09, tilt: 0.1, look: [0.8, 0.7], holdR: 'phone', glow: 1 }, A)); g.restore(); }, { rimW: 5 });
        stk(205, 745, 500, 215, function (g) { pBlanket(g, tt); });
      } else {
        stk(100, 690, 340, 220, function (g) { pMattress(g, true); });
        stk(750, 600, 480, 290, function (g) { pDesk(g, true); });
        stk(540, 500, 380, 500, function (g) { pc(BR.stoolX - 56, 836, 112, 22, '#9a6a45', 120, { r: 2 }); seg(BR.stoolX - 40, 856, BR.stoolX - 50, 934, '#5b3a26', 12); seg(BR.stoolX + 40, 856, BR.stoolX + 50, 934, '#5b3a26', 12);
          CAST.draw(g, 'aarav', BR.stoolX, 836, 560, { pose: 'sit', face: 'focused', t: t, lean: 0.12, tilt: 0.1, look: [0.9, 0.55], holdR: 'pen', armL: [0.95, 1.05], armR: [1.0 + Math.sin(t * 6.5) * 0.035, 0.92 + Math.sin(t * 9) * 0.03] }); }, { rimW: 5 });
        stk(890, 560, 240, 190, function (g) { pTablet(g, tt); }, { rimW: 5 });
      }
      if (!build) stk(750, 600, 480, 290, function (g) { pDesk(g, false); });
      stk(1690, 670, 220, 230, function (g) { pTrunk(g); });
      var spin = 8 * tt;
      stk(1070, 470, 540, 480, function (g) { var m = machine(g, BR.mx, BR.my, tt, 1, spin, 930); cloth(g, m, '#d0307a', '#e7679f', tt, 1, 930); });
      stk(1420, 380, 130, 240, function (g) { pLamp(g, tt, 1, 0); }, { rimW: 4 });
      var glance = so(t, bt(2), bt(2.4)) * (1 - so(t, bt(2.9), bt(3.1)));
      stk(1470, 500, 330, 500, function (g) { pc(BR.swX - 70, BR.swY + 2, 140, 20, '#9a6a45', 119, { r: 2 }); seg(BR.swX - 50, BR.swY + 20, BR.swX - 60, 936, '#5b3a26', 12); seg(BR.swX + 50, BR.swY + 20, BR.swX + 60, 936, '#5b3a26', 12);
        CAST.draw(g, 'swati', BR.swX, BR.swY, 560, { pose: 'sit', flip: true, face: 'neutral', t: t, lean: 0.1, tilt: -0.05, look: [1, C.lerp(0.55, -0.25, glance)], armL: [0.7, 1.25 + Math.sin(t * 2.4) * 0.03], armR: [0.52 + Math.sin(t * 2.4 + 1) * 0.03, 2.14 + Math.sin(t * 3.1) * 0.05] }); }, { rimW: 5 });
    });
    lay(cam, 1.3, function () {                                 // near plane: cloth hanging at the frame edges
      stk(1796, -70, 140, 640, function (g) { pDrape(g, tt, 1920, -40, 560, '#e83c8c', '#c02070', true); }, { rimW: 6 });
      stk(-20, -70, 140, 560, function (g) { pDrape(g, tt + 1, 6, -40, 470, '#19a8a5', '#0f7f7c', false); }, { rimW: 6 });
    });
  }

  function bedShot1(c, t, v) {
    var build = v.build;
    var keys = build ? [{ t: 0, x: 990, y: 548, z: 1.0 }, { t: bt(3), x: 920, y: 560, z: 1.07 }, { t: bt(4), x: 860, y: 650, z: 2.45, ease: 'in' }]
                      : [{ t: 0, x: 990, y: 548, z: 1.0 }, { t: bt(3), x: 940, y: 566, z: 1.06 }, { t: bt(4), x: 440, y: 640, z: 3.0, ease: 'in' }];
    var cam = C.bump(C.drift(C.track(t, keys), t), t);
    C.cardboard('#27315e');
    var fx = C.prog(t, bt(3.4), bt(4)); C.pushFx(1 + 0.3 * fx * fx, 10 * fx * fx, function () { bedWorld(c, t, cam, v); });
    // the place banner pops in on beat 1; a zigzag underline keeps it alive
    var bp = C.prog(t, bt(1) - 0.1, bt(1) + 0.2);
    if (bp > 0) C.banner('HADAPSAR · 11:40 PM', 1440, 98, { size: 58, rot: -0.02, p: bp, seed: 4 });
  }

  /* ================= BEDROOM: shot 2 — the device, full frame ================= */
  function lever(c, p) {                           // a torque diagram that draws itself on, p 0..1; box ~300x180 centred on (0,0)
    var a = C.prog(p, 0, 0.3), b = C.prog(p, 0.25, 0.55), d = C.prog(p, 0.5, 0.8), e = C.prog(p, 0.75, 1), tilt = 0.12 * C.easeOut(b);
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = '#1b8fb5'; if (a > 0) { c.beginPath(); c.moveTo(0, 14); c.lineTo(26 * a, 62); c.lineTo(-26 * a, 62); c.closePath(); c.fill(); }
    c.save(); c.translate(0, 8); c.rotate(tilt); c.strokeStyle = '#2b3550'; c.lineWidth = 12; c.beginPath(); c.moveTo(-130 * a, 0); c.lineTo(130 * a, 0); c.stroke();
    if (b > 0) { var ax = 130; c.strokeStyle = '#e0702f'; c.lineWidth = 7; c.beginPath(); c.moveTo(ax, -78 - 10 * (1 - b)); c.lineTo(ax, -8); c.stroke(); c.fillStyle = '#e0702f'; c.beginPath(); c.moveTo(ax, 2); c.lineTo(ax - 14, -22); c.lineTo(ax + 14, -22); c.closePath(); c.fill(); ink('F', ax + 26, -48, 40, '#e0702f', 0, 'left'); }
    if (d > 0) { c.strokeStyle = '#1b8fb5'; c.lineWidth = 4; var xe = 130 * d; c.beginPath(); c.moveTo(0, 36); c.lineTo(xe, 36); c.stroke(); c.beginPath(); c.moveTo(0, 28); c.lineTo(0, 44); c.moveTo(xe, 28); c.lineTo(xe, 44); c.stroke(); if (d > 0.9) ink('d', 62, 78, 38, '#1b8fb5', 0, 'center'); }
    c.restore();
    if (e > 0) { c.strokeStyle = '#d0307a'; c.lineWidth = 5; c.beginPath(); c.arc(0, 8, 54, -2.5, -2.5 + 2.4 * e); c.stroke(); if (e > 0.85) { c.beginPath(); c.moveTo(Math.cos(-0.1) * 54, Math.sin(-0.1) * 54 + 8); c.lineTo(46, 22); c.lineTo(66, 24); c.stroke(); } }
    c.restore();
  }
  function marks(c, x, y, dir, p, col) {          // vibration marks beside a device (dir -1 left, +1 right)
    if (p <= 0 || p >= 1) return; c.save(); c.strokeStyle = col || PAPER; c.globalAlpha *= (1 - p); c.lineWidth = 8; c.lineCap = 'round';
    for (var i = 0; i < 3; i++) { var r = 30 + i * 26 + p * 34; c.beginPath(); c.arc(x, y, r, dir > 0 ? -0.55 : Math.PI - 0.55, dir > 0 ? 0.55 : Math.PI + 0.55); c.stroke(); } c.restore();
  }
  function scaleAbout(c, cx, cy, k, rot) { c.translate(cx, cy); if (rot) c.rotate(rot); c.scale(k, k); c.translate(-cx, -cy); }
  function bedInsertBan(c, t) {
    var lt = t - bt(4), tt = C.T12(t), cam0 = { x: 960, y: 540, z: 1 }, q = "Explain torque like I'm 14";
    C.cardboard('#17809a');
    var e = C.prog(lt, 0, 0.3), zk = 1 + 0.28 * (1 - C.easeOut(e)), bl = 9 * (1 - C.easeOut(e));       // push-through: decelerate out of the blur
    C.pushFx(zk, bl, function () {
      lay(cam0, 1, function () {
        C.sunburst(1180, 520, 100, 1500, 24, 'rgba(255,255,255,0.12)', 1, tt * 0.12);
        C.confetti(41, tt, '#fff3c0', 9, [0, 0, 1920, 800]);
        var nT = Math.floor(C.prog(lt, 0.3, 1.0) * q.length), typed = lt > 1.0 ? q.length : nT, typing = lt > 1.0 && lt < 1.25, ans = lt >= 1.25 ? bk(C.prog(lt, 1.25, 1.55)) : 0;
        // the ban, still on the wall: the school's sign
        if (lt > 0.15) { var sp = bk(C.prog(lt, 0.15, 0.5)); c.save(); scaleAbout(c, 400, 480, 0.6 + 0.4 * sp, -0.07); stk(150, 220, 500, 540, function (g) {
          pc(170, 250, 440, 480, PAPER, 161, { r: 5 }); lbl('AI', 390, 440, 230, INK, 'center', 800); g.strokeStyle = '#8c2a2a'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.arc(390, 440, 150, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(284, 334); g.lineTo(496, 546); g.stroke();
          lbl('NO AI IN CLASS', 390, 660, 52, '#4a423b', 'center', 800); C.tape(390, 256, 100, 0.04, { h: 26 }); }, { rimW: 7 }); c.restore(); }
        // the lever card, pushed up out of the phone when the answer lands
        if (lt >= 1.25) { c.save(); scaleAbout(c, 480, 470, 0.5 + 0.5 * ans, 0.03); stk(130, 170, 700, 600, function (g) {
          pc(150, 190, 660, 560, PAPER, 160, { r: 5, sh: false }); lbl('TORQUE', 190, 250, 44, '#1b8fb5', 'left', 800); seg(190, 280, 620, 280, 'rgba(27,143,181,0.35)', 4);
          g.save(); g.translate(480, 500); g.scale(1.6, 1.6); lever(g, C.prog(lt, 1.3, 1.8)); g.restore();
          ink('τ = F × d', 480, 705, 60, INK, 0, 'center'); C.markUnder(360, 600, 720, C.prog(lt, 1.7, 1.875), '#d0702a', 7); }, { rimW: 7 }); c.restore(); }
        // the phone
        c.save(); scaleAbout(c, 1190, 540, 0.82 + 0.18 * bk(C.prog(lt, 0, 0.35)), -0.035);
        stk(900, 20, 580, 1040, function (g) {
          rr(930, 40, 520, 1000, 62); g.fillStyle = '#0e1016'; g.fill(); g.save(); rr(948, 60, 484, 960, 46); g.clip(); g.fillStyle = '#0f1b28'; g.fillRect(940, 50, 500, 980);
          g.fillStyle = '#17293b'; g.fillRect(940, 50, 500, 170); ell(1012, 140, 34, 34, '#2fd0d6'); g.fillStyle = '#0f1b28'; g.beginPath(); g.moveTo(1012, 124); g.quadraticCurveTo(1012, 140, 1028, 140); g.quadraticCurveTo(1012, 140, 1012, 156); g.quadraticCurveTo(1012, 140, 996, 140); g.quadraticCurveTo(1012, 140, 1012, 124); g.fill();
          lbl('STUDY BUDDY', 1066, 124, 38, '#e8f6f8', 'left', 800); lbl('AI tutor · online', 1066, 166, 26, '#7fd0b8', 'left', 600);
          var m = measure(q, 330, 44), bw = m.w + 48, bh = m.n * 54 + 34, bs = C.easeOut(C.prog(lt, 0.2, 0.4)); g.save(); g.globalAlpha *= bs; rr(1414 - bw, 250, bw, bh, 30); g.fillStyle = '#2b8fd6'; g.fill(); wtext(q, 1414 - bw + 24, 250 + 52, 340, 54, 44, '#fff', typed); g.restore();
          if (typing) { rr(966, 430, 140, 68, 34); g.fillStyle = '#243649'; g.fill(); for (var d = 0; d < 3; d++) ell(1006 + d * 34, 464 - Math.max(0, Math.sin(lt * 16 - d * 1.1)) * 9, 7, 7, '#9fb6c8'); }
          if (ans > 0) { g.save(); scaleAbout(g, 1190, 600, 0.8 + 0.2 * ans); rr(966, 430, 430, 330, 30); g.fillStyle = '#243649'; g.fill(); wtext('Torque = force × distance from the pivot.', 998, 500, 360, 56, 46, '#e8f6f8', null, 700); wtext('A longer lever turns more.', 998, 700, 360, 48, 36, '#7fd0b8', null, 600); g.restore(); }
          g.fillStyle = '#1a2a3b'; rr(966, 934, 410, 60, 30); g.fill(); lbl('Ask anything…', 1000, 964, 30, '#5d7488', 'left', 500); g.restore(); }, { rimW: 7 });
        c.restore();
        marks(c, 900, 360, -1, C.prog(lt, 1.25, 1.65), '#fff3c0'); marks(c, 1480, 360, 1, C.prog(lt, 1.25, 1.65), '#fff3c0');
      });
    });
  }
  function bedInsertBuild(c, t) {
    var lt = t - bt(4), tt = C.T12(t), cam0 = { x: 960, y: 540, z: 1 };
    C.cardboard('#1b8d86'); var e = C.prog(lt, 0, 0.3), zk = 1 + 0.28 * (1 - C.easeOut(e)), bl = 9 * (1 - C.easeOut(e));
    C.pushFx(zk, bl, function () {
      lay(cam0, 1, function () {
        C.sunburst(960, 520, 100, 1500, 24, 'rgba(255,255,255,0.12)', 1, tt * 0.12); C.confetti(43, tt, '#fff3c0', 9, [0, 0, 1920, 800]);
        c.save(); scaleAbout(c, 960, 520, 0.84 + 0.16 * bk(C.prog(lt, 0, 0.35)), 0.015);
        stk(200, 50, 1520, 930, function (g) {
          rr(220, 70, 1480, 890, 56); g.fillStyle = '#0e1016'; g.fill(); g.save(); rr(246, 96, 1428, 838, 26); g.clip(); g.fillStyle = '#eef5f6'; g.fillRect(240, 90, 1440, 850);
          g.fillStyle = '#2f7f7a'; g.fillRect(240, 90, 1440, 150); lbl('TORQUE · 3 MISTAKES', 292, 166, 82, '#ffffff', 'left', 800); ell(1590, 166, 40, 40, '#ffffff'); lbl('AI', 1590, 168, 38, '#2f7f7a', 'center', 800);
          var rows = [['Forgot where the pivot is', '#e2664f'], ['Used distance, not the right angle', '#f2a516'], ['Mixed up clockwise and anti-clockwise', '#e2664f']];
          rows.forEach(function (r, i) { var a = C.prog(lt, 0.25 + i * 0.16, 0.5 + i * 0.16), k = bk(a); if (a <= 0) return; g.save(); scaleAbout(g, 960, 330 + i * 176, 0.7 + 0.3 * k); g.globalAlpha *= CL(a * 3);
            rr(290, 270 + i * 176, 1340, 150, 28); g.fillStyle = '#ffffff'; g.shadowColor = 'rgba(0,0,0,0.2)'; g.shadowBlur = 12; g.shadowOffsetY = 4; g.fill(); g.shadowColor = 'transparent';
            ell(376, 345 + i * 176, 40, 40, r[1]); lbl(String(i + 1), 376, 347 + i * 176, 46, '#ffffff', 'center', 800); lbl(r[0], 446, 345 + i * 176, 62, '#1f2b33', 'left', 600);
            g.strokeStyle = '#e2664f'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(1540, 320 + i * 176); g.lineTo(1580, 360 + i * 176); g.moveTo(1580, 320 + i * 176); g.lineTo(1540, 360 + i * 176); g.stroke(); g.restore(); });
          var bp = bk(C.prog(lt, 1.25, 1.65)); if (lt >= 1.25) { g.save(); g.translate(0, -260 + 360 * bp + 0); rr(280, 560, 1400, 250, 36); g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 26; g.shadowOffsetY = 10; g.fillStyle = '#fffdf6'; g.fill(); g.shadowColor = 'transparent';
            g.fillStyle = '#2f7f6a'; g.fillRect(280, 560, 16, 250); ell(372, 640, 46, 46, '#2f7f6a'); lbl('M', 372, 643, 50, '#fff', 'center', 800); lbl("MEERA MA'AM", 450, 606, 40, '#2f7f6a', 'left', 800);
            wtext("Stay back tomorrow. We'll fix torque together.", 450, 676, 1180, 60, 56, '#1f2b33', null, 700); g.restore(); }
          g.restore(); }, { rimW: 7 });
        c.restore(); marks(c, 160, 420, -1, C.prog(lt, 1.25, 1.65), '#fff3c0'); marks(c, 1760, 420, 1, C.prog(lt, 1.25, 1.65), '#fff3c0');
      });
    });
  }

  /* ================= BEDROOM: shot 3 — Aarav, big, and the take ================= */
  function seatFor(hx, hy, s, lean, flipped) { var xp = 1.5 * Math.cos(lean) + 44 * Math.sin(lean), yp = 1.5 * Math.sin(lean) - 44 * Math.cos(lean); return { x: flipped ? hx + xp * s : hx - xp * s, y: hy - yp * s }; }
  function bedFace(c, t, v) {
    var build = v.build, tt = C.T12(t), popT = bt(8), S = 23, seat = seatFor(600, 565, S, -0.05, false);
    C.cardboard(build ? '#1fa59a' : '#1b8fb5');
    var cam = C.shake(C.bump(C.drift({ x: 960, y: 540, z: 1 }, t), t), t, popT);
    lay(cam, 1, function () {
      C.sunburst(640, 520, 150, 1800, 22, 'rgba(255,255,255,0.14)', 1, tt * 0.14); disc(1280, 700, 330, 'rgba(255,255,255,0.18)', '#ffffff'); C.confetti(44, tt, '#ffffff', 11, [0, 0, 1920, 780]);
      var o = CAST.withTake({ pose: 'sit', face: 'focused', t: t, lean: -0.05, tilt: 0.06, look: [0.9, 0.55], holdR: build ? 'tablet' : 'phone', glow: 1, armL: [0.55, 1.15], armR: [1.32 + Math.sin(t * 2.7 + 1) * 0.04, 1.66 + Math.sin(t * 2.2) * 0.03] }, 'realize', t, popT - 0.3);
      stk(-40, -40, 2000, 1160, function (g) { CAST.draw(g, 'aarav', seat.x, seat.y, S * 100, o); }, { res: 1, rimW: 8, dots: false });
      if (!build) {
        var kc = bk(C.prog(t, popT, popT + 0.3)); if (kc > 0) { c.save(); scaleAbout(c, 1480, 180, 0.6 + 0.4 * kc, -0.05); stk(1190, 20, 590, 380, function (g) { pc(1210, 60, 540, 330, PAPER, 170, { r: 5 }); lbl('TORQUE', 1250, 112, 36, '#1b8fb5', 'left', 800); g.save(); g.translate(1480, 250); g.scale(1.1, 1.1); lever(g, 1); g.restore(); C.tape(1480, 66, 90, 0.05, { h: 26 }); }, { rimW: 7 }); c.restore(); }
        C.inkStamp('GOT IT', 230, 640, C.prog(t, popT - 0.24, popT + 0.24), { size: 70, col: PAPER, rot: -0.14, seed: 6, bg: '#1b8fb5' });
      } else {
        var kb = bk(C.prog(t, popT, popT + 0.3)); if (kb > 0) { c.save(); scaleAbout(c, 1500, 210, 0.6 + 0.4 * kb, 0.04); stk(1170, 50, 660, 330, function (g) { pc(1190, 70, 620, 280, PAPER, 171, { r: 5 }); g.fillStyle = '#2f7f6a'; g.fillRect(1190, 70, 12, 280); ell(1250, 130, 32, 32, '#2f7f6a'); lbl('M', 1250, 132, 38, '#fff', 'center', 800); lbl("MEERA MA'AM", 1300, 112, 34, '#2f7f6a', 'left', 800);
          wtext("Stay back tomorrow. We'll fix torque together.", 1230, 200, 540, 48, 42, INK, null, 700); C.tape(1500, 74, 90, -0.05, { h: 26 }); }, { rimW: 7 }); c.restore(); }
        C.inkStamp('STUCK: TORQUE', 1500, 470, C.prog(t, popT - 0.24, popT + 0.24), { size: 54, col: '#7a1f1f', rot: -0.1, seed: 6, bg: '#1fa59a' });
      }
    });
  }

  /* ================= BEDROOM: shot 4 — Swati, big: sees the glow, dims the lamp ================= */
  function lampBig(c, lx, ly, f, k, beadY, pull, t) {
    c.save(); c.fillStyle = '#2d8a6c'; c.beginPath(); c.moveTo(lx - 12 * f, ly - 72 * f); c.lineTo(lx + 12 * f, ly - 72 * f); c.lineTo(lx + 44 * f, ly - 10 * f); c.lineTo(lx - 44 * f, ly - 10 * f); c.closePath(); c.fill();
    c.fillStyle = '#1f6b53'; c.beginPath(); c.moveTo(lx - 30 * f, ly - 40 * f); c.lineTo(lx + 36 * f, ly - 40 * f); c.lineTo(lx + 44 * f, ly - 10 * f); c.lineTo(lx - 44 * f, ly - 10 * f); c.closePath(); c.fill();
    c.fillStyle = '#e8c25a'; c.fillRect(lx - 44 * f, ly - 12 * f, 88 * f, 5 * f); ell(lx, ly - 4 * f, 17 * f, 15 * f, mix('#8a7a6a', '#ffe7b8', 0.15 + 0.85 * k)); ell(lx, ly - 4 * f, 8 * f, 8 * f, mix('#9a8a7a', '#fff6dc', 0.15 + 0.85 * k));
    var bx = lx - 38 * f; seg(bx, ly - 10 * f, bx, beadY + 6, '#f4ead7', 3.4); ell(bx, beadY + 10 + pull * 0, 11, 17, '#c98b4a'); c.restore();
  }
  function bedSwati(c, t, v) {
    var build = v.build, tt = C.T12(t), S = 22, lean0 = 0.2, seat = seatFor(1230, 540, S, lean0, true);
    var popT = bt(11), k = build ? 1 : 1 - 0.74 * sm(t, bt(12), bt(12) + 0.6);
    var reach = build ? 0 : sm(t, bt(11) + 0.2, bt(12)) * (1 - sm(t, bt(13) + 0.1, bt(13) + 0.5)), pull = build ? 0 : sm(t, bt(12), bt(12) + 0.1) * (1 - sm(t, bt(12) + 0.1, bt(12) + 0.35));
    C.cardboard(build ? '#f2a62e' : mix('#4b3b5c', '#e89a3c', k));
    var cam = C.bump(C.drift({ x: 960, y: 540, z: 1 }, t), t), bead = { x: seat.x - 32.86 * S, y: seat.y - 47.68 * S + pull * 34 }, LX = bead.x + 38 * 2.2, LY = 190;
    lay(cam, 1, function () {
      if (!build) { var sp = so(t, bt(10) + 0.1, bt(10) + 0.5); C.sunburst(-60, 640, 80, 1100, 18, 'rgba(110,205,255,' + (0.20 * sp) + ')', 1, tt * 0.1); disc(-40, 620, 400, 'rgba(70,200,250,' + (0.55 * sp) + ')', 'rgba(255,255,255,0.7)'); }
      C.sunburst(LX, LY - 10, 60, 1700, 18, 'rgba(255,236,180,' + (0.20 * k) + ')', 1, tt * 0.1); C.confetti(45, tt, build ? '#fff3c0' : '#ffe0a0', 9, [0, 0, 1920, 780]);
      stk(LX - 140, LY - 200, 280, 520, function (g) { lampBig(g, LX, LY, 2.2, k, bead.y, pull, tt); }, { rimW: 7, res: 1.2 });
      if (build) stk(30, 430, 720, 660, function (g) { g.save(); g.translate(170, 830); g.scale(1.5, 1.5); g.translate(-BR.mx, -BR.my); var m = machine(g, BR.mx, BR.my, tt, 1, 8 * tt, 930); cloth(g, m, '#d0307a', '#e7679f', tt, 1, 930); g.restore(); }, { rimW: 7, res: 1.2 });
      var base = { pose: 'sit', flip: true, face: 'neutral', t: t, tilt: -0.04, look: [1, build ? 0.3 : -0.1] };
      var arms = build ? { lean: 0.15, armL: [0.7, 1.25], armR: [0.52 + Math.sin(t * 2.4) * 0.03, 2.14 + Math.sin(t * 3.1) * 0.05] }
        : { lean: C.lerp(0.1, lean0, reach), armL: [C.lerp(0.7, 0.35, reach), C.lerp(1.25, 0.5, reach)], armR: [C.lerp(0.52 + Math.sin(t * 2.4) * 0.03, 2.52 - 0.07 * pull, reach), C.lerp(2.14 + Math.sin(t * 3.1) * 0.05, 0.42 + 0.03 * pull, reach)] };
      var o = CAST.withTake(Object.assign({}, base, arms), build ? 'laugh' : 'worry', t, build ? bt(11) - 0.26 : popT - 0.32);
      stk(-40, -40, 2000, 1160, function (g) { CAST.draw(g, 'swati', seat.x, seat.y, S * 100, o); }, { res: 1, rimW: 8, dots: false });
    });
  }

  PLACES.bedroom = {
    dur: 14 * BT, year: 2027,
    draw: function (ctx, t, road) {
      C.use(ctx); var c = ctx, v = { build: road.c1 === 'build' };
      if (t < bt(4)) bedShot1(c, t, v); else if (t < bt(7)) (v.build ? bedInsertBuild : bedInsertBan)(c, t); else if (t < bt(10)) bedFace(c, t, v); else bedSwati(c, t, v);
      cap(v.build ? 'At midnight, Aarav practises with the *AI*.' : 'The ban ends at the classroom *door*.', t, 0.3, bt(5));
      cap(v.build ? 'By morning, Meera ma\'am knows where he\'s *stuck*.' : 'At midnight, Aarav asks the AI *anyway*.', t, bt(6), 8.5);
    },
    events: function (road) {
      var build = road.c1 === 'build', e = [[bt(1), 'pop'], [0.3, 'sew'], [0.9, 'sew'], [1.5, 'sew'], [2.1, 'sew'], [bt(1.6), 'tick'], [bt(3.2), 'tick'],
        [bt(3.2) + 0.05, 'whooshIn'], [bt(4), 'pop']];
      if (build) e.push([bt(4) + 0.25, 'pop'], [bt(4) + 0.41, 'pop'], [bt(4) + 0.57, 'pop'], [bt(6), 'notify']);
      else { [0.4, 0.5, 0.6, 0.7, 0.8, 0.9].forEach(function (d) { e.push([bt(4) + d + 0.2, 'click']); }); e.push([bt(6), 'notify'], [bt(6) + 0.05, 'pop']); }
      e.push([bt(7), 'swish'], [bt(7), 'clack'], [bt(8) - 0.45, 'whooshIn'], [bt(8), 'clank'], [bt(10), 'swish'], [bt(10), 'clack'], [bt(11), build ? 'pop' : 'blip'], [bt(11) + 0.6, 'sew']);
      if (!build) e.push([bt(12), 'switch']); else e.push([bt(12), 'sew'], [bt(13), 'sew']);
      return e;
    }
  };


  /* ================= SHOP: the set, as cut-outs ================= */
  var SH = { mx: 1040, my: 742, swX: 1428, swY: 842, fy: 930, phone: { x: 1130, y: 733 } };
  var ROLLS = ['#d0307a', '#19a8a5', '#f5a30a', '#66bb2a', '#2a56c6', '#e2453c', '#7b3fa0', '#f4ead7', '#ff7a3d', '#0f8a6e', '#c01f64', '#f2d12e'];

  function roll(c, x, y, r, col, seed) {                // the round end of a bolt of cloth
    ell(x, y, r, r, col); c.save(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2.4; for (var i = 1; i < 4; i++) { c.beginPath(); c.arc(x, y, r * (0.26 + i * 0.2), 0.3 + seed, 5.4 + seed); c.stroke(); }
    ell(x, y, r * 0.2, r * 0.2, 'rgba(60,30,10,0.55)'); ell(x - r * 0.32, y - r * 0.38, r * 0.3, r * 0.14, 'rgba(255,255,255,0.32)', -0.6); c.restore();
  }
  function blouseShape(c, x, y, col, trim, sway, scale) {
    c.save(); c.translate(x, y); c.rotate(sway); c.scale(scale || 1, scale || 1); seg(0, -26, 0, -12, '#2a2a2a', 3); c.strokeStyle = '#2a2a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-34, 8); c.lineTo(0, -12); c.lineTo(34, 8); c.stroke();
    var pts = [[-14, 6], [-44, 12], [-64, 48], [-46, 56], [-34, 42], [-36, 108], [-30, 130], [30, 130], [36, 108], [34, 42], [46, 56], [64, 48], [44, 12], [14, 6], [0, 26]];
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = col; c.fill();
    c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,0.3)'; for (var gy = -10; gy < 140; gy += 11) for (var gx = -70 + ((gy / 11) % 2) * 6; gx < 70; gx += 12) { c.beginPath(); c.arc(gx, gy, 2.2, 0, TAU); c.fill(); } c.restore();
    c.strokeStyle = trim; c.lineWidth = 3.4; c.beginPath(); c.moveTo(-14, 6); c.lineTo(0, 26); c.lineTo(14, 6); c.stroke(); c.beginPath(); c.moveTo(-30, 126); c.lineTo(30, 126); c.stroke(); c.restore();
  }
  function pShutter(c, t, S) {
    var x0 = 170, x1 = 1750; pc(x0, -70, x1 - x0, 150, '#5d6672', 210, { r: 3, dots: '#000', dotA: 0.2 });
    c.save(); C.path(C.tornRect2(x0 + 12, 70, x1 - x0 - 24, S - 70, 211, 3, 'b')); c.clip(); var g = c.createLinearGradient(0, 70, 0, S); g.addColorStop(0, '#aab5c1'); g.addColorStop(1, '#8794a2'); c.fillStyle = g; c.fillRect(x0, 60, x1 - x0, S);
    for (var y = 84; y < S; y += 22) { c.fillStyle = 'rgba(40,50,62,0.30)'; c.fillRect(x0, y, x1 - x0, 4); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x0, y + 5, x1 - x0, 3); } c.restore();
    pc(x0, S - 8, x1 - x0, 38, '#3e464f', 212, { r: 2 }); pc(x0, 60, 20, S - 40, '#4a525c', 213, { r: 2 }); pc(x1 - 20, 60, 20, S - 40, '#4a525c', 214, { r: 2 });
    c.strokeStyle = '#e8e4d6'; c.lineWidth = 7; c.beginPath(); c.arc(560, S + 10, 16, 0, TAU); c.stroke(); pc(1380, S + 2, 30, 34, '#c9a24a', 215, { r: 1 }); c.strokeStyle = '#c9a24a'; c.lineWidth = 5; c.beginPath(); c.arc(1395, S + 2, 11, Math.PI, 0); c.stroke();
  }
  function pRack(c) {
    pc(204, 296, 24, 580, '#9a6a45', 221, { r: 2 }); pc(556, 296, 24, 580, '#9a6a45', 222, { r: 2 });
    for (var sh = 0; sh < 4; sh++) { var by = 410 + sh * 120; pc(204, by, 376, 14, '#b9854f', 223 + sh, { r: 2 }); for (var k = 0; k < 3; k++) roll(c, 270 + k * 104, by - 48, 46, ROLLS[(sh * 3 + k * 5 + 2) % ROLLS.length], k * 0.7 + sh); }
  }
  function pRate(c, fee) {
    c.save(); c.translate(730, 500); c.rotate(-0.025); pc(-100, -92, 200, 188, '#e6c796', 230, { r: 3, dots: 'rgba(90,50,20,0.7)', dotA: 0.12 }); C.tape(0, -94, 56, 0.05, { h: 22 });
    lbl('RATE CARD', 0, -62, 30, '#7b1d22', 'center', 800); [['BLOUSE', '250'], ['FALL-PICO', '30'], ['ALTERATION', '50']].forEach(function (r, i) { lbl(r[0], -84, -22 + i * 38, 26, '#3a2a1c', 'left', 700); lbl('₹' + r[1], 84, -22 + i * 38, 27, '#7b1d22', 'right', 800); seg(-84, -4 + i * 38, 84, -4 + i * 38, 'rgba(60,40,20,0.35)', 1.5); }); c.restore();
  }
  function pClockShop(c, hrs) {
    c.save(); c.translate(900, 470); ell(0, 0, 46, 46, '#e83c8c'); ell(0, 0, 38, 38, '#fbf5e8');
    for (var hh = 0; hh < 12; hh++) { var ha = hh * TAU / 12; seg(Math.sin(ha) * 30, -Math.cos(ha) * 30, Math.sin(ha) * 35, -Math.cos(ha) * 35, '#3a2a1c', hh % 3 ? 1.5 : 3); }
    var ha2 = (hrs % 12) / 12 * TAU, ma = (hrs % 1) * TAU; seg(0, 0, Math.sin(ha2) * 20, -Math.cos(ha2) * 20, INK, 4.5); seg(0, 0, Math.sin(ma) * 30, -Math.cos(ma) * 30, INK, 3); ell(0, 0, 3.5, 3.5, '#c0262d'); c.restore();
  }
  function pTally(c) {
    c.save(); c.translate(1050, 462); c.rotate(0.03); pc(-86, -66, 172, 140, PAPER, 231, { r: 2 }); C.tape(0, -68, 48, -0.05, { h: 22 });
    lbl('BLOUSES · TERM 2', 0, -46, 22, '#7b1d22', 'center', 800); c.strokeStyle = '#27489c'; c.lineWidth = 3; c.lineCap = 'round';
    for (var g = 0; g < 8; g++) { var gx = -70 + (g % 4) * 38, gy = -14 + Math.floor(g / 4) * 44; for (var s = 0; s < 4; s++) { c.beginPath(); c.moveTo(gx + s * 6, gy); c.lineTo(gx + s * 6, gy + 28); c.stroke(); } c.beginPath(); c.moveTo(gx - 4, gy + 22); c.lineTo(gx + 24, gy + 6); c.stroke(); } c.restore();
  }
  function pPatterns(c) {
    [[1190, 440, 100, 130, '#d8b88a', -0.04], [1300, 450, 84, 116, '#cfa97a', 0.05]].forEach(function (p, i) { c.save(); c.translate(p[0], p[1]); c.rotate(p[5]); pc(-p[2] / 2, 0, p[2], p[3], p[4], 232 + i, { r: 3 }); c.strokeStyle = 'rgba(70,40,20,0.7)'; c.lineWidth = 2; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(-p[2] * 0.3, 24); c.quadraticCurveTo(0, 54, p[2] * 0.3, 24); c.lineTo(p[2] * 0.32, p[3] - 18); c.lineTo(-p[2] * 0.32, p[3] - 18); c.closePath(); c.stroke(); c.setLineDash([]); c.restore(); C.tape(p[0], p[1], 40, 0.1, { h: 20 }); });
  }
  function pRail(c, t) { seg(1440, 418, 1700, 418, '#3a3f46', 5); [['#e83c8c', '#f4d977'], ['#19a8a5', '#fbf5e8'], ['#f5a30a', '#7b1d22'], ['#66bb2a', '#f4d977'], ['#7b3fa0', '#f2d12e']].forEach(function (b, i) { blouseShape(c, 1478 + i * 56, 440, b[0], b[1], Math.sin(t * 1.3 + i * 1.1) * 0.03, 0.72); }); }
  function pDressForm(c, t) {
    var x = 1632; seg(x, 620, x, 872, '#6b4a33', 10); [[-64, 906], [64, 906], [0, 912]].forEach(function (l) { seg(x, 868, x + l[0], l[1], '#6b4a33', 8); });
    var half = [[-16, 436], [-24, 452], [-66, 476], [-64, 520], [-48, 566], [-52, 612], [-62, 668], [-56, 690]], pts = half.concat(half.slice().reverse().map(function (p) { return [-p[0], p[1]]; })).map(function (p) { return [x + p[0], p[1]]; });
    poly(pts, '#e0d2ab', { dots: 'rgba(120,90,50,0.7)', dotA: 0.14 }); c.strokeStyle = 'rgba(120,90,50,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 450); c.lineTo(x, 690); c.moveTo(x - 50, 520); c.quadraticCurveTo(x, 540, x + 50, 520); c.stroke(); ell(x, 424, 13, 16, '#9a6a45');
    var bl = [[x - 60, 478], [x - 14, 462], [x, 482], [x + 14, 462], [x + 60, 478], [x + 58, 532], [x + 44, 566], [x - 44, 566], [x - 58, 532]]; poly(bl, '#d0307a', { dots: '#fff', dotA: 0.3 });
    c.strokeStyle = '#f4d977'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 14, 462); c.lineTo(x, 482); c.lineTo(x + 14, 462); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.8; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(x - 44, 566); c.lineTo(x + 44, 566); c.stroke(); c.setLineDash([]);
    [[-50, 500], [-30, 540], [26, 546], [50, 506], [-8, 560]].forEach(function (p, i) { ell(x + p[0], p[1], 3.2, 3.2, ['#f2d12e', '#e2453c', '#19a8a5'][i % 3]); });
    c.strokeStyle = '#f0d36a'; c.lineWidth = 7; c.beginPath(); c.moveTo(x - 30, 452); c.quadraticCurveTo(x - 36, 520, x - 24, 584 + Math.sin(t * 1.5) * 3); c.stroke();
  }
  function pGanpati(c) {
    c.save(); c.translate(1752, 560); ell(0, 0, 28, 28, '#f4d977'); ell(0, 0, 21, 21, '#e8581f'); ell(-15, -4, 10, 12, '#f08a3c'); ell(15, -4, 10, 12, '#f08a3c'); ell(0, -2, 12, 13, '#f5a05a'); ell(0, -20, 7, 7, '#f2d12e');
    c.strokeStyle = '#c0392b'; c.lineWidth = 3.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(-4, 15, 9, 15); c.stroke(); ell(-5, -4, 1.7, 1.7, INK); ell(5, -4, 1.7, 1.7, INK); c.restore();
  }
  function pChair(c) {
    c.save(); c.translate(770, 900); c.fillStyle = '#2a56c6'; c.beginPath(); c.moveTo(-62, -150); c.quadraticCurveTo(-76, -90, -60, -72); c.lineTo(-48, -72); c.quadraticCurveTo(-58, -100, -46, -150); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-64, -80); c.quadraticCurveTo(0, -60, 66, -78); c.lineTo(66, -60); c.quadraticCurveTo(0, -42, -64, -60); c.closePath(); c.fill();
    [[-52, -60, -58, 0], [-40, -60, -34, 0], [58, -66, 64, 0], [44, -64, 38, 0]].forEach(function (l) { seg(l[0], l[1], l[2], l[3], '#1b3a8c', 6); }); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-60, -78, 120, 5); c.restore();
  }
  function pTube(c, t, v) {
    var x = 930, y = 372, fl = 1 - (v.viral ? 0 : 0.10 * Math.max(0, Math.sin(t * 17)) * Math.max(0, Math.sin(t * 2.3)));
    seg(x - 150, y - 60, x - 150, y - 6, '#555', 2); seg(x + 150, y - 60, x + 150, y - 6, '#555', 2); pc(x - 190, y - 6, 380, 12, '#d9dee4', 240, { r: 1 });
    rr(x - 180, y + 4, 360, 16, 8); c.fillStyle = mix('#cfd8e0', '#ffffff', fl); c.fill();
  }
  function pTin(c, x, y, count) {
    c.save(); c.translate(x, y); c.fillStyle = '#c0262d'; c.fillRect(-64, -40, 128, 40); c.fillStyle = '#f2d12e'; c.fillRect(-64, -24, 128, 6); for (var f = 0; f < 4; f++) ell(-42 + f * 28, -11, 6, 6, f % 2 ? '#fff3c0' : '#fbd75a');
    c.save(); c.translate(-62, -40); c.rotate(-1.15); c.fillStyle = '#d93a40'; c.fillRect(0, -6, 128, 8); c.fillStyle = '#f2d12e'; c.fillRect(0, -6, 128, 2); c.restore();
    var cols = ['#b8a58a', '#c5b6e0', '#f2d12e', '#8fcfe0', '#8ec97f']; for (var n = 0; n < Math.min(count, 4); n++) { c.save(); c.translate(-30 + n * 18, -40); c.rotate(-0.1 + n * 0.07); c.fillStyle = cols[n % 5]; c.fillRect(-12, -26, 34, 30); c.restore(); }
    c.restore();
  }
  function note(c, x, y, rot, kind, sc) {
    var cols = [['#b9a98c', '500'], ['#c9b8e6', '100'], ['#f2d12e', '200'], ['#8fcfe0', '50'], ['#8ec97f', '20']][kind % 5];
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc || 1, sc || 1); c.fillStyle = cols[0]; c.fillRect(-32, -15, 64, 30); c.strokeStyle = 'rgba(40,30,20,0.4)'; c.lineWidth = 1.5; c.strokeRect(-28, -11, 56, 22); ell(-14, 0, 8, 8, 'rgba(40,30,20,0.2)'); lbl(cols[1], 14, 1, 15, 'rgba(40,30,20,0.65)', 'center', 800); c.restore();
  }
  function pShears(c, x, y, rot) {
    c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = '#d3d6df'; c.beginPath(); c.moveTo(-70, -3); c.lineTo(48, -7); c.lineTo(48, 0); c.lineTo(-70, 4); c.closePath(); c.fill(); c.fillStyle = '#b3b7c5'; c.beginPath(); c.moveTo(-70, 4); c.lineTo(48, 0); c.lineTo(40, 7); c.lineTo(-70, 10); c.closePath(); c.fill();
    c.strokeStyle = '#111'; c.lineWidth = 6; c.beginPath(); c.ellipse(-78, -2, 12, 9, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(-80, 14, 14, 9, 0.2, 0, TAU); c.stroke(); c.restore();
  }
  function pPhoneLying(c, x, y, t, pings) {
    c.save(); c.translate(x, y); var last = -9; pings.forEach(function (p) { if (t >= p) last = Math.max(last, p); }); var age = t - last, shake = age < 0.35 ? Math.sin(age * 90) * (1 - age / 0.35) * 3 : 0, lit = age < 0.5 ? 1 : 0.4;
    c.translate(shake, 0); c.fillStyle = '#14161d'; c.beginPath(); c.moveTo(-46, 8); c.lineTo(36, 8); c.lineTo(48, -14); c.lineTo(-34, -14); c.closePath(); c.fill();
    c.fillStyle = mix('#3a6a80', '#9fe6ff', lit); c.beginPath(); c.moveTo(-40, 5); c.lineTo(31, 5); c.lineTo(41, -11); c.lineTo(-30, -11); c.closePath(); c.fill();
    pings.forEach(function (p) { var a = t - p; if (a > 0 && a < 0.7) { c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - a / 0.7)) + ')'; c.lineWidth = 4; c.beginPath(); c.ellipse(0, -2, 40 + a * 120, 12 + a * 40, 0, 0, TAU); c.stroke(); } });
    c.restore();
  }
  function pingBubble(c, x, y, n) {                 // a notification bubble that piles up above the phone
    c.save(); c.translate(x, y); rr(-28, -22, 56, 40, 14); c.fillStyle = '#25d366'; c.fill(); c.beginPath(); c.moveTo(-10, 16); c.lineTo(-18, 30); c.lineTo(4, 18); c.closePath(); c.fill(); lbl(String(n), 0, -2, 26, '#fff', 'center', 800); c.restore();
  }

  /* ---------- the parents' group chat (generic green bubbles, no real app branding) ---------- */
  function chatScreen(g, lt, o) {                   // local coords 0..560 x 0..1000. o: {msgs:[{who,col,text,t0,kind}], typed, badge}
    rr(0, 0, 560, 1000, 64); g.fillStyle = '#10131a'; g.fill(); g.save(); rr(16, 16, 528, 968, 50); g.clip();
    g.fillStyle = '#e6dcc6'; g.fillRect(0, 0, 560, 1000); g.fillStyle = 'rgba(120,90,50,0.10)'; for (var gy = 170; gy < 1000; gy += 34) for (var gx = 20 + ((gy / 34) % 2) * 17; gx < 560; gx += 34) { g.beginPath(); g.arc(gx, gy, 3, 0, TAU); g.fill(); }
    g.fillStyle = '#0b6b57'; g.fillRect(0, 0, 560, 150); g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(52, 70); g.lineTo(34, 88); g.lineTo(52, 106); g.stroke();
    ell(112, 88, 34, 34, '#8e2f3c'); lbl('V', 112, 90, 44, '#fff', 'center', 800); lbl('Vidya Parents · 11-B', 164, 74, 36, '#fff', 'left', 800); lbl('38 participants', 164, 114, 24, '#bfe8da', 'left', 600);
    var nArr = 0, y = 178; o.msgs.forEach(function (m) { if (lt >= m.t0) nArr++; });
    if (o.badge !== false && nArr > 0) { ell(512, 88, 24, 24, '#fff'); lbl(String(nArr), 512, 90, 30, '#0b6b57', 'center', 800); }
    o.msgs.forEach(function (m) {
      var kind = m.kind || 'in', maxW = kind === 'link' ? 340 : 370, size = 36, mm = measure(m.text, maxW, size, 600), lines = kind === 'link' ? 0 : mm.n, h = (kind === 'in' || kind === 'link' ? 38 : 0) + (kind === 'link' ? 150 : lines * 44) + 34, w = Math.max(kind === 'link' ? 420 : mm.w + 44, m.who ? 220 : 0);
      var a = C.prog(lt, m.t0, m.t0 + 0.3), k = 0.7 + 0.3 * bk(a), x = kind === 'out' ? 520 - w : 36;
      if (lt >= m.t0) { g.save(); g.globalAlpha *= CL(a * 4); scaleAbout(g, kind === 'out' ? 520 : 36, y, k);
        rr(x, y, w, h, 24); g.fillStyle = kind === 'out' ? '#d9fdd3' : '#ffffff'; g.shadowColor = 'rgba(0,0,0,0.15)'; g.shadowBlur = 6; g.shadowOffsetY = 2; g.fill(); g.shadowColor = 'transparent';
        var ty = y + 18; if (kind !== 'out') { lbl(m.who, x + 20, ty + 10, 26, m.col || '#2f6fb5', 'left', 800); ty += 38; }
        if (kind === 'link') { rr(x + 14, ty - 6, w - 28, 108, 14); g.fillStyle = '#eef3f4'; g.fill(); rr(x + 26, ty + 8, 74, 74, 16); var lg = g.createLinearGradient(x + 26, ty + 8, x + 100, ty + 82); lg.addColorStop(0, '#19c2a8'); lg.addColorStop(1, '#2f7fd6'); g.fillStyle = lg; g.fill(); lbl('T', x + 63, ty + 47, 56, '#fff', 'center', 800);
          wtext(m.text, x + 114, ty + 30, w - 150, 36, 30, '#1f2b33', null, 700); }
        else wtext(m.text, x + 22, ty + 28, maxW, 44, size, '#1f2b33');
        lbl(kind === 'out' ? '3:14 PM ✓✓' : '3:12 PM', x + w - 18, y + h - 16, 18, '#7a8a90', 'right', 600); g.restore(); }
      y += h + 18;
    });
    g.fillStyle = '#f0f0f0'; g.fillRect(0, 890, 560, 110); rr(30, 906, 420, 58, 29); g.fillStyle = '#fff'; g.fill(); if (o.typed != null) { wtext(o.typed + (Math.floor(lt * 4) % 2 ? '|' : ''), 54, 946, 380, 40, 36, '#1f2b33', null, 600); } else lbl('Message', 54, 936, 30, '#9aa7ab', 'left', 500);
    ell(494, 935, 30, 30, '#0b6b57'); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(482, 935); g.lineTo(506, 935); g.moveTo(497, 923); g.lineTo(509, 935); g.lineTo(497, 947); g.stroke();
    g.restore();
  }

  /* ================= SHOP: shot 1 — the shop ================= */
  function shopWorld(c, t, cam, v) {
    var tt = C.T12(t), S = 300 + (v.viral ? 0 : 130 * C.prog(t, 0.2, bt(3))), run = v.viral ? 1 - sm(t, 1.0, 1.25) : 0, spin = 8 * Math.min(tt, 1.1), pings = v.viral ? [bt(1), bt(2)] : [bt(2)];
    lay(cam, 0.8, function () { C.sunburst(1180, 600, 80, 1100, 22, 'rgba(245,163,10,0.10)', 1, tt * 0.08); });
    lay(cam, 0.72, function () {
      stk(160, 260, 440, 640, function (g) { pRack(g); });
      stk(610, 396, 240, 230, function (g) { pRate(g); });
      stk(840, 410, 120, 120, function (g) { pClockShop(g, v.viral ? 3.25 : 7.7); });
      stk(950, 380, 200, 180, function (g) { pTally(g); });
      stk(1130, 420, 240, 170, function (g) { pPatterns(g); });
      stk(1420, 380, 320, 190, function (g) { pRail(g, tt); });
      stk(1580, 400, 120, 530, function (g) { pDressForm(g, tt); }, { rimW: 5 });
      stk(1700, 520, 100, 80, function (g) { pGanpati(g); }, { rimW: 4 });
      stk(150, -80, 1620, S + 130, function (g) { pShutter(g, tt, S); }, { rimW: 6 });
      stk(730, 330, 400, 60, function (g) { pTube(g, tt, v); }, { rimW: 4, shadow: false });
    });
    lay(cam, 1, function () {
      pc(-600, 846, 3200, 700, '#a99a76', 205, { r: 8, sides: 't', dots: '#000', dotA: 0.14, sp: 12, grain: 0.2, sh: true, sy: -3, blur: 14 });
      stk(700, 730, 160, 190, function (g) { pChair(g); });
      stk(880, 470, 560, 480, function (g) {
        var m = machine(g, SH.mx, SH.my, tt, run, spin, SH.fy); cloth(g, m, '#d0307a', '#e7679f', tt, run, SH.fy);
        pShears(g, 1190, 736, 0.05); pPhoneLying(g, SH.phone.x, SH.phone.y, t, pings); if (!v.viral) { pTin(g, 1330, 742, 3); var nn = Math.min(5, Math.floor(t / 0.3)); for (var i = 0; i < nn; i++) note(g, 1236 + i * 3, 730 - i * 5, -0.05 + i * 0.03, i, 0.9); } }, { rimW: 5 });
      var o;
      if (v.viral) { o = CAST.doubleTake({ pose: 'sit', flip: true, face: 'neutral', t: t, lean: 0.1, tilt: -0.05, look: [1, 0.55], armL: [0.7, 1.25 + Math.sin(t * 2.4) * 0.03], armR: [0.52 + Math.sin(t * 2.4 + 1) * 0.03 * run, 2.14 + Math.sin(t * 3.1) * 0.05 * run] }, t, 0.78); }
      else o = { pose: 'sit', flip: true, face: 'tired', t: t, lean: 0.12, tilt: 0.04, look: [1, 0.7], armL: [0.7 + Math.sin(t * 6) * 0.06, 1.25], armR: [0.52 + Math.sin(t * 5 + 1) * 0.05, 2.14 + Math.sin(t * 5) * 0.08] };
      stk(1340, 500, 320, 500, function (g) { pc(SH.swX - 70, SH.swY + 2, 140, 20, '#9a6a45', 119, { r: 2 }); seg(SH.swX - 50, SH.swY + 20, SH.swX - 60, 936, '#5b3a26', 12); seg(SH.swX + 50, SH.swY + 20, SH.swX + 60, 936, '#5b3a26', 12);
        var H = CAST.draw(g, 'swati', SH.swX, SH.swY, 560, o); if (v.viral) C.sweatDrop(H.head.x + 56, H.head.y - 40, C.prog(t, 1.3, 1.85), 1.2); if (!v.viral) { note(g, H.handR.x + 4, H.handR.y - 18, -0.1, 0, 1); note(g, H.handR.x + 10, H.handR.y - 24, 0.1, 1, 1); } }, { rimW: 5 });
      pings.forEach(function (p, i) { var age = t - p; if (age > 0) { var k = bk(C.prog(age, 0, 0.3)), fy = Math.min(1, age / 0.4); c.save(); scaleAbout(c, SH.phone.x + (i - 0.5) * 50, SH.phone.y - 60 - i * 36 - fy * 18, k * 1.9); stk(SH.phone.x + (i - 0.5) * 50 - 40, SH.phone.y - 120 - i * 36, 80, 90, function (g) { pingBubble(g, SH.phone.x + (i - 0.5) * 50, SH.phone.y - 60 - i * 36 - fy * 18, i + 1); }, { rimW: 4 }); c.restore(); } });
    });
    lay(cam, 1.25, function () {
      stk(1820, -60, 140, 560, function (g) { pDrape(g, tt, 1930, -40, 480, '#f5a30a', '#c27a00', true); }, { rimW: 6 });
      stk(-30, -60, 150, 520, function (g) { pDrape(g, tt + 1, 6, -40, 430, '#19a8a5', '#0f7f7c', false); }, { rimW: 6 });
    });
  }
  function shopShot1(c, t, v) {
    var keys = [{ t: 0, x: 980, y: 580, z: 1.06 }, { t: bt(3), x: 1090, y: 610, z: 1.3 }]; var cam = C.bump(C.drift(C.track(t, keys), t), t);
    C.cardboard(v.viral ? '#f3e5c7' : '#efd2a2'); shopWorld(c, t, cam, v);
    if (!v.viral) { var d = 0.28 + 0.4 * C.prog(t, 0, bt(3)); c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = mix('#ffffff', '#e59a73', d); c.fillRect(0, 0, 1920, 1080); c.restore(); }
    var bp = C.prog(t, bt(1) - 0.1, bt(1) + 0.2); if (bp > 0) C.banner('SWATI TAILORS · 2028', 960, 104, { size: 62, rot: -0.015, p: bp, seed: 5, bg: '#f5b82a', fg: '#7b1d22' });
  }

  /* ================= SHOP: shot 2 (viral) — the group chat, full frame ================= */
  function starburst(c, x, y, r0, r1, n, fill) { var pts = []; for (var i = 0; i < n * 2; i++) { var a = i / (n * 2) * TAU, r = i % 2 ? r0 : r1; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } poly(pts, fill, { dots: '#fff', dotA: 0.25 }); }
  function shopChatViral(c, t, v) {
    var lt = t - bt(3), tt = C.T12(t), cam0 = { x: 960, y: 540, z: 1 }, fee = fmtFee(Agamoto.at(v.road, 2028).fees);
    C.cardboard('#c4256b'); var e = C.prog(lt, 0, 0.3), zk = 1 + 0.28 * (1 - C.easeOut(e)), bl = 9 * (1 - C.easeOut(e));
    var msgs = [{ who: 'Mrs. Patil', col: '#b5532a', text: 'Free AI tutor app, same syllabus 😳', t0: bt(1) }, { who: "Rohit's Dad", col: '#2f6fb5', text: 'Why pay ' + fee + '?', t0: bt(2) }, { who: "Neha's Mom", col: '#7b3fa0', text: 'TutorBot · free · 10 lakh downloads', t0: bt(3), kind: 'link' }];
    C.pushFx(zk, bl, function () {
      lay(cam0, 1, function () {
        C.sunburst(960, 520, 100, 1600, 24, 'rgba(255,255,255,0.12)', 1, tt * 0.12); C.confetti(51, tt, '#ffe08a', 10, [0, 0, 1920, 800]);
        var wp = bk(C.prog(lt, 0, 0.35)), im = C.IMG('sewing-wheel'), kz = 1 + 0.12 * C.prog(lt, 0, bt(4));
        c.save(); c.globalAlpha *= CL(wp * 6); scaleAbout(c, 330, 345, (0.6 + 0.4 * wp) * kz, -0.05);
        if (im) C.tornPrint(im, 60, 170, 540, 350, 8, { filter: 'saturate(1.2) contrast(1.05)', paperCol: PAPER, border: 14 });
        else stk(60, 170, 540, 350, function (g) { pc(60, 170, 540, 350, PAPER, 8, { r: 5 }); ell(300, 345, 110, 110, '#14161d'); ell(300, 345, 80, 80, '#34353f'); ell(300, 345, 18, 18, '#c9a24a'); });
        C.tape(120, 176, 100, -0.4, { h: 28 }); C.tape(550, 514, 100, -0.4, { h: 28 }); c.restore();
        var last = 0; msgs.forEach(function (m) { if (lt >= m.t0) last = m.t0; }); var age = lt - last, shake = lt >= bt(1) && age < 0.3 ? Math.sin(age * 100) * 9 * (1 - age / 0.3) : 0;
        c.save(); scaleAbout(c, 960, 540, 0.8 + 0.2 * bk(C.prog(lt, 0, 0.35)) * 1.0, -0.02); c.translate(shake, 0);
        stk(660, 14, 620, 1050, function (g) { g.save(); g.translate(680, 40); chatScreen(g, lt, { msgs: msgs }); g.restore(); }, { rimW: 7 }); c.restore();
        msgs.forEach(function (m) { var p = C.prog(lt, m.t0, m.t0 + 0.4); marks(c, 630, 230, -1, p, '#ffe08a'); marks(c, 1310, 230, 1, p, '#ffe08a'); });
        // FREE sticker, the app's promise, and the pile of downloads
        var fp = bk(C.prog(lt, 0.1, 0.4)); if (fp > 0) { c.save(); scaleAbout(c, 1560, 150, fp, -0.12 + 0.02 * Math.sin(tt * 2)); stk(1410, 10, 300, 300, function (g) { starburst(g, 1560, 150, 100, 135, 14, '#f2d12e'); lbl('FREE', 1560, 142, 92, INK, 'center', 800); lbl('AI TUTOR', 1560, 202, 28, INK, 'center', 800); }, { rimW: 7 }); c.restore(); }
        var pl = lt - bt(3); if (pl > 0) {
          var n = Math.round(1e6 * C.easeOut(C.prog(pl, 0, 0.5))), k = C.countScale(n, 0, 1e6, 0.85, 1.4);
          stk(1260, 420, 620, 460, function (g) { var idx = 0; for (var r = 0; r < 5; r++) for (var q = 0; q < 5 - r; q++) { var pp = bk(C.prog(pl, idx * 0.03, idx * 0.03 + 0.22)); idx++; if (pp <= 0) continue; var px = 1560 + (q - (4 - r) / 2) * 96, py = 830 - r * 92;
              g.save(); scaleAbout(g, px, py, pp); rr(px - 36, py - 62, 72, 120, 14); g.fillStyle = '#10131a'; g.fill(); rr(px - 30, py - 54, 60, 100, 8); g.fillStyle = '#25d366'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py - 28); g.lineTo(px, py + 12); g.moveTo(px - 16, py - 2); g.lineTo(px, py + 18); g.lineTo(px + 16, py - 2); g.stroke(); g.restore(); } }, { rimW: 5 });
          c.save(); scaleAbout(c, 1560, 340, k, 0.03); stk(1280, 270, 560, 130, function (g) { pc(1290, 280, 540, 110, PAPER, 180, { r: 4 }); lbl(n.toLocaleString('en-IN'), 1560, 325, 80, '#c4256b', 'center', 800); lbl('DOWNLOADS', 1560, 370, 28, '#4a423b', 'center', 800); }, { rimW: 6 }); c.restore(); }
      });
    });
  }

  /* ================= SHOP: shot 2 (no viral) — the forty blouses, the fee, the wheel ================= */
  function shopCollage(c, t, v) {
    var lt = t - bt(3), tt = C.T12(t), cam0 = { x: 960, y: 540, z: 1 }, fee = fmtFee(Agamoto.at(v.road, 2028).fees), nB = Math.min(40, Math.max(0, Math.floor((lt - bt(1)) / 0.0125)));
    C.cardboard('#f5a30a'); var cam = C.shake(C.bump(C.drift(cam0, t), t), t, bt(5));
    lay(cam, 1, function () {
      C.sunburst(960, 560, 100, 1600, 24, 'rgba(255,255,255,0.14)', 1, tt * 0.12); C.zigzag(60, 900, 700, 12, '#7b1d22', 8, 36);
      // the print of the machine's hand-wheel, slowly pushed in
      var wp = bk(C.prog(lt, 0, 0.35)), im = C.IMG('sewing-wheel'), kz = 1 + 0.1 * C.prog(lt, 0, bt(3));
      c.save(); c.globalAlpha *= CL(wp * 6); scaleAbout(c, 440, 380, (0.6 + 0.4 * wp) * kz, -0.04);
      if (im) C.tornPrint(im, 80, 150, 720, 450, 8, { filter: 'saturate(1.2) contrast(1.05)', paperCol: PAPER, border: 16 });
      else stk(80, 150, 720, 450, function (g) { pc(80, 150, 720, 450, PAPER, 8, { r: 5 }); ell(330, 380, 150, 150, '#14161d'); ell(330, 380, 110, 110, '#34353f'); ell(330, 380, 24, 24, '#c9a24a'); });
      C.tape(150, 156, 110, -0.4, { h: 30 }); C.tape(740, 596, 110, -0.4, { h: 30 }); c.restore();
      var tg = C.prog(lt, bt(1) - 0.05, bt(1) + 0.3); if (tg > 0) C.banner(nB + ' BLOUSES', 1160, 110, { size: 70 * C.countScale(nB, 0, 40, 0.8, 1.2), rot: -0.03, p: tg, seed: 6, bg: PAPER, fg: '#7b1d22' });
      stk(840, 170, 640, 520, function (g) { for (var i = 0; i < 40; i++) { var pp = bk(C.prog(lt, bt(1) + i * 0.0125, bt(1) + i * 0.0125 + 0.2)); if (pp <= 0) continue; var cx = 905 + (i % 8) * 76, cy = 200 + Math.floor(i / 8) * 96; g.save(); scaleAbout(g, cx, cy + 36, pp); blouseShape(g, cx, cy, ROLLS[i % ROLLS.length], i % 2 ? '#fbf5e8' : '#f4d977', 0, 0.58); g.restore(); } }, { rimW: 5 });
      // the term fee, as a growing stack of banknotes, stamped
      var sp = C.prog(lt, bt(2) - 0.24, bt(2) + 0.24); C.inkStamp('ONE TERM', 1715, 250, sp, { size: 60, col: '#7b1d22', rot: -0.08, seed: 9, bg: '#f5a30a' });
      var nn = Math.min(9, Math.max(0, Math.floor((lt - bt(2)) / 0.055))), fv = Agamoto.at(v.road, 2028).fees, nFee = Math.round(fv / 500) * 500 * C.easeOut(C.prog(lt, bt(2), bt(2) + 0.5));
      stk(1500, 520, 420, 420, function (g) { for (var i = 0; i < nn; i++) note(g, 1715 + (i % 2) * 6, 900 - i * 40, -0.04 + (i % 3) * 0.04, i % 5, 3); }, { rimW: 5 });
      if (lt >= bt(2)) { c.save(); scaleAbout(c, 1715, 400, C.countScale(nFee, 0, fv, 0.8, 1.2), 0.03); stk(1500, 340, 420, 120, function (g) { pc(1520, 350, 380, 96, PAPER, 181, { r: 4 }); lbl('\u20B9' + (Math.round(nFee / 500) * 500).toLocaleString('en-IN'), 1715, 400, 60, '#7b1d22', 'center', 800); }, { rimW: 6 }); c.restore(); }
    });
  }

  /* ================= SHOP: shot 3 — Swati, big ================= */
  function shopFace(c, t, v) {
    var tt = C.T12(t), S = 22, seat = seatFor(1280, 540, S, 0.1, true), fee = fmtFee(Agamoto.at(v.road, 2028).fees), retrain = v.road.c2 === 'retrain', build = v.road.c1 === 'build';
    var t0 = v.viral ? bt(7) : bt(6), popT = bt(8), pop2 = bt(9), kind, ground;
    if (v.viral) { kind = build ? 'resolve' : 'worry'; ground = build ? '#19a8a5' : '#6b4f8c'; } else { kind = retrain ? 'realize' : 'sag'; ground = retrain ? '#f2a516' : '#5f4b8b'; }
    var takeT = v.viral ? bt(8) : bt(9); C.cardboard(ground);
    var cam = C.shake(C.bump(C.drift({ x: 960, y: 540, z: 1 }, t), t), t, v.viral && !build ? bt(8) : 99);
    lay(cam, 1, function () {
      C.sunburst(1280, 520, 150, 1800, 22, 'rgba(255,255,255,0.14)', 1, tt * 0.14); C.confetti(61, tt, '#fff3c0', 10, [0, 0, 1920, 780]);
      var o = CAST.withTake({ pose: 'sit', flip: true, face: v.viral ? 'worried' : 'tired', t: t, lean: 0.1, tilt: -0.04, look: [1, v.viral ? 0.35 : 0.1], armL: [0.1, 0.1], armR: [0.1, 0.1] }, kind, t, takeT - (kind === 'sag' ? 0.4 : 0.32));
      stk(-40, -40, 2000, 1160, function (g) { CAST.draw(g, 'swati', seat.x, seat.y, S * 100, o); }, { res: 1, rimW: 8, dots: false });
      if (v.viral && build) {                       // the progress sheet with green ticks, then the typed reply
        var lt = t - bt(7), sp = bk(C.prog(lt, 0, 0.3)); c.save(); c.globalAlpha *= CL(sp * 6); scaleAbout(c, 330, 430, 0.6 + 0.4 * sp, -0.05); stk(60, 90, 560, 700, function (g) {
          pc(80, 110, 520, 660, PAPER, 190, { r: 5 }); lbl('AARAV KALE · XI-B', 120, 170, 44, '#7b1d22', 'left', 800); lbl('PROGRESS · TERM 2', 120, 214, 28, '#4a423b', 'left', 700); seg(120, 236, 560, 236, 'rgba(60,40,20,0.3)', 3);
          ['Mechanics', 'Algebra', 'Chemistry', 'Torque'].forEach(function (s, i) { var y = 300 + i * 100; lbl(s, 130, y, 50, INK, 'left', 600); seg(130, y + 30, 560, y + 30, 'rgba(60,40,20,0.2)', 2); var tp = C.prog(lt, 0.15 + i * 0.12, 0.35 + i * 0.12);
            if (tp > 0) { g.strokeStyle = '#1fa463'; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(480, y - 6); var q = Math.min(1, tp * 2); g.lineTo(480 + 26 * Math.min(1, q * 2), y - 6 + 28 * Math.min(1, q * 2)); if (q > 0.5) g.lineTo(480 + 26 + 56 * (q - 0.5) * 2, y + 22 - 66 * (q - 0.5) * 2); g.stroke(); } });
          lbl(retrain ? "Mentor: Meera ma'am" : 'AI tutor: 24 sessions', 120, 730, 32, '#2f7f6a', 'left', 700); C.tape(340, 112, 100, 0.05, { h: 28 }); }, { rimW: 7 }); c.restore();
        var pp = bk(C.prog(t, bt(8), bt(8) + 0.3)); if (pp > 0) { var nT = Math.floor(C.prog(t, bt(8) + 0.2, bt(9) - 0.05) * 8), sent = t >= bt(9), lt2 = t - bt(8); c.save(); c.globalAlpha *= CL(pp * 6); scaleAbout(c, 770, 520, 0.8 * (0.7 + 0.3 * pp), 0.04); stk(440, 20, 560, 1000, function (g) { g.save(); g.translate(440, 20); chatScreen(g, lt2, { badge: false, msgs: [{ who: "Neha's Mom", col: '#7b3fa0', text: 'TutorBot · free · 10 lakh downloads', t0: -1, kind: 'link' }, { text: 'Staying.', t0: bt(1), kind: 'out' }], typed: sent ? null : 'Staying.'.slice(0, nT) }); g.restore(); }, { rimW: 8 }); c.restore(); }
      } else if (v.viral) {                         // the fee receipt, a growing stack of notes, PAID
        var lt3 = t - bt(7), rp = bk(C.prog(lt3, 0, 0.3)); c.save(); c.globalAlpha *= CL(rp * 6); scaleAbout(c, 330, 430, 0.6 + 0.4 * rp, -0.05); stk(60, 90, 560, 700, function (g) {
          pc(80, 110, 520, 660, PAPER, 191, { r: 5 }); lbl('VIDYA CLASSES', 120, 170, 52, '#7b1d22', 'left', 800); lbl('FEE RECEIPT · TERM 2', 120, 216, 28, '#4a423b', 'left', 700); seg(120, 238, 560, 238, 'rgba(60,40,20,0.3)', 3);
          lbl('Aarav Kale · XI-B', 130, 300, 44, INK, 'left', 600); lbl('Tuition fee', 130, 400, 40, '#4a423b', 'left', 600); lbl(fee, 560, 400, 60, INK, 'right', 800); seg(130, 436, 560, 436, 'rgba(60,40,20,0.25)', 2); lbl('Received with thanks', 130, 520, 34, '#4a423b', 'left', 600);
          g.strokeStyle = '#27489c'; g.lineWidth = 4; g.beginPath(); g.moveTo(380, 640); g.bezierCurveTo(420, 590, 440, 690, 480, 630); g.bezierCurveTo(500, 600, 520, 660, 560, 620); g.stroke(); C.tape(340, 112, 100, 0.05, { h: 28 }); }, { rimW: 7 }); c.restore();
        C.inkStamp('PAID', 420, 590, C.prog(t, bt(8) - 0.24, bt(8) + 0.24), { size: 96, col: '#7a1f1f', rot: -0.2, seed: 8, bg: ground });
        var nn = Math.min(9, Math.max(0, Math.floor((t - bt(7) - 0.1) / 0.055))), n = Math.round(Agamoto.at(v.road, 2028).fees / 500) * 500 * C.easeOut(C.prog(t, bt(7), bt(8)));
        stk(600, 330, 440, 500, function (g) { for (var i = 0; i < nn; i++) note(g, 820 + (i % 2) * 6, 790 - i * 40, -0.04 + (i % 3) * 0.04, 0, 3); }, { rimW: 5 });
        c.save(); scaleAbout(c, 820, 320, C.countScale(n, 0, 64500, 0.8, 1.35), 0.03); stk(630, 270, 400, 100, function (g) { pc(650, 280, 360, 80, PAPER, 192, { r: 4 }); lbl('₹' + (Math.round(n / 500) * 500).toLocaleString('en-IN'), 830, 322, 60, '#7b1d22', 'center', 800); }, { rimW: 6 }); c.restore();
      } else {                                      // no viral: the parents' chat as a phone card, two messages
        var lt4 = t - bt(6), pc2 = bk(C.prog(lt4, 0, 0.3)), m1 = cutMsgs(v.road);
        var msgs = [{ who: 'Mrs. Patil', col: '#b5532a', text: m1[0], t0: bt(1) }, { who: "Rohit's Dad", col: '#2f6fb5', text: m1[1], t0: bt(2) }];
        c.save(); c.globalAlpha *= CL(pc2 * 6); scaleAbout(c, 420, 500, 0.8 * (0.7 + 0.3 * pc2), -0.03); stk(130, 0, 600, 1000, function (g) { g.save(); g.translate(140, 10); chatScreen(g, lt4, { msgs: msgs }); g.restore(); }, { rimW: 8 }); c.restore();
        [bt(1), bt(2)].forEach(function (p) { var pr = C.prog(lt4, p, p + 0.4); marks(c, 90, 250, -1, pr, '#fff3c0'); marks(c, 760, 250, 1, pr, '#fff3c0'); });
      }
    });
  }
  function cutMsgs(road) {
    if (road.c2 === 'cut') return ['Vidya cut fees again 👍', "Meera ma'am left?"];
    return road.c1 === 'build' ? ['Fees up again 😕', "Aarav's mentor called me today!"] : ['Fees up again 😕', 'A teacher stays till 8 for doubts'];
  }

  PLACES.shop = {
    dur: 10 * BT, year: 2028,
    draw: function (ctx, t, road) {
      C.use(ctx); var c = ctx, viral = road.luck.some(function (l) { return l.id === 'viral' && l.hit; }), v = { viral: viral, road: road };
      if (t < bt(3)) shopShot1(c, t, v);
      else if (viral) { if (t < bt(7)) shopChatViral(c, t, v); else shopFace(c, t, v); }
      else { if (t < bt(6)) shopCollage(c, t, v); else shopFace(c, t, v); }
      var c1 = road.c1, c2 = road.c2;
      if (viral) { cap('2028. A free AI tutor app goes *viral*.', t, 0.3, bt(5)); cap(c1 === 'build' ? "Swati stays: the app can't sit *beside* Aarav." : 'Swati wonders what her fees still *buy*.', t, bt(6), 6.05); }
      else { cap('2028. Swati sews forty blouses to pay one *term*.', t, 0.3, bt(5)); cap(c2 === 'cut' ? 'This year the fee is lower. So are the *teachers*.' : "The fee went up. Someone at Vidya knows Aarav's *name*.", t, bt(6), 6.05); }
    },
    events: function (road) {
      var viral = road.luck.some(function (l) { return l.id === 'viral' && l.hit; }), build = road.c1 === 'build', e = [[bt(1), 'pop']];
      if (viral) {
        e.push([bt(1), 'notify'], [bt(2), 'notify'], [0.3, 'sew'], [0.6, 'sew'], [0.9, 'sew'], [bt(3) - 0.45, 'whooshIn'], [bt(3), 'swish'], [bt(3) + 0.1, 'pop'], [bt(4), 'notify'], [bt(5), 'notify'], [bt(6), 'notify'], [bt(6) + 0.1, 'zip', 0], [bt(7), 'swish']);
        if (build) e.push([bt(7), 'pop'], [bt(7) + 0.2, 'tick'], [bt(8), 'pop'], [bt(8) + 0.3, 'click'], [bt(8) + 0.45, 'click'], [bt(8) + 0.6, 'click'], [bt(9), 'notify']);
        else e.push([bt(7), 'pop'], [bt(7) + 0.1, 'cash'], [bt(7) + 0.3, 'cash'], [bt(8) - 0.45, 'whooshIn'], [bt(8), 'clank']);
      } else {
        e.push([bt(2), 'notify'], [0.3, 'cash'], [0.7, 'cash'], [1.1, 'cash'], [bt(3) - 0.05, 'swish'], [bt(3), 'pop'], [bt(4), 'zip', 4], [bt(5) - 0.45, 'whooshIn'], [bt(5), 'clank'], [bt(5) + 0.1, 'cash'], [bt(5) + 0.3, 'cash'], [bt(6), 'swish'], [bt(6), 'pop'], [bt(7), 'notify'], [bt(8), 'notify'], [bt(9), road.c2 === 'retrain' ? 'ding' : 'blip']);
      }
      return e;
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
