/* chapters.js — stitches the classroom clips and the PLACES scenes into the clips the player plays.
   home-<c1>    (after c1-<c1>, before the second vote)  classroom ▸tear▸ Aarav's room at night ▸cut▸ classroom
   c2-<road>    (after the second vote)                  2027 classroom ▸cut▸ staff room ▸tear▸ 2028 shop ▸push▸ 2029 street ▸cut▸ 2030 results
   mid-<road>   (before end-<road>)                      2032 Meera ▸cut▸ 2034 Sunanda's office (a hard cut from results opens it)
   Transitions (animotion film grammar): 'cut' on the beat for a change of place or time (default), 'push' a
   velocity-matched push-through (outgoing accelerates into blur, incoming decelerates out of it), 'tear' only at
   chapter breaks (classroom ↔ the world outside). Every boundary sits on the 96 bpm beat grid.
   A place must draw for local t in [−0.7, dur + 0.7] (the tear overlaps both sides). Pure: a function of (t, road). */
(function (root) {
  'use strict';
  var P = C.PALETTE, TR = 0.7, PUSH_OUT = 0.26, PUSH_IN = 0.32;
  var CLIPS = root.CLIPS = root.CLIPS || {}, PLACES = root.PLACES = root.PLACES || {};

  // until a helper's file defines a place, show a labelled stand-in (so the whole flow plays end to end)
  var STUB = { bedroom: [8.75, 2027, '#2b3550'], shop: [6.25, 2028, '#b84a62'], street: [6.25, 2029, '#6fb0d8'], results: [6.25, 2030, '#e8e2d2'],
    staffroom: [6.25, 2027, '#9fb3a2'], meera32: [6.25, 2032, '#c98b4a'], office: [6.25, 2034, '#1d3a4a'] };
  function placeOf(name) {
    if (PLACES[name]) return PLACES[name];
    var d = STUB[name] || [6.25, 2030, P.paperDark];
    return { dur: d[0], year: d[1], stub: true, draw: function (ctx, t) {
      C.use(ctx); ctx.fillStyle = d[2]; ctx.fillRect(0, 0, 1920, 1080);
      C.rect(560, 380, 800, 260, P.paper, 5, { halftone: 0.3 });
      C.label(name + ' · ' + d[1], 960, 470, 64, P.ink, 'center', 800);
      C.label('scene in progress', 960, 560, 30, P.inkSoft, 'center', 600);
      ctx.fillStyle = P.saffron; ctx.fillRect(560, 650, 800 * C.clamp(t / d[0]), 8);
    } };
  }
  function yearOf(k, lt) { return typeof k.year === 'function' ? k.year(lt) : (k.year || 2027); }
  // a scene's length snapped to the beat grid (helpers' scenes may be a few frames off)
  function beatDur(d) { return Math.round(d / C.BEAT) * C.BEAT; }

  // segs: [{ clip: id | place: name, dur, t0, tr: transition INTO this seg }] back to back. Returns a CLIPS entry.
  function sequence(segs) {
    var at = 0;
    segs = segs.map(function (g, i) { var s = Object.assign({ t0: 0, tr: i ? 'cut' : null }, g, { start: at }); at += g.dur; return s; });
    var total = at;
    function src(g) { return g.place ? placeOf(g.place) : CLIPS[g.clip]; }
    function drawSeg(ctx, g, t, road) {
      var k = src(g), lt = t - g.start + g.t0;
      if (!k) return;
      if (g.clip) lt = C.clamp(lt, 0, k.dur);           // classroom clips stay inside their own time range
      ctx.save(); C.use(ctx); k.draw(ctx, lt, road); ctx.restore(); C.use(ctx);
    }
    function find(t) { for (var i = segs.length - 1; i >= 0; i--) if (t >= segs[i].start) return i; return 0; }
    return {
      dur: total, segs: segs,
      year: function (t) { var g = segs[find(t)]; return yearOf(src(g) || {}, t - g.start + g.t0); },
      hud: function (t) { var g = segs[find(t)]; return g.place ? 'year' : 'full'; },
      events: function (road) {
        var ev = [];
        segs.forEach(function (g, i) {
          var k = src(g); if (i && g.tr === 'tear') ev.push([g.start - 0.2, 'rip']); else if (i && g.tr === 'push') ev.push([g.start - 0.18, 'whoosh']); else if (i) ev.push([g.start, 'swish']);
          var list = []; try { list = k && k.events ? (typeof k.events === 'function' ? k.events(road) : k.events) : []; } catch (e) { console.error(e); }
          (list || []).forEach(function (e) { var tt = g.start + e[0] - g.t0; if (e[0] >= g.t0 - 0.01 && e[0] < g.t0 + g.dur) ev.push([tt, e[1], e[2]].filter(function (x) { return x !== undefined; })); });
        });
        return ev;
      },
      draw: function (ctx, t, road) {
        var i = find(t), g = segs[i], nb = segs[i + 1], pb = segs[i - 1];
        // torn-paper wipe straddles the boundary
        if (nb && nb.tr === 'tear' && t > nb.start - TR / 2) return tear(ctx, (t - (nb.start - TR / 2)) / TR, function () { drawSeg(ctx, g, t, road); }, function () { drawSeg(ctx, nb, t, road); }, i);
        if (pb && g.tr === 'tear' && t < g.start + TR / 2) return tear(ctx, (t - (g.start - TR / 2)) / TR, function () { drawSeg(ctx, pb, t, road); }, function () { drawSeg(ctx, g, t, road); }, i - 1);
        // push-through: velocity peaks at the cut
        var zk = 1, bl = 0;
        if (nb && nb.tr === 'push' && nb.start - t < PUSH_OUT) { var u = 1 - (nb.start - t) / PUSH_OUT; zk = 1 + 0.24 * u * u; bl = 14 * u * u; }
        if (g.tr === 'push' && t - g.start < PUSH_IN) { var v = C.easeOut((t - g.start) / PUSH_IN); zk = C.lerp(1.22, 1, v); bl = 14 * (1 - v); }
        if (zk !== 1 || bl > 0.5) return C.pushFx(zk, bl, function () { drawSeg(C.ctx, g, t, road); });   // C.ctx is the push layer here
        drawSeg(ctx, g, t, road);
      }
    };
  }

  // torn-paper wipe: the outgoing scene is a sheet torn away right-to-left along a ragged diagonal edge
  function tear(ctx, p, drawA, drawB, seed) {
    p = C.clamp(p);
    if (p <= 0) return drawA(); if (p >= 1) return drawB();
    var e = C.ease(p), x0 = C.lerp(2160, -420, e), slant = 260, r = C.rand(300 + seed), pts = [], n = 30;
    for (var k = 0; k <= n; k++) { var f = k / n, y = -40 + f * 1160; pts.push([x0 + slant * (0.5 - f) + (r() - 0.5) * 26 + Math.sin(f * 17 + seed) * 8, y]); }
    drawB();
    ctx.save(); ctx.beginPath(); ctx.moveTo(-60, -60); pts.forEach(function (q) { ctx.lineTo(q[0] + 26, q[1]); }); ctx.lineTo(-60, 1140); ctx.closePath();
    ctx.fillStyle = 'rgba(31,27,24,0.22)'; ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.moveTo(-60, -60); pts.forEach(function (q) { ctx.lineTo(q[0], q[1]); }); ctx.lineTo(-60, 1140); ctx.closePath(); ctx.clip();
    drawA(); ctx.restore(); C.use(ctx);
    ctx.save(); ctx.beginPath(); pts.forEach(function (q, k) { if (k === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); });
    for (var j = pts.length - 1; j >= 0; j--) ctx.lineTo(pts[j][0] - 12 - (j % 3) * 5, pts[j][1]);
    ctx.closePath(); ctx.fillStyle = P.paper; ctx.shadowColor = 'rgba(31,27,24,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.fill(); ctx.restore();
  }
  C.tearWipe = tear;

  var ROADS = ['build-retrain', 'build-cut', 'ban-retrain', 'ban-cut'], BEAT2 = 2 * C.BEAT;
  function pd(name) { return beatDur(placeOf(name).dur); }
  // home: wait-2 is the REST-2027 loop (4 s, seamless); 0 → 1.25 s and 2.75 → 4 s of it start and end on its join frame
  ['ban', 'build'].forEach(function (c1) {
    CLIPS['home-' + c1] = sequence([{ clip: 'wait-2', dur: BEAT2, t0: 0 }, { place: 'bedroom', dur: pd('bedroom'), tr: 'tear' }, { clip: 'wait-2', dur: BEAT2, t0: 4 - BEAT2, tr: 'cut' }]);
  });
  ROADS.forEach(function (r) {
    CLIPS['c2-' + r] = sequence([{ clip: 'class27-' + r, dur: CLIPS['class27-' + r] ? CLIPS['class27-' + r].dur : 7.5 }, { place: 'staffroom', dur: pd('staffroom'), tr: 'cut' },
      { place: 'shop', dur: pd('shop'), tr: 'tear' }, { place: 'street', dur: pd('street'), tr: 'push' }, { place: 'results', dur: pd('results'), tr: 'cut' }]);
    CLIPS['mid-' + r] = sequence([{ place: 'meera32', dur: pd('meera32') }, { place: 'office', dur: pd('office'), tr: 'cut' }]);
  });
  root.CHAPTERS = { sequence: sequence, TR: TR, placeOf: placeOf };
})(typeof window !== 'undefined' ? window : globalThis);
