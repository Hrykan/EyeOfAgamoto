/* cast.js — the named people of the story, drawn as paper-collage characters with faces, two-joint arms and props.
   Global `CAST`. Needs collage.js (C). Pure: same inputs, same pixels.

   CAST.draw(ctx, who, x, y, h, o) -> { head, handL, handR } (world coords, for aiming props/callouts)
     who  'aarav' | 'swati' | 'meera' | 'sunanda' | 'extra:<n>' (any n: a generic student/parent/teacher look)
     x,y  feet on the floor ('stand' / 'walk'), or the seat point ('sit')
     h    standing height in px (a seated figure is drawn at the same scale, so it reads ~0.6 h tall)
     o    { pose: 'stand'|'sit'|'walk', walk: phase (radians, advance ~7 per second for a normal pace),
            flip: bool (default faces right; flip faces left), lean: radians (upper body, + leans forward),
            tilt: radians (head), face: see FACES, look: [dx, dy] pupils -1..1, t: seconds (breath, blink),
            armL / armR: [shoulder, elbow] radians. 0 = hanging down; + swings forward (toward the facing side),
                         PI/2 = straight forward; elbow + bends the forearm further forward/up.
            holdL / holdR: 'phone'|'tablet'|'box'|'chalk'|'cup'|'book'|'letter'|'pen'|'sweets'|'bag'|null,
            glow: 0..1 (phone/tablet screen glow), blink: false to disable, alpha,
            squash: + squashes / − stretches around the feet (volume kept), lift: px hop, shut: eyes closed,
            pivot: 'feet' (default, full-body shots) | 'chest' (close-ups: squash about the chest so the head stays framed),
            hairLag / clothLag: follow-through offsets for braid/bun and dupatta/pallu (CAST.withTake fills them) }
   Acting (kit2.js motion layer): CAST.take(kind, lt, t0) → a four-beat take (anticipation → pop → settle) as draw options;
   CAST.withTake(o, kind, lt, t0) merges it with follow-through; CAST.doubleTake(o, lt, t0) glance-away/back + pop.
   Kinds: surprise · joy · sag (bad news lands) · resolve · worry · realize · laugh.
   Arms: L is the far arm (drawn behind the body), R the near arm (in front).
   Recipes: CAST.ARMS.* are ready-made arm pairs (wave, hips, phoneLook, carryBox, point, think, clap, write, hug).
*/
(function (root) {
  'use strict';
  var P = C.PALETTE;
  var CAST = {};

  CAST.WHO = {
    // Aarav Kale, 14 in 2026 (Class 9), wants to be an engineer. Mustard tee, open blue checked shirt, messy hair.
    aarav: { name: 'Aarav', skin: '#8d5a3c', hair: '#1b1714', style: 'messy', top: '#e3b23c', over: '#3f6fa8', overCheck: '#2c5283', legs: '#2c3442', shoes: '#ece4d4', sleeve: 'long', build: 0.9 },
    // Swati Kale, his mother, a tailor. Maroon kurta, mustard dupatta, braid, bindi, measuring tape round her neck.
    swati: { name: 'Swati', skin: '#a8714f', hair: '#221c18', style: 'braid', top: '#8e2f3c', kurta: true, dupatta: '#d9a933', legs: '#eadcbf', shoes: '#5a3a2a', bindi: true, tape: true, sleeve: 'elbow', build: 1 },
    // Meera Deshpande, chemistry teacher, 12 years at Vidya. Teal-green handloom saree with a red border, low bun, watch.
    meera: { name: 'Meera', skin: '#b57e5a', hair: '#2a221d', style: 'lowbun', saree: '#2f7f6a', border: '#c2412d', blouse: '#c2412d', shoes: '#4a3428', watch: true, sleeve: 'short', build: 0.97 },
    // Sunanda Joshi, founder. Saffron saree, rust pallu, grey-streaked bun, glasses.
    sunanda: { name: 'Sunanda', skin: '#9a6648', hair: '#4a423b', grey: true, style: 'bun', saree: '#e0863e', border: '#b9542d', blouse: '#b9542d', shoes: '#4a3428', glasses: true, sleeve: 'short', build: 1.03 }
  };
  CAST.extra = function (n) {
    var r = C.rand(9000 + n), tops = ['#2f7f7a', '#e2664f', '#d9a933', '#4b6fa8', '#7d5a8c', '#c98b4a', '#3f8f5f', '#b84a62', '#5b8f9e'],
        skins = ['#a8714f', '#8d5a3c', '#c48a63', '#7a4b33', '#b57e5a', '#9a6648'], legsC = ['#2c3442', '#4a423b', '#3a4f6a', '#5a4a3a'];
    var kind = n % 4, top = tops[Math.floor(r() * tops.length)];
    var o = { name: 'extra', skin: skins[Math.floor(r() * skins.length)], hair: r() < 0.15 ? '#5a4a40' : '#1f1a17', top: top, legs: legsC[Math.floor(r() * legsC.length)], shoes: '#3a2c24', sleeve: r() < 0.5 ? 'short' : 'long', build: 0.9 + r() * 0.15 };
    if (kind === 0) { o.style = 'messy'; }
    else if (kind === 1) { o.style = 'braid'; o.kurta = true; o.dupatta = tops[(Math.floor(r() * 9) + 4) % 9]; o.legs = '#eadcbf'; o.bindi = r() < 0.5; }
    else if (kind === 2) { o.style = 'short'; o.collar = true; }
    else { o.style = r() < 0.5 ? 'lowbun' : 'bun'; o.saree = top; o.border = tops[(Math.floor(r() * 9) + 3) % 9]; o.blouse = o.border; o.sleeve = 'short'; }
    return o;
  };
  function look(who) { if (typeof who === 'object') return who; if (/^extra:/.test(who)) return CAST.extra(+who.slice(6) || 0); return CAST.WHO[who] || CAST.extra(0); }

  // expressions: brow (+ inner ends up = worried/sad, - inner down = cross/determined), lift (both brows up), eye, mouth
  var FACES = {
    neutral: { brow: 0, lift: 0, eye: 'dot', mouth: 'line' },
    smile: { brow: 0, lift: 0.3, eye: 'dot', mouth: 'smile' },
    grin: { brow: 0, lift: 0.6, eye: 'happy', mouth: 'open-smile' },
    worried: { brow: 1, lift: 0.4, eye: 'dot', mouth: 'wobble' },
    sad: { brow: 1, lift: 0, eye: 'down', mouth: 'frown' },
    tired: { brow: 0.4, lift: -0.3, eye: 'half', mouth: 'line' },
    surprised: { brow: 0, lift: 1.4, eye: 'wide', mouth: 'o' },
    determined: { brow: -1, lift: 0, eye: 'dot', mouth: 'tight' },
    focused: { brow: -0.5, lift: 0, eye: 'down', mouth: 'line' },
    talk: { brow: 0, lift: 0.4, eye: 'dot', mouth: 'talk' },
    cry: { brow: 1.2, lift: 0.3, eye: 'happy', mouth: 'open-smile', tears: true }
  };
  CAST.FACES = Object.keys(FACES);

  var PI = Math.PI;
  CAST.ARMS = {
    down: { armL: [0.08, 0.1], armR: [0.08, 0.1] },
    wave: { armL: [0.1, 0.15], armR: [2.6, 0.5] },
    hips: { armL: [-0.55, 1.3], armR: [0.55, -1.3] },
    phoneLook: { armL: [0.5, 1.5], armR: [0.6, 1.45] },
    carryBox: { armL: [0.9, 0.7], armR: [0.95, 0.6] },
    point: { armL: [0.1, 0.1], armR: [1.75, 0.05] },
    think: { armL: [0.6, 1.9], armR: [0.25, 2.5] },
    clap: { armL: [1.1, 1.0], armR: [1.15, 0.95] },
    write: { armL: [0.8, 1.2], armR: [1.0, 0.9] },
    hug: { armL: [1.5, 0.6], armR: [1.5, 0.6] },
    raise: { armL: [0.1, 0.1], armR: [3.0, 0.1] },
    headInHands: { armL: [1.3, 2.2], armR: [1.35, 2.15] }
  };

  CAST.draw = function (ctx, who, x, y, h, o) {
    var c = ctx || C.ctx; o = o || {}; var L = look(who), t = o.t || 0, s = h / 100, flip = o.flip ? -1 : 1;
    var sq = C.clamp(o.squash || 0, -0.35, 0.35), lift = o.lift || 0, hairLag = o.hairLag || 0, clothLag = o.clothLag || 0;
    var chest = o.pivot === 'chest'; if (chest) { sq *= 0.35; lift *= 0.5; }      // a close-up reads a much smaller squash
    var sxk = 1 + sq * 0.5, syk = 1 - sq;
    var pose = o.pose || 'stand', lean = o.lean || 0, tilt = o.tilt || 0, b = L.build || 1;
    var face = FACES[o.face || 'neutral'] || FACES.neutral, glow = o.glow == null ? 1 : o.glow;
    var walkPh = o.walk || 0, bob = pose === 'walk' ? -Math.abs(Math.sin(walkPh)) * 1.8 : 0;
    var breath = Math.sin(t * 2.1 + (L.skin.length)) * 0.55;
    var hipY = pose === 'sit' ? 0 : -44 + bob;            // unit space: feet at 0, head top ~ -100
    var armL = o.armL || CAST.ARMS.down.armL, armR = o.armR || CAST.ARMS.down.armR;
    var out = {};
    // unit -> world (with upper-body lean about the hip)
    function W(ux, uy, upper) {
      if (upper) { var dx = ux, dy = uy - hipY, cs = Math.cos(lean), sn = Math.sin(lean); ux = dx * cs - dy * sn; uy = hipY + dx * sn + dy * cs; }
      var pv = chest ? hipY - 28 : 0;
      return { x: x + flip * ux * s * sxk, y: y - lift + (pv + (uy - pv) * syk) * s };
    }
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    var pvy = chest ? hipY - 28 : 0;
    c.translate(x, y - lift); c.scale(flip * s, s); c.translate(0, pvy); c.scale(sxk, syk); c.translate(0, -pvy);
    c.lineJoin = 'round'; c.lineCap = 'round';
    function shadowOn() { c.shadowColor = 'rgba(40,25,10,0.22)'; c.shadowBlur = 8 / s; c.shadowOffsetY = 3 / s; c.shadowOffsetX = 1 / s; }
    function shadowOff() { c.shadowColor = 'transparent'; }
    function poly(pts, fill) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = fill; c.fill(); }
    function shade(col, f) { // darken a #rrggbb colour by f (0..1)
      var n = parseInt(col.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, bb = n & 255;
      return 'rgb(' + Math.round(r * (1 - f)) + ',' + Math.round(g * (1 - f)) + ',' + Math.round(bb * (1 - f)) + ')';
    }
    // floor shadow
    if (pose !== 'sit') { c.save(); c.fillStyle = 'rgba(40,25,10,0.16)'; c.beginPath(); c.ellipse(0, 1, 17 * b, 3.2, 0, 0, 2 * PI); c.fill(); c.restore(); }

    var shY = hipY - 28 * 1 + breath * 0.4, neckY = shY - 4;   // shoulder line and neck base (unit, before lean)
    var headX = 1.5, headY = neckY - 12;

    // ---- braid hangs behind everything
    if (L.style === 'braid') {
      c.save(); c.translate(0, hipY); c.rotate(lean); c.translate(0, -hipY); c.translate(headX, headY); c.rotate(tilt);
      c.fillStyle = L.hair; for (var bi = 0; bi < 5; bi++) { c.beginPath(); c.ellipse(-8 + bi * 0.3 + hairLag * (bi / 4) * 0.5, 6 + bi * 6.5 - Math.abs(hairLag) * (bi / 4) * 0.15, 3.6 - bi * 0.25, 4.2, 0.15 + hairLag * 0.02, 0, 2 * PI); c.fill(); }
      c.restore();
    }
    // ---- far arm (behind)
    var aL = arm(-11 * b, armL, true);
    // ---- legs / skirt
    shadowOn();
    if (pose === 'sit') legsSit(); else legsStand();
    // ---- upper body (leaned)
    c.save(); c.translate(0, hipY); c.rotate(lean); c.translate(0, -hipY);
    torso();
    head();
    c.restore();
    shadowOff();
    // ---- near arm (front)
    var aR = arm(11 * b, armR, false);
    c.restore();
    out.handL = W(aL.x, aL.y, true); out.handR = W(aR.x, aR.y, true);
    var hw = W(headX, headY, true); out.head = hw;
    // props in world space so they stay upright-ish
    if (o.holdL) prop(c, o.holdL, out.handL, flip, s, glow, t, true);
    if (o.holdR) prop(c, o.holdR, out.handR, flip, s, glow, t, false);
    return out;

    function legsStand() {
      var lc = L.legs || P.inkSoft;
      if (L.saree) {
        // saree skirt with front pleats and a border at the hem
        var hem = 0, wl = -12.5 * b, wr = 12.5 * b;
        c.fillStyle = L.saree; c.beginPath(); c.moveTo(wl, hipY - 2); c.bezierCurveTo(wl - 3, hipY + 18, -16 * b, hem - 6, -15.5 * b, hem); c.lineTo(15.5 * b, hem); c.bezierCurveTo(16 * b, hem - 6, wr + 3, hipY + 18, wr, hipY - 2); c.closePath(); c.fill();
        shadowOff();
        c.fillStyle = L.border; c.beginPath(); c.moveTo(-15.6 * b, hem - 3.2); c.lineTo(15.6 * b, hem - 3.2); c.lineTo(15.5 * b, hem); c.lineTo(-15.5 * b, hem); c.closePath(); c.fill();
        c.strokeStyle = shade(L.saree, 0.22); c.lineWidth = 0.9; for (var k = 0; k < 4; k++) { c.beginPath(); c.moveTo(2 + k * 1.6, hipY + 4); c.lineTo(1 + k * 2.6, hem - 3.5); c.stroke(); }
        feet(-6, 6, true);
        shadowOn();
        return;
      }
      if (pose === 'walk') {
        var a = Math.sin(walkPh) * 0.42;
        leg(-3.5, a, lc, shade(lc, 0.18)); leg(3.5, -a, lc, lc);
      } else {
        poly([[-10 * b, hipY], [-1, hipY], [-1.5, -3], [-8.5, -3]], shade(lc, 0.12));
        poly([[1, hipY], [10 * b, hipY], [8.5, -3], [1.5, -3]], lc);
        feet(-5, 5, false);
      }
      if (L.kurta) { // knee-length kurta over the legs
        c.fillStyle = L.top; c.beginPath(); c.moveTo(-12.5 * b, hipY - 4); c.quadraticCurveTo(-15 * b, hipY + 10, -15.5 * b, hipY + 22); c.lineTo(15.5 * b, hipY + 22); c.quadraticCurveTo(15 * b, hipY + 10, 12.5 * b, hipY - 4); c.closePath(); c.fill();
        shadowOff(); c.strokeStyle = shade(L.top, 0.25); c.lineWidth = 0.8; c.beginPath(); c.moveTo(-15.3 * b, hipY + 20.5); c.lineTo(15.3 * b, hipY + 20.5); c.stroke(); shadowOn();
      }
    }
    function leg(hx, ang, col, shoeCol) {
      var kx = hx + Math.sin(ang) * 21, ky = hipY + Math.cos(ang) * 21, bend = Math.max(0, -ang) * 0.9 + 0.1;
      var fx = kx + Math.sin(ang - bend) * 22, fy = ky + Math.cos(ang - bend) * 22;
      c.strokeStyle = col; c.lineWidth = 8.5 * b; c.beginPath(); c.moveTo(hx, hipY + 2); c.lineTo(kx, ky); c.lineTo(fx, Math.min(fy, -1.5)); c.stroke();
      c.fillStyle = L.shoes || P.ink; c.beginPath(); c.ellipse(fx + 2.5, Math.min(fy, -1.5) + 0.5, 5.2, 2.6, 0, 0, 2 * PI); c.fill();
    }
    function feet(xl, xr, sandal) {
      c.fillStyle = L.shoes || P.ink;
      c.beginPath(); c.ellipse(xl + 1.5, -1.2, sandal ? 4.2 : 5.4, 2.4, 0, 0, 2 * PI); c.fill();
      c.beginPath(); c.ellipse(xr + 2.2, -1.2, sandal ? 4.2 : 5.4, 2.4, 0, 0, 2 * PI); c.fill();
    }
    function legsSit() {
      var lc = L.saree || L.legs || P.inkSoft, knee = [19, -1.5], foot = [20.5, 25];
      // thighs + shins as one thick bent limb, far leg slightly darker
      c.strokeStyle = shade(lc, 0.14); c.lineWidth = 10.5 * b; c.beginPath(); c.moveTo(-3, -2); c.lineTo(knee[0] - 2, knee[1] - 1); c.lineTo(foot[0] - 3, foot[1] - 2); c.stroke();
      c.strokeStyle = lc; c.beginPath(); c.moveTo(2, 0); c.lineTo(knee[0] + 1, knee[1] + 1); c.lineTo(foot[0], foot[1]); c.stroke();
      if (L.saree) { shadowOff(); c.strokeStyle = L.border; c.lineWidth = 2.6; c.beginPath(); c.moveTo(foot[0] - 7, foot[1] - 1); c.lineTo(foot[0] + 5, foot[1] - 1); c.stroke(); shadowOn(); }
      if (L.kurta) { c.fillStyle = L.top; c.beginPath(); c.moveTo(-12, -6); c.lineTo(15, -6); c.quadraticCurveTo(20, -2, 17, 4); c.lineTo(-11, 4); c.closePath(); c.fill(); }
      c.fillStyle = L.shoes || P.ink; c.beginPath(); c.ellipse(foot[0] + 3, foot[1] + 1, 5.4, 2.5, 0, 0, 2 * PI); c.fill();
    }
    function torso() {
      var w = 13 * b, wa = 11 * b, top = L.top || L.blouse || P.teal;
      // body
      c.fillStyle = L.saree ? (L.blouse || L.border) : top;
      c.beginPath(); c.moveTo(-w, shY + 3); c.quadraticCurveTo(-w, shY - 1, -w + 4, shY - 1.5); c.lineTo(w - 4, shY - 1.5); c.quadraticCurveTo(w, shY - 1, w, shY + 3);
      c.lineTo(wa, hipY + 1); c.lineTo(-wa, hipY + 1); c.closePath(); c.fill();
      shadowOff();
      if (L.collar) { c.fillStyle = P.cream; poly([[-4, shY - 1.5], [0, shY + 4], [4, shY - 1.5], [2, shY - 1.5], [0, shY + 1.5], [-2, shY - 1.5]], P.cream); }
      if (L.over) { // open over-shirt: two side panels + a little check
        c.fillStyle = L.over; poly([[-w - 0.5, shY + 2], [-w + 5, shY - 1.6], [-3.5, shY + 1], [-5.5, hipY + 2], [-wa - 1, hipY + 2]], L.over);
        poly([[w + 0.5, shY + 2], [w - 5, shY - 1.6], [3.5, shY + 1], [5.5, hipY + 2], [wa + 1, hipY + 2]], L.over);
        c.strokeStyle = L.overCheck || shade(L.over, 0.25); c.lineWidth = 0.8;
        for (var k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-w + 1, shY + 5 + k * 6); c.lineTo(-5.5, shY + 5 + k * 6); c.moveTo(5.5, shY + 5 + k * 6); c.lineTo(w - 1, shY + 5 + k * 6); c.stroke(); }
      }
      if (L.saree) { // pallu: band from the right hip across to the left shoulder, falling behind
        c.fillStyle = L.saree;
        c.beginPath(); c.moveTo(wa + 0.5, hipY + 1); c.lineTo(wa - 7, hipY + 1); c.bezierCurveTo(-2, shY + 14, -8, shY + 4, -w + 1.5, shY - 1.5); c.lineTo(-w + 6, shY - 2); c.bezierCurveTo(0, shY + 2, 6, shY + 12, wa + 0.5, hipY - 6); c.closePath(); c.fill();
        c.fillStyle = L.border; c.beginPath(); c.moveTo(wa - 7, hipY + 1); c.lineTo(wa - 9.2, hipY + 1); c.bezierCurveTo(-4, shY + 14, -10, shY + 4, -w + 0.2, shY - 1); c.lineTo(-w + 1.5, shY - 1.5); c.bezierCurveTo(-8, shY + 4, -2, shY + 14, wa - 7, hipY + 1); c.closePath(); c.fill();
      }
      if (L.saree) { // the pallu's loose end falls behind the far shoulder and trails the body
        c.save(); c.globalCompositeOperation = 'destination-over'; c.fillStyle = shade(L.saree, 0.08);
        c.beginPath(); c.moveTo(-w + 1, shY - 1); c.quadraticCurveTo(-w - 4 + clothLag * 0.4, shY + 12, -w - 3 + clothLag, hipY + 4 - Math.abs(clothLag) * 0.3); c.lineTo(-w + 4 + clothLag * 0.8, hipY + 4); c.quadraticCurveTo(-w + 3, shY + 10, -w + 5, shY - 1); c.closePath(); c.fill(); c.restore();
      }
      if (L.dupatta) { // U-shaped dupatta over both shoulders
        c.strokeStyle = L.dupatta; c.lineWidth = 4.2; c.beginPath(); c.moveTo(-w + 2, shY - 0.5); c.quadraticCurveTo(0, shY + 16, w - 2, shY - 0.5); c.stroke();
        c.fillStyle = L.dupatta; poly([[w - 3.5, shY], [w + 1, shY + 1], [w - 0.5 + clothLag * 0.6, hipY - 2 - Math.abs(clothLag) * 0.2], [w - 4.5 + clothLag * 0.5, hipY - 3 - Math.abs(clothLag) * 0.2]], L.dupatta);
      }
      if (L.tape) { // tailor's measuring tape round the neck
        c.strokeStyle = '#f0d36a'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-3.5, shY - 1.5); c.lineTo(-4.5, shY + 14); c.moveTo(3.5, shY - 1.5); c.lineTo(5, shY + 12); c.stroke();
        c.strokeStyle = P.ink; c.lineWidth = 0.5; for (var m = 0; m < 6; m++) { c.beginPath(); c.moveTo(-5.2, shY + 1 + m * 2.2); c.lineTo(-3.8, shY + 1 + m * 2.2); c.stroke(); }
      }
      shadowOn();
    }
    function head() {
      c.save(); c.translate(headX, headY); c.rotate(tilt);
      // neck
      c.fillStyle = shade(L.skin, 0.12); c.fillRect(-3.4, 6, 6.4, 7);
      // ear (far side hidden; near-ish ear on the back of the head)
      c.fillStyle = L.skin; c.beginPath(); c.ellipse(-6.6, 1, 2.2, 3, 0, 0, 2 * PI); c.fill();
      // face
      c.beginPath(); c.ellipse(0, 0, 8.6, 10.2, 0, 0, 2 * PI); c.fill();
      shadowOff();
      // hair
      c.fillStyle = L.hair;
      if (L.style === 'messy') {
        c.beginPath(); c.moveTo(-9.6, 2); c.bezierCurveTo(-11, -10, -4, -14, 2, -12.6); c.bezierCurveTo(8, -12, 10.5, -7, 9.4, -3);
        c.lineTo(7.5, -6.5); c.lineTo(6, -4); c.lineTo(3.5, -7.2); c.lineTo(1.5, -4.6); c.lineTo(-1.5, -7.6); c.lineTo(-5, -3.5); c.lineTo(-6, 3); c.closePath(); c.fill();
        var tb = hairLag * 0.12; c.beginPath(); c.moveTo(-2, -12.5); c.lineTo(-0.5 + tb, -16 + Math.abs(tb)); c.lineTo(2.2, -12.4); c.moveTo(3, -12.6); c.lineTo(6.5 + tb, -15 + Math.abs(tb)); c.lineTo(6.8, -11); c.fill();
      } else if (L.style === 'short') {
        c.beginPath(); c.ellipse(-0.8, -4.5, 9.6, 7.4, -0.1, PI * 0.92, PI * 2.06); c.fill();
      } else {
        // centre-parted hair pulled back
        c.beginPath(); c.moveTo(-9.4, 3); c.bezierCurveTo(-11, -9, -4, -13.5, 2, -12.2); c.bezierCurveTo(7.5, -11.6, 9.8, -7, 9, -3.5); c.bezierCurveTo(6, -8.5, 3, -9, 1.6, -8.4); c.bezierCurveTo(-1, -6.5, -4, -4, -5.5, 3); c.closePath(); c.fill();
        if (L.grey) { c.strokeStyle = '#c9c1b6'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-6.5, -6); c.quadraticCurveTo(-2, -12, 3, -11.4); c.stroke(); }
        if (L.style === 'bun') { c.fillStyle = L.hair; c.beginPath(); c.arc(-9.2 + hairLag * 0.15, -6.5 - Math.abs(hairLag) * 0.08, 4.6, 0, 2 * PI); c.fill(); }
        if (L.style === 'lowbun') { c.fillStyle = L.hair; c.beginPath(); c.arc(-9.4 + hairLag * 0.15, 2.5, 4.3, 0, 2 * PI); c.fill(); }
        if (L.style === 'braid') { c.fillStyle = L.hair; c.beginPath(); c.arc(-8.8, 1, 3.4, 0, 2 * PI); c.fill(); }
      }
      // features — the face is turned 3/4 to the right
      var lx = (o.look ? o.look[0] : 0) * 0.9, ly = (o.look ? o.look[1] : 0) * 0.9 + (face.eye === 'down' ? 1 : 0);
      var blinking = o.shut || (o.blink !== false && ((t + L.skin.charCodeAt(2) * 0.11) % 3.9) < 0.11);
      var ex = [2.4, 7.2], ey = -0.6, browY = -4.6 - face.lift * 1.3;
      c.fillStyle = P.ink; c.strokeStyle = P.ink; c.lineWidth = 1.05;
      ex.forEach(function (xx, i) {
        // brows
        var bIn = browY - face.brow * 1.0, bOut = browY + face.brow * 0.35;
        c.beginPath(); c.moveTo(xx + (i === 0 ? -2 : 2), i === 0 ? bOut : bOut); c.lineTo(xx + (i === 0 ? 1.9 : -1.9), bIn); c.stroke();
        // eyes
        if (blinking) { c.beginPath(); c.moveTo(xx - 1.4, ey + 0.3); c.lineTo(xx + 1.4, ey + 0.3); c.stroke(); return; }
        if (face.eye === 'happy') { c.beginPath(); c.arc(xx, ey + 0.8, 1.5, PI * 1.1, PI * 1.9); c.stroke(); return; }
        if (face.eye === 'half') { c.beginPath(); c.arc(xx + lx * 0.5, ey + 0.2, 1.25, 0, PI); c.fill(); c.beginPath(); c.moveTo(xx - 1.6, ey - 0.1); c.lineTo(xx + 1.6, ey - 0.1); c.stroke(); return; }
        if (face.eye === 'wide') { c.fillStyle = '#fbf5e8'; c.beginPath(); c.ellipse(xx, ey, 1.9, 2.2, 0, 0, 2 * PI); c.fill(); c.fillStyle = P.ink; }
        c.beginPath(); c.ellipse(xx + lx, ey + ly * 0.6, 1.15, 1.35, 0, 0, 2 * PI); c.fill();
      });
      if (face.tears) { c.fillStyle = 'rgba(143,216,255,0.9)'; c.beginPath(); c.ellipse(2, 3.4 + (t * 3 % 3), 0.9, 1.3, 0, 0, 2 * PI); c.fill(); c.beginPath(); c.ellipse(8, 3.9 + ((t * 3 + 1.4) % 3), 0.9, 1.3, 0, 0, 2 * PI); c.fill(); }
      // nose
      c.strokeStyle = shade(L.skin, 0.35); c.lineWidth = 0.9; c.beginPath(); c.moveTo(8.6, 0.4); c.quadraticCurveTo(10.4, 3, 8.4, 3.8); c.stroke();
      // mouth
      c.strokeStyle = '#5a2a22'; c.fillStyle = '#5a2a22'; c.lineWidth = 1.05; var mx = 5.4, my = 6.4;
      var talkOpen = face.mouth === 'talk' ? Math.max(0, Math.sin(t * 13)) * 1.4 + Math.max(0, Math.sin(t * 7.1)) * 0.6 : 0;
      if (face.mouth === 'smile') { c.beginPath(); c.arc(mx, my - 2, 2.8, PI * 0.2, PI * 0.8); c.stroke(); }
      else if (face.mouth === 'open-smile') { c.beginPath(); c.moveTo(mx - 2.8, my - 0.6); c.quadraticCurveTo(mx, my + 3.6, mx + 2.8, my - 0.6); c.closePath(); c.fill(); }
      else if (face.mouth === 'frown') { c.beginPath(); c.arc(mx, my + 2.2, 2.4, PI * 1.2, PI * 1.8); c.stroke(); }
      else if (face.mouth === 'o') { c.beginPath(); c.ellipse(mx, my, 1.4, 1.9, 0, 0, 2 * PI); c.fill(); }
      else if (face.mouth === 'wobble') { c.beginPath(); c.moveTo(mx - 2.2, my + 0.3); c.quadraticCurveTo(mx - 1, my - 0.8, mx, my + 0.2); c.quadraticCurveTo(mx + 1, my + 1, mx + 2.2, my); c.stroke(); }
      else if (face.mouth === 'tight') { c.beginPath(); c.moveTo(mx - 2.2, my); c.lineTo(mx + 2.2, my - 0.2); c.stroke(); }
      else if (face.mouth === 'talk') { c.beginPath(); c.ellipse(mx, my, 2, 0.5 + talkOpen, 0, 0, 2 * PI); c.fill(); }
      else { c.beginPath(); c.moveTo(mx - 1.9, my); c.lineTo(mx + 1.9, my); c.stroke(); }
      if (L.bindi) { c.fillStyle = '#c0292b'; c.beginPath(); c.arc(4.8, -6.4, 0.9, 0, 2 * PI); c.fill(); }
      if (L.glasses) { c.strokeStyle = P.ink; c.lineWidth = 0.9; c.beginPath(); c.arc(ex[0], ey, 2.9, 0, 2 * PI); c.moveTo(ex[1] + 2.9, ey); c.arc(ex[1], ey, 2.9, 0, 2 * PI); c.moveTo(ex[0] + 2.9, ey - 0.3); c.lineTo(ex[1] - 2.9, ey - 0.3); c.moveTo(ex[0] - 2.9, ey - 0.4); c.lineTo(-5.5, -1.5); c.stroke(); }
      c.restore();
    }
    function arm(sx, a, far) {
      var len1 = 15.5, len2 = 14.5, sy = shY + 1.5;
      var s1 = a[0], s2 = a[0] + a[1];
      var exx = sx + Math.sin(s1) * len1, eyy = sy + Math.cos(s1) * len1, hx = exx + Math.sin(s2) * len2, hy = eyy + Math.cos(s2) * len2;
      c.save(); c.translate(0, hipY); c.rotate(lean); c.translate(0, -hipY);
      var sleeveCol = L.over || (L.saree ? (L.blouse || L.border) : L.top) || P.teal;
      if (far) sleeveCol = shade(sleeveCol.charAt(0) === '#' ? sleeveCol : '#888888', 0.15);
      var skin = far ? shade(L.skin, 0.1) : L.skin;
      c.lineCap = 'round'; c.lineJoin = 'round';
      // upper arm: sleeve
      var upperSleeve = L.sleeve === 'short' ? 0.55 : 1, foreSleeve = L.sleeve === 'long' ? 0.85 : L.sleeve === 'elbow' ? 0.15 : 0;
      c.strokeStyle = skin; c.lineWidth = 5.6; c.beginPath(); c.moveTo(sx, sy); c.lineTo(exx, eyy); c.lineTo(hx, hy); c.stroke();
      c.strokeStyle = sleeveCol; c.lineWidth = 6.8; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (exx - sx) * upperSleeve, sy + (eyy - sy) * upperSleeve); c.stroke();
      if (foreSleeve > 0) { c.beginPath(); c.moveTo(exx, eyy); c.lineTo(exx + (hx - exx) * foreSleeve, eyy + (hy - eyy) * foreSleeve); c.stroke(); c.beginPath(); c.moveTo(sx, sy); c.lineTo(exx, eyy); c.stroke(); }
      c.fillStyle = skin; c.beginPath(); c.arc(hx, hy, 3.3, 0, 2 * PI); c.fill();
      if (L.watch && !far) { c.strokeStyle = '#d8c27a'; c.lineWidth = 2.2; var wf = 0.82; c.beginPath(); c.moveTo(exx + (hx - exx) * wf - 1.5, eyy + (hy - eyy) * wf); c.lineTo(exx + (hx - exx) * wf + 1.5, eyy + (hy - eyy) * wf); c.stroke(); }
      c.restore();
      return { x: hx, y: hy };
    }
  };

  // ---- acting: four-beat takes (anticipation → pop → settle) and the double take, as draw options ----
  // t0 = when the take starts; the pop lands ~0.3 s later (put t0 one beat before the beat you want it on).
  var TAKES = {
    surprise: { at: [0.06, 0.2, 0.3, 0.62], antic: 'neutral', pop: 'surprised', settle: 'surprised', sq: [0.14, -0.2, -0.03], lift: [0, 16, 0], tilt: [0, -0.04, -0.02] },
    joy: { at: [0.05, 0.2, 0.3, 0.7], antic: 'smile', pop: 'grin', settle: 'grin', sq: [0.12, -0.22, -0.04], lift: [0, 22, 2], tilt: [0, 0.05, 0.03] },
    laugh: { at: [0.05, 0.18, 0.26, 0.6], antic: 'smile', pop: 'grin', settle: 'grin', sq: [0.1, -0.16, 0.02], lift: [0, 10, 0], tilt: [0, 0.08, 0.04] },
    sag: { at: [0.05, 0.25, 0.4, 0.95], antic: 'worried', pop: 'sad', settle: 'sad', sq: [-0.06, 0.14, 0.07], lift: [3, -2, 0], tilt: [0, 0.07, 0.05], lean: [0, 0.08, 0.06] },
    resolve: { at: [0.05, 0.22, 0.32, 0.7], antic: 'focused', pop: 'determined', settle: 'determined', sq: [0.08, -0.12, -0.04], lift: [0, 6, 0], tilt: [0.03, -0.03, -0.01] },
    worry: { at: [0.05, 0.2, 0.32, 0.8], antic: 'neutral', pop: 'worried', settle: 'worried', sq: [0.06, -0.06, 0.03], lift: [0, 4, 0], tilt: [0, 0.05, 0.04], look: [0, -0.6, -0.4] },
    realize: { at: [0.05, 0.2, 0.3, 0.75], antic: 'focused', pop: 'surprised', settle: 'smile', sq: [0.1, -0.16, -0.02], lift: [0, 12, 0], tilt: [0, -0.05, 0] }
  };
  CAST.take = function (kind, lt, t0) {
    var K = TAKES[kind] || TAKES.surprise, u = lt - (t0 || 0), a = K.at, B = C.beats(u, a[0], a[1], a[2], a[3]);
    if (u < 0) return {};
    var face = B.P <= 0 ? K.antic : (B.S < 0.5 ? K.pop : K.settle), out = { face: face, shut: B.shut, squash: B.mix(K.sq[0], K.sq[1], K.sq[2]), lift: B.mix(K.lift[0], K.lift[1], K.lift[2]), tilt: B.mix(K.tilt[0], K.tilt[1], K.tilt[2]) };
    if (K.lean) out.lean = B.mix(K.lean[0], K.lean[1], K.lean[2]);
    if (K.look) out.look = [B.mix(K.look[0], K.look[1], K.look[2]), 0];
    return out;
  };
  CAST.withTake = function (o, kind, lt, t0) {
    var p = CAST.take(kind, lt, t0), r = Object.assign({}, o, p);
    var sqF = function (u) { return CAST.take(kind, u, t0).squash || 0; }, lfF = function (u) { return CAST.take(kind, u, t0).lift || 0; };
    r.hairLag = (o.hairLag || 0) + C.lag(sqF, lt, 60) - C.lag(lfF, lt, 0.5);
    r.clothLag = (o.clothLag || 0) + C.lag(sqF, lt, 45) - C.lag(lfF, lt, 0.4);
    if (p.tilt != null && o.tilt) r.tilt = o.tilt + p.tilt;
    return r;
  };
  // double take (Brian Lemay): glance away, glance back, dip with eyes shut, POP into surprise, settle
  CAST.doubleTake = function (o, lt, t0, awayLook) {
    var u = lt - (t0 || 0), b = o.look || [0.1, 0.2], away = awayLook == null ? -0.85 : awayLook, r = Object.assign({}, o);
    function f(v) {
      if (v < 0) return { look: b, squash: 0, lift: 0 };
      if (v < 0.15) { var e = C.ease(v / 0.15); return { look: [C.lerp(b[0], away, e), C.lerp(b[1], 0, e)], squash: 0, lift: 0 }; }
      if (v < 0.3) { var e2 = C.ease((v - 0.15) / 0.15); return { look: [C.lerp(away, b[0], e2), C.lerp(0, b[1], e2)], squash: 0, lift: 0 }; }
      if (v < 0.45) { var e3 = C.ease((v - 0.3) / 0.15); return { look: b, squash: 0.16 * e3, shut: e3 > 0.5, lift: 0, face: 'worried' }; }
      if (v < 0.49) { var pp = (v - 0.45) / 0.04; return { look: [C.lerp(b[0], -0.3, pp), C.lerp(b[1], -0.7, pp)], squash: C.lerp(0.16, -0.2, pp), lift: 18 * pp, face: 'surprised' }; }
      var s2 = C.ease(C.prog(v, 0.49, 0.82)); return { look: [-0.3, -0.7], squash: C.lerp(-0.2, -0.03, s2), lift: C.lerp(18, 0, s2), face: 'surprised' };
    }
    var p = f(u); Object.assign(r, p); if (u < 0.3) r.face = o.face;
    r.hairLag = C.lag(function (v) { return f(v).squash; }, u, 60) - C.lag(function (v) { return f(v).lift; }, u, 0.5);
    r.clothLag = r.hairLag * 0.8;
    return r;
  };

  // props, drawn in world space at a hand position
  function prop(c, kind, hp, flip, s, glow, t, far) {
    c.save(); c.translate(hp.x, hp.y); c.scale(s, s); c.lineJoin = 'round';
    var f = flip;
    c.shadowColor = 'rgba(40,25,10,0.22)'; c.shadowBlur = 6 / s; c.shadowOffsetY = 2 / s;
    if (kind === 'phone' || kind === 'tablet') {
      var w = kind === 'phone' ? 6.5 : 15, h = kind === 'phone' ? 11.5 : 11;
      c.fillStyle = '#1f1b18'; c.beginPath(); if (c.roundRect) c.roundRect(-w / 2 + f * 2, -h + 2, w, h, 1.4); else c.rect(-w / 2 + f * 2, -h + 2, w, h); c.fill();
      c.shadowColor = 'transparent';
      if (glow > 0) {
        c.fillStyle = 'rgba(150,215,255,' + (0.85 * glow) + ')'; c.fillRect(-w / 2 + f * 2 + 0.8, -h + 2.8, w - 1.6, h - 1.6);
        var g = c.createRadialGradient(f * 2, -h / 2 + 2, 0, f * 2, -h / 2 + 2, 26); g.addColorStop(0, 'rgba(143,216,255,' + (0.28 * glow) + ')'); g.addColorStop(1, 'rgba(143,216,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(f * 2, -h / 2 + 2, 26, 0, 2 * Math.PI); c.fill();
      }
    } else if (kind === 'box') {
      c.fillStyle = '#b98a57'; c.fillRect(-15 + f * 4, -16, 30, 20); c.shadowColor = 'transparent';
      c.fillStyle = '#a07443'; c.fillRect(-15 + f * 4, -16, 30, 4);
      c.fillStyle = '#7fb7c9'; c.fillRect(-9 + f * 4, -22, 4, 8);                  // a beaker
      c.fillStyle = '#e9e1cf'; c.fillRect(-2 + f * 4, -25, 9, 11); c.fillStyle = '#c98b4a'; c.fillRect(-0.8 + f * 4, -23.6, 6.6, 8); // a framed batch photo
      c.fillStyle = '#2f7f7a'; c.fillRect(8 + f * 4, -21, 4.5, 7);                // a register
    } else if (kind === 'chalk') { c.fillStyle = '#fbf5e8'; c.fillRect(-1, -4.5, 2.2, 5); }
    else if (kind === 'cup') { // cutting chai glass
      c.fillStyle = 'rgba(230,240,240,0.75)'; c.beginPath(); c.moveTo(-2.6, -7); c.lineTo(2.6, -7); c.lineTo(2, 0); c.lineTo(-2, 0); c.closePath(); c.fill();
      c.shadowColor = 'transparent'; c.fillStyle = '#b5773d'; c.beginPath(); c.moveTo(-2.4, -5); c.lineTo(2.4, -5); c.lineTo(2, -0.4); c.lineTo(-2, -0.4); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 0.6; var st = (t * 0.8) % 1; c.beginPath(); c.moveTo(0, -8 - st * 6); c.quadraticCurveTo(2, -11 - st * 6, 0, -14 - st * 6); c.stroke();
    } else if (kind === 'book') { c.fillStyle = '#2f7f7a'; c.fillRect(-6, -9, 12, 9); c.shadowColor = 'transparent'; c.fillStyle = '#fbf5e8'; c.fillRect(-5.2, -8.4, 10.4, 1.4); }
    else if (kind === 'letter') { c.fillStyle = '#fbf5e8'; c.save(); c.rotate(-0.12 * f); c.fillRect(-5, -14, 10, 13); c.shadowColor = 'transparent'; c.fillStyle = '#9b8f7f'; for (var i = 0; i < 5; i++) c.fillRect(-3.8, -12 + i * 2.2, 7.6 - (i === 4 ? 3 : 0), 0.7); c.restore(); }
    else if (kind === 'pen') { c.strokeStyle = '#1f6fd1'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(3 * f, -6); c.stroke(); }
    else if (kind === 'sweets') { // box of pedhas
      c.fillStyle = '#f4ead7'; c.fillRect(-9, -7, 18, 7); c.shadowColor = 'transparent'; c.fillStyle = '#e0863e'; c.fillRect(-9, -7, 18, 1.6);
      c.fillStyle = '#e8c48a'; for (var k = 0; k < 4; k++) { c.beginPath(); c.arc(-6 + k * 4, -3.4, 1.6, 0, 2 * Math.PI); c.fill(); }
    } else if (kind === 'bag') { c.fillStyle = '#3a4f6a'; c.beginPath(); if (c.roundRect) c.roundRect(-6, -1, 12, 14, 2); else c.rect(-6, -1, 12, 14); c.fill(); c.strokeStyle = '#3a4f6a'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, -1, 4, Math.PI, 0); c.stroke(); }
    c.restore();
  }

  root.CAST = CAST;
})(typeof window !== 'undefined' ? window : globalThis);
