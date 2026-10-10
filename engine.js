/* Kal engine — pure functions, no DOM. Works in Node (require) and the browser (window.Kal). */
(function (root) {
  'use strict';
  var CO = null;
  var YEARS = []; for (var y = 2026; y <= 2036; y++) YEARS.push(y);
  var ROADS = ['build-retrain', 'build-cut', 'ban-retrain', 'ban-cut'];
  var MEAS = ['students', 'teachers', 'results', 'affordability'];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(seed, k) {
    var h = 2166136261 ^ seed;
    h = Math.imul(h ^ (k + 0x9e3779b9), 16777619);
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return h >>> 0;
  }
  function normal(r) { // Box-Muller: always draws exactly two uniforms
    var u = r() || 1e-9, v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function clamp(v) { return Math.max(0, Math.min(100, v)); }
  function parse(roadId) { var p = roadId.split('-'); return { c1: p[0], c2: p[1] }; }
  function opt(dec, id) { for (var i = 0; i < dec.options.length; i++) if (dec.options[i].id === id) return dec.options[i]; }

  function init(company) { CO = company; return api; }

  function display(m) {
    var M = CO.measures, a = M.affordability.fee;
    return {
      students: Math.round(m.students * M.students.scale),
      teachers: Math.round(m.teachers * M.teachers.scale),
      results: Math.round(m.results),
      fees: Math.round((a.base - m.affordability * a.perPoint) / 500) * 500
    };
  }

  // One future k on a road. Draw order per year is fixed: 4 normals, then one uniform per luck event.
  function future(roadId, k, seed) {
    var ch = parse(roadId), d1 = CO.decisions[0], d2 = CO.decisions[1];
    var o1 = opt(d1, ch.c1), o2 = opt(d2, ch.c2);
    var r = mulberry32(hash(seed == null ? CO.seed : seed, k));
    var m = {}; MEAS.forEach(function (q) { m[q] = CO.measures[q].start; });
    var years = {}, luck = [];
    YEARS.forEach(function (year) {
      var noise = MEAS.map(function () { return normal(r); });
      var rolls = CO.luck.map(function () { return r(); });
      MEAS.forEach(function (q, i) {
        var lean = 0;
        if (year >= d1.year) lean += (o1.leans[q] || 0);
        if (year >= d2.year) lean += (o2.leans[q] || 0);
        m[q] += lean + noise[i] * 4;
      });
      CO.luck.forEach(function (L, i) {
        if (L.year !== year) return;
        var p = L.p * ((L.boostedBy && (L.boostedBy === ch.c1 || L.boostedBy === ch.c2)) ? 1.8 : 1);
        var hit = rolls[i] < p;
        luck.push({ id: L.id, year: L.year, sign: L.sign, headline: L.headline, hit: hit });
        if (hit) for (var q in L.effects) m[q] += L.effects[q];
      });
      MEAS.forEach(function (q) { m[q] = clamp(m[q]); });
      years[year] = display(m);
      years[year].raw = { students: m.students, teachers: m.teachers, results: m.results, affordability: m.affordability };
    });
    return { k: k, road: roadId, years: years, luck: luck, ending: endingOf(m).id, final: Object.assign({}, m) };
  }

  function endingOf(m) {
    for (var i = 0; i < CO.endings.length; i++) {
      var e = CO.endings[i], ok = true;
      for (var q in e.when) if (m[q] < e.when[q][0] || m[q] > e.when[q][1]) ok = false;
      if (ok) return e;
    }
    return CO.endings[CO.endings.length - 1];
  }

  function simulate(roadId, seed, n) {
    var out = []; for (var k = 0; k < (n || 10); k++) out.push(future(roadId, k, seed));
    return out;
  }

  function counts(futs) { var c = {}; CO.endings.forEach(function (e) { c[e.id] = 0; }); futs.forEach(function (f) { c[f.ending]++; }); return c; }
  function mode(c) { var best = null; for (var id in c) if (best === null || c[id] > c[best]) best = id; return best; }

  var cache = {};
  function road(roadId) {
    if (cache[roadId]) return cache[roadId];
    var ch = parse(roadId), futs = simulate(roadId), c = counts(futs), end = mode(c);
    // lit future: the one with the road's most common ending, closest to that group's mean students
    var grp = futs.filter(function (f) { return f.ending === end; });
    var mean = grp.reduce(function (s, f) { return s + f.final.students; }, 0) / grp.length;
    var lit = grp.slice().sort(function (a, b) { return Math.abs(a.final.students - mean) - Math.abs(b.final.students - mean); })[0];
    // display counters: 2026 = start; 2027 = mean of the 10 futures after the 2026 step (depends only on c1,
    // so both roads that share a first choice meet at the same frame); 2028..2036 = the lit future.
    var start = {}; MEAS.forEach(function (q) { start[q] = CO.measures[q].start; });
    var c1m = {}; MEAS.forEach(function (q) { c1m[q] = futs.reduce(function (s, f) { return s + f.years[2026].raw[q]; }, 0) / futs.length; });
    var counters = { 2026: display(start), 2027: display(c1m) };
    for (var y = 2028; y <= 2036; y++) counters[y] = { students: lit.years[y].students, teachers: lit.years[y].teachers, results: lit.years[y].results, fees: lit.years[y].fees };
    var e = CO.endings.filter(function (x) { return x.id === end; })[0];
    var r = {
      id: roadId, c1: ch.c1, c2: ch.c2,
      futures: futs, endings: c, ending: end, endingInfo: e,
      litFuture: lit.k, lit: lit, luck: lit.luck, counters: counters,
      stamp: '≈ ' + lit.years[2036].students.toLocaleString('en-IN') + ' STUDENTS · ' + c[end] + ' OF 10 FUTURES'
    };
    cache[roadId] = r; return r;
  }

  // Interpolated counters for a fractional year (e.g. 2027.4)
  function at(r, yf) {
    var y0 = Math.max(2026, Math.min(2036, Math.floor(yf))), y1 = Math.min(2036, y0 + 1), f = Math.max(0, Math.min(1, yf - y0));
    var a = r.counters[y0], b = r.counters[y1], o = {};
    for (var q in a) o[q] = a[q] + (b[q] - a[q]) * f;
    return o;
  }

  // Compare two roads under the same luck: future k of a vs future k of b (k = a's lit future), plus 10-future means.
  function compare(aId, bId) {
    var a = road(aId), b = road(bId), k = a.litFuture;
    var fa = a.futures[k].years[2036], fb = b.futures[k].years[2036];
    function mean(r, q) { return r.futures.reduce(function (s, f) { return s + f.years[2036][q]; }, 0) / r.futures.length; }
    var d = {}; ['students', 'teachers', 'results', 'fees'].forEach(function (q) { d[q] = fb[q] - fa[q]; });
    var dm = {}; ['students', 'teachers', 'results', 'fees'].forEach(function (q) { dm[q] = Math.round(mean(b, q) - mean(a, q)); });
    return { a: aId, b: bId, k: k, same: { a: fa, b: fb, delta: d }, mean: dm, endingA: a.futures[k].ending, endingB: b.futures[k].ending };
  }

  var api = { init: init, ROADS: ROADS, YEARS: YEARS, simulate: simulate, road: road, compare: compare, at: at,
    future: future, counts: counts, mode: mode, endingOf: endingOf, company: function () { return CO; }, _clear: function () { cache = {}; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Kal = api;
})(this);
