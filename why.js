/* why.js — the board briefing: what the board decided, and what each decision (and luck) did to each number.
   Shared by the player (play.html) and the home page (index.html). Global `AgamotoWhy`. Needs engine.js (Agamoto). */
(function (root) {
  'use strict';
  var ORDER = ['students', 'teachers', 'fees', 'results'];
  var NAME = { students: 'Students', teachers: 'Teachers', fees: 'Fees a year', results: 'Results' };
  var EPS = { students: 20, teachers: 1, fees: 500, results: 1 };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function amt(k, v) { var a = Math.abs(v); return k === 'fees' ? '₹' + a.toLocaleString('en-IN') : k === 'students' ? Math.round(a).toLocaleString('en-IN') : String(Math.round(a * 10) / 10); }
  function sgn(k, v) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + amt(k, v); }
  // "helps" means good for the institute and its families: more students, teachers, results; lower fees
  function helps(k, v) { return k === 'fees' ? v < 0 : v > 0; }
  function tone(k, v) { return Math.abs(v) < EPS[k] / 2 ? 'flat' : helps(k, v) ? 'helps' : 'hurts'; }
  function kindLabel(it) {
    if (it.kind === 'choice1') return 'Board · 2026';
    if (it.kind === 'choice2') return 'Board · 2027';
    if (it.kind === 'luck') return 'Luck · ' + it.year;
    return 'Chance';
  }
  function rowLabel(it) { return it.kind === 'noise' ? 'Ordinary ups and downs' : it.label; }

  // One small chart per number: a row per cause, bars either side of zero, each row direct-labelled.
  function panel(k, e) {
    var items = e.items.filter(function (it) { return it.kind === 'choice1' || it.kind === 'choice2' || Math.abs(it.value) >= EPS[k] / 2; });
    var max = Math.max.apply(null, items.map(function (it) { return Math.abs(it.value); }).concat([EPS[k]]));
    var t = tone(k, e.change);
    var h = '<div class="why-panel"><div class="why-head"><span class="why-m">' + NAME[k] + '</span>' +
      '<span class="why-ft">' + amt(k, e.from) + ' → ' + amt(k, e.to) + '</span>' +
      '<span class="why-ch ' + t + '">' + (t === 'flat' ? 'about level' : sgn(k, e.change)) + '</span></div><div class="why-rows">';
    items.forEach(function (it) {
      var tt = tone(k, it.value), w = Math.abs(it.value) / max * 50, neg = it.value < 0;
      var word = tt === 'flat' ? 'no real effect' : tt === 'helps' ? 'helped' : 'hurt';
      var tip = rowLabel(it) + ': ' + sgn(k, it.value) + ' ' + NAME[k].toLowerCase() + ' (' + word + ')';
      h += '<div class="why-row ' + it.kind + '" title="' + esc(tip) + '">' +
        '<span class="why-lab"><span class="why-k">' + esc(kindLabel(it)) + '</span><span class="why-l">' + esc(rowLabel(it)) + '</span></span>' +
        '<span class="why-bar"><i class="why-zero"></i><b class="' + (it.kind === 'noise' ? 'chance' : tt) + '" style="' + (neg ? 'right:50%' : 'left:50%') + ';width:' + w.toFixed(1) + '%"></b></span>' +
        '<span class="why-v ' + tt + '">' + sgn(k, it.value) + '</span><span class="why-w">' + word + '</span></div>';
    });
    return h + '</div></div>';
  }

  // The whole briefing for a road (as returned by Agamoto.road / Agamoto.customRoad).
  function briefing(road, opts) {
    opts = opts || {};
    var ex = Agamoto.explain(road), E = road.endingInfo, n = road.n, cnt = road.endings[road.ending];
    var d2 = road.c2 === 'custom' ? road.option2.label : Agamoto.option(1, road.c2, road.c1).label;
    var h = '<div class="why-top"><div class="why-eyebrow">Board briefing · Vidya Classes · 2036' + (opts.tag ? ' · ' + esc(opts.tag) : '') + '</div>' +
      '<div class="why-title">' + esc(E.label) + ' <small>' + cnt + ' of ' + n + ' futures end here</small></div>' +
      '<div class="why-dec"><span>The board decided</span><b>2026 · ' + esc(Agamoto.option(0, road.c1).label) + '</b><b>2027 · ' + esc(d2) + '</b></div>' +
      '<p class="why-sum">' + esc(ex.summary.choices) + '</p></div><div class="why-grid">';
    ORDER.forEach(function (k) { h += panel(k, ex[k]); });
    h += '</div><p class="why-note">Shown for one typical future of the ' + n + ' (the same one the 2036 film follows). Green helped the institute and its families, amber hurt, grey is chance.</p>';
    return h;
  }

  // Small helps/hurts tags for a choice card, from an option's yearly leans.
  function chips(leans) {
    var out = [], map = [['students', 'Students', 1], ['teachers', 'Teachers', 1], ['results', 'Results', 1], ['affordability', 'Fees', -1]];
    map.forEach(function (m) {
      var v = (leans || {})[m[0]] || 0; if (Math.abs(v) < 0.25) return;
      var up = v * m[2] > 0, good = v > 0;
      out.push('<span class="fx ' + (good ? 'helps' : 'hurts') + '" title="' + m[1] + (up ? ' go up' : ' go down') + ' each year">' + (up ? '▲' : '▼') + ' ' + m[1] + '</span>');
    });
    return out.join('');
  }

  root.AgamotoWhy = { briefing: briefing, panel: panel, chips: chips, tone: tone, amt: amt, sgn: sgn };
})(this);
