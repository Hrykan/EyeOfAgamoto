/* Agamoto engine — pure functions, no DOM. Works in Node (require) and the browser (window.Agamoto). */
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
  function nFutures() { return (CO && CO.futures) || 10; }
  // A road spec: the two options in play. Standard roads come from company.json; a custom road carries its own
  // second option (designed by Claude) and says which luck boosts it earns.
  function specOf(r) {
    if (r && typeof r === 'object') return r;
    var ch = parse(r);
    return { id: r, c1: ch.c1, c2: ch.c2, o1: opt(CO.decisions[0], ch.c1), o2: opt(CO.decisions[1], ch.c2), boosts: [ch.c1, ch.c2] };
  }
  function customSpec(c1, design) {
    return { id: c1 + '-custom', c1: c1, c2: 'custom', custom: design, o1: opt(CO.decisions[0], c1),
      o2: { id: 'custom', label: design.label, consequence: design.consequence, leans: design.leans },
      boosts: [c1].concat(design.buildsTrust ? ['retrain'] : []) };
  }
  function opt(dec, id) { for (var i = 0; i < dec.options.length; i++) if (dec.options[i].id === id) return dec.options[i]; }

  function init(company) { CO = company; cache = {}; return api; }

  function display(m) {
    var M = CO.measures, a = M.affordability.fee;
    return {
      students: Math.round(m.students * M.students.scale),
      teachers: Math.round(m.teachers * M.teachers.scale),
      results: Math.round(m.results),
      fees: Math.round((a.base - m.affordability * a.perPoint) / 500) * 500
    };
  }

  // One future k on a road. Draw order per year is fixed: 4 normals, then one uniform per luck event,
  // so future k sees the same luck on every road, custom roads included.
  function future(roadOrSpec, k, seed) {
    var sp = specOf(roadOrSpec), d1 = CO.decisions[0], d2 = CO.decisions[1], o1 = sp.o1, o2 = sp.o2, roadId = sp.id;
    var r = mulberry32(hash(seed == null ? CO.seed : seed, k));
    var m = {}; MEAS.forEach(function (q) { m[q] = CO.measures[q].start; });
    var years = {}, luck = [];
    // where each measure's change came from (raw measure points), for the "what happened and why" summary
    var parts = { c1: {}, c2: {}, luck: {}, noise: {} }; MEAS.forEach(function (q) { parts.c1[q] = parts.c2[q] = parts.noise[q] = 0; });
    YEARS.forEach(function (year) {
      var noise = MEAS.map(function () { return normal(r); });
      var rolls = CO.luck.map(function () { return r(); });
      MEAS.forEach(function (q, i) {
        var l1 = year >= d1.year ? (o1.leans[q] || 0) : 0, l2 = year >= d2.year ? (o2.leans[q] || 0) : 0;
        m[q] += l1 + l2 + noise[i] * 4;
        parts.c1[q] += l1; parts.c2[q] += l2; parts.noise[q] += noise[i] * 4;
      });
      CO.luck.forEach(function (L, i) {
        if (L.year !== year) return;
        var p = L.p * ((L.boostedBy && sp.boosts.indexOf(L.boostedBy) >= 0) ? 1.8 : 1);
        var hit = rolls[i] < p;
        luck.push({ id: L.id, year: L.year, sign: L.sign, headline: L.headline, hit: hit });
        if (hit) { parts.luck[L.id] = L.effects; for (var q in L.effects) m[q] += L.effects[q]; }
      });
      MEAS.forEach(function (q) { m[q] = clamp(m[q]); });
      years[year] = display(m);
      years[year].raw = { students: m.students, teachers: m.teachers, results: m.results, affordability: m.affordability };
    });
    return { k: k, road: roadId, years: years, luck: luck, parts: parts, ending: endingOf(m).id, final: Object.assign({}, m) };
  }

  function endingOf(m) {
    for (var i = 0; i < CO.endings.length; i++) {
      var e = CO.endings[i], ok = true;
      for (var q in e.when) if (m[q] < e.when[q][0] || m[q] > e.when[q][1]) ok = false;
      if (ok) return e;
    }
    return CO.endings[CO.endings.length - 1];
  }

  function simulate(roadOrSpec, seed, n) {
    var sp = specOf(roadOrSpec), out = [];
    for (var k = 0; k < (n || nFutures()); k++) out.push(future(sp, k, seed));
    return out;
  }

  function counts(futs) { var c = {}; CO.endings.forEach(function (e) { c[e.id] = 0; }); futs.forEach(function (f) { c[f.ending]++; }); return c; }
  function mode(c) { var best = null; for (var id in c) if (best === null || c[id] > c[best]) best = id; return best; }

  var cache = {};
  function road(roadId) {
    if (cache[roadId]) return cache[roadId];
    return (cache[roadId] = build(specOf(roadId)));
  }
  // A road for a second choice Claude designed: same seed, same luck, same story machinery.
  function customRoad(c1, design) { return build(customSpec(c1, design)); }
  function build(sp) {
    var roadId = sp.id, ch = { c1: sp.c1, c2: sp.c2 }, futs = simulate(sp), c = counts(futs), end = mode(c);
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
    // a custom road brings Claude's own 2036 narration for whichever ending the futures land on
    if (sp.custom && sp.custom.endings && sp.custom.endings[end]) e = Object.assign({}, e, sp.custom.endings[end]);
    return {
      id: roadId, c1: ch.c1, c2: ch.c2, custom: sp.custom || null, option2: sp.o2, n: futs.length,
      futures: futs, endings: c, ending: end, endingInfo: e,
      litFuture: lit.k, lit: lit, luck: lit.luck, counters: counters,
      stamp: '≈ ' + lit.years[2036].students.toLocaleString('en-IN') + ' STUDENTS · ' + c[end] + ' OF ' + futs.length + ' FUTURES'
    };
  }

  // Interpolated counters for a fractional year (e.g. 2027.4)
  function at(r, yf) {
    var y0 = Math.max(2026, Math.min(2036, Math.floor(yf))), y1 = Math.min(2036, y0 + 1), f = Math.max(0, Math.min(1, yf - y0));
    var a = r.counters[y0], b = r.counters[y1], o = {};
    for (var q in a) o[q] = a[q] + (b[q] - a[q]) * f;
    return o;
  }

  // What happened, and why: each measure from 2026 to 2036 on the road's lit future, split into the first choice,
  // the second choice, each luck event that hit, and the year-to-year ups and downs (which also absorb the 0-100 limits).
  // Values are in display units: students, teachers, rupees of fees per year, results points.
  function explain(r) {
    var f = r.lit, M = CO.measures, start = {}, out = {}, d1 = CO.decisions[0];
    MEAS.forEach(function (q) { start[q] = M[q].start; });
    var unit = { students: M.students.scale, teachers: M.teachers.scale, results: 1, affordability: -M.affordability.fee.perPoint };
    var key = { students: 'students', teachers: 'teachers', results: 'results', affordability: 'fees' };
    var o1 = opt(d1, r.c1), o2 = r.option2 || opt(CO.decisions[1], r.c2);
    MEAS.forEach(function (q) {
      var u = unit[q], k = key[q], s0 = display(start)[k], s1 = f.years[2036][k];
      var items = [
        { kind: 'choice1', id: r.c1, label: option(0, r.c1).label, value: f.parts.c1[q] * u },
        { kind: 'choice2', id: r.c2, label: r.c2 === 'custom' ? o2.label : option(1, r.c2, r.c1).label, value: f.parts.c2[q] * u }
      ];
      CO.luck.forEach(function (L) { var e = f.parts.luck[L.id]; if (e && e[q]) items.push({ kind: 'luck', id: L.id, year: L.year, sign: L.sign, label: L.headline, value: e[q] * u }); });
      var named = items.reduce(function (a, b) { return a + b.value; }, 0);
      items.push({ kind: 'noise', id: 'noise', label: 'Ups and downs', value: (s1 - s0) - named });
      items.forEach(function (it) { it.value = q === 'affordability' ? Math.round(it.value / 500) * 500 : q === 'results' ? Math.round(it.value * 10) / 10 : Math.round(it.value); });
      out[k] = { measure: k, from: s0, to: s1, change: s1 - s0, items: items };
    });
    out.summary = summarize(r, out);
    return out;
  }
  // Plain sentences per measure: what the choices did (the same in every future), what luck did, and the ups and downs.
  function summarize(r, ex) {
    var noun = { students: 'Students', teachers: 'Teachers', fees: 'Fees', results: 'Results' };
    var EPS = { students: 20, teachers: 1, fees: 500, results: 1 };
    function amt(k, v) { var a = Math.abs(v); return k === 'fees' ? '₹' + a.toLocaleString('en-IN') : k === 'students' ? Math.round(a).toLocaleString('en-IN') : String(Math.round(a * 10) / 10); }
    function sgn(k, v) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + amt(k, v); }
    function lc(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
    var lines = {}, groups = {};
    ['students', 'teachers', 'fees', 'results'].forEach(function (k) {
      var e = ex[k], c = e.change, eps = EPS[k];
      var ch = e.items.filter(function (i) { return i.kind === 'choice1' || i.kind === 'choice2'; });
      var lk = e.items.filter(function (i) { return i.kind === 'luck'; });
      var nz = e.items.filter(function (i) { return i.kind === 'noise'; })[0];
      var sum = function (a) { return a.reduce(function (x, i) { return x + i.value; }, 0); };
      groups[k] = { choices: sum(ch), luck: sum(lk), noise: nz.value };
      var head = noun[k] + (Math.abs(c) < eps ? ' held about level' : (c > 0 ? ' rose by ' : ' fell by ') + amt(k, c)) + ' (' + amt(k, e.from) + ' → ' + amt(k, e.to) + ').';
      var chTxt = ch.filter(function (i) { return Math.abs(i.value) >= eps / 2; }).map(function (i) { return '“' + i.label + '” ' + sgn(k, i.value); });
      var parts = [head];
      parts.push(chTxt.length ? 'The board\'s decisions: ' + chTxt.join(', ') + '.' : 'The board\'s decisions barely moved it.');
      if (lk.length) parts.push('Luck: ' + lk.map(function (i) { return lc(i.label) + ' in ' + i.year + ' ' + sgn(k, i.value); }).join('; ') + '.');
      if (Math.abs(nz.value) >= eps) parts.push('Ordinary ups and downs: ' + sgn(k, nz.value) + '.');
      lines[k] = parts.join(' ');
    });
    // one line for the whole road: what the choices did to each number (true in every one of the futures)
    var good = function (k, v) { return k === 'fees' ? v < 0 : v > 0; };
    var bits = ['students', 'teachers', 'fees', 'results'].map(function (k) { var v = groups[k].choices; return Math.abs(v) < EPS[k] / 2 ? null : { k: k, txt: noun[k].toLowerCase() + ' ' + sgn(k, v), good: good(k, v) }; }).filter(Boolean);
    var helps = bits.filter(function (b) { return b.good; }).map(function (b) { return b.txt; }), hurts = bits.filter(function (b) { return !b.good; }).map(function (b) { return b.txt; });
    lines.choices = 'By 2036 the board\'s two decisions ' + (helps.length ? 'helped ' + helps.join(', ') : 'helped nothing much') + (hurts.length ? ' and hurt ' + hurts.join(', ') : '') + '. That part is the same in all ' + r.n + ' futures; luck and ordinary ups and downs are what differ.';
    lines.groups = groups;
    return lines;
  }

  // Compare two roads under the same luck: future k of a vs future k of b (k = a's lit future), plus 10-future means.
  function compare(aId, bId) {
    var a = typeof aId === 'object' ? aId : road(aId), b = typeof bId === 'object' ? bId : road(bId), k = a.litFuture;
    var fa = a.futures[k].years[2036], fb = b.futures[k].years[2036];
    function mean(r, q) { return r.futures.reduce(function (s, f) { return s + f.years[2036][q]; }, 0) / r.futures.length; }
    var d = {}; ['students', 'teachers', 'results', 'fees'].forEach(function (q) { d[q] = fb[q] - fa[q]; });
    var dm = {}; ['students', 'teachers', 'results', 'fees'].forEach(function (q) { dm[q] = Math.round(mean(b, q) - mean(a, q)); });
    return { a: a.id, b: b.id, k: k, same: { a: fa, b: fb, delta: d }, mean: dm, endingA: a.futures[k].ending, endingB: b.futures[k].ending };
  }

  // Wording for a decision as the room sees it: the second decision is phrased for the first choice (leans don't change).
  function question(di, c1) { var d = CO.decisions[di], v = d.byFirstChoice && c1 && d.byFirstChoice[c1]; return (v && v.question) || d.question; }
  function option(di, id, c1) { var d = CO.decisions[di], v = d.byFirstChoice && c1 && d.byFirstChoice[c1]; return Object.assign({}, opt(d, id), (v && v.options && v.options[id]) || {}); }

  var api = { init: init, question: question, option: option, customRoad: customRoad, futures: nFutures, explain: explain, ROADS: ROADS, YEARS: YEARS, simulate: simulate, road: road, compare: compare, at: at,
    future: future, counts: counts, mode: mode, endingOf: endingOf, company: function () { return CO; }, _clear: function () { cache = {}; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Agamoto = api;
})(this);
