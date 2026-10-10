/* sound.js — the score and sound effects for every clip (animotion rule: sound is half the film; never ship silent).
   One 96 bpm beat grid for picture and sound (C.BEAT = 0.625 s, a bar = 2.5 s).
   SOUND.spec(id, road) → { dur, bpm, kit, harmony, key, sections, events, fade } for groove.js buildGroove().
   Events come from the clip: CLIPS[id].events(road) (chapters.js merges its PLACES' events) — [[t, sfx, arg?], ...].
   Each place declares PLACES.<name>.events = function (road) { return [[t, 'notify'], ...]; }  (times local to the scene).
   SFX: click clack switch whoosh whooshIn whooshOut boing clank ding pop popLow(i) tick swish thud clonk creak blip(i) zip(i)
        flag alarm step notify drip rip sew cash. Put whooshIn ~0.45 s before a stamp's clank; a swish (not a thud) on a punch-in. */
(function (root) {
  'use strict';
  var SOUND = {}, BAR = 2.5;
  // the mood of each road (kept across c2 → mid → end so a road sounds like itself)
  var ROAD_MOOD = {
    'build-retrain': { kit: 'percussion', harmony: 'bright', key: 2 },
    'build-cut': { kit: 'keys', harmony: 'wistful', key: 0 },
    'ban-retrain': { kit: 'acoustic', harmony: 'folk', key: -2 },
    'ban-cut': { kit: 'acoustic', harmony: 'tense', key: -3 }
  };
  // layers brought in one or two per bar (groove.js rule: kick + bass together after a quiet intro read as a startle)
  function build(nBars, peak) {
    // kick4 and clap enter a bar apart: together on one bar line (plus a cut's sound) they measured +6.7 dB, a startle
    var L = [['padSoft', 'pluck'], ['padSoft', 'pluck', 'hat8'], ['pad', 'pluck', 'hat8', 'kick2'], ['pad', 'pluck', 'hat8', 'kick2', 'bassHalf'], ['pad', 'pluck', 'hat8', 'kick4', 'bassHalf'], ['pad', 'pluck', 'hat8', 'kick4', 'bassHalf', 'clap']];
    var out = []; for (var b = 0; b < nBars; b++) out.push([b, b + 1, L[Math.min(b, peak == null ? L.length - 1 : peak)]]); return out;
  }
  function soft(nBars) { var out = []; for (var b = 0; b < nBars; b++) out.push([b, b + 1, b % 2 ? ['padSoft', 'pluck'] : ['padSoft']]); return out; }
  function music(id, road, dur) {
    var nb = Math.max(1, Math.ceil((dur || 15) / BAR));
    var m = ROAD_MOOD[road.id] || ROAD_MOOD['build-retrain'];
    if (id === 'prologue') return { kit: 'acoustic', harmony: 'folk', key: 0, sections: build(nb, 3) };
    if (/^wait/.test(id)) return { kit: 'keys', harmony: 'dreamy', key: 0, sections: [[0, nb, ['padSoft']]], fade: 0 };
    if (id === 'c1-build') return { kit: 'keys', harmony: 'bright', key: 0, sections: build(nb, 3) };
    if (id === 'c1-ban') return { kit: 'acoustic', harmony: 'wistful', key: 0, sections: build(nb, 2) };
    if (/^home-/.test(id)) return { kit: 'keys', harmony: 'dreamy', key: road.c1 === 'ban' ? -2 : 0, sections: soft(5) };
    // the percussion kit's kick is a low tom: four-on-the-floor toms jump out (+6.7 dB at a bar line), so it stays half-time
    if (/^c2-/.test(id)) return { kit: m.kit, harmony: m.harmony, key: m.key, sections: m.kit === 'percussion' ? build(nb).map(function (x) { return [x[0], x[1], x[2].map(function (l) { return l === 'kick4' ? 'kick2' : l; })]; }) : build(nb) };
    if (/^mid-/.test(id)) return { kit: m.kit, harmony: m.harmony, key: m.key, sections: build(nb, 3) };
    if (/^end-/.test(id)) {
      var hard = road.ending === 'empty' || road.ending === 'smaller';
      return { kit: m.kit, harmony: hard ? (road.ending === 'empty' ? 'tense' : 'wistful') : 'bright', key: m.key,
        sections: hard ? [[0, 1, ['crash', 'pad']], [1, 3, ['pad', 'pluck']], [3, nb, ['padSoft', 'pluck']]] : [[0, 1, ['crash', 'pad', 'pluck']], [1, 3, ['pad', 'pluck', 'hat8', 'kick2', 'bassHalf']], [3, nb, ['pad', 'pluck', 'hat8', 'kick4', 'bassHalf', 'clap']]] };
    }
    if (/^place-/.test(id)) return { kit: m.kit, harmony: m.harmony, key: m.key, sections: build(nb, 3) };
    if (/^rewind/.test(id)) return { kit: m.kit, harmony: m.harmony, key: m.key, sections: [[0, nb, ['padSoft']]] };
    return { kit: m.kit, harmony: m.harmony, key: m.key, sections: build(nb) };
  }
  SOUND.spec = function (id, road, dur, events) {
    var k = root.CLIPS[id] || (/^place-/.test(id) ? root.PLACES[id.slice(6)] : null), m = music(id, road, dur), ev = [];
    if (events) ev = events;
    else try { ev = k && k.events ? (typeof k.events === 'function' ? k.events(road) : k.events) : []; } catch (e) { console.error('events ' + id, e); ev = []; }
    ev = (ev || []).filter(function (e) { return e && e[0] >= 0 && e[0] < dur; }).sort(function (a, b) { return a[0] - b[0]; });
    return { dur: dur, bpm: 96, kit: m.kit, harmony: m.harmony, key: m.key, sections: m.sections, events: ev, fade: m.fade == null ? 0.2 : m.fade, sfxGain: 0.85, gain: 0.8 };
  };
  root.SOUND = SOUND;
})(typeof window !== 'undefined' ? window : globalThis);
