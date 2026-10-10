/* design-prompt.js — "Write your own choice": what Claude is asked, the JSON it must return, and how the answer is
   checked before the engine uses it. Shared by the Vercel function (api/design.js), the claude.ai page, and the
   examples shown when Claude isn't connected. Works in Node (require) and the browser (window.AgamotoDesign). */
(function (root) {
  'use strict';
  var MEAS = ['students', 'teachers', 'results', 'affordability'];
  var ENDS = ['trusted', 'lean', 'empty', 'smaller'];
  var LIMIT = 1.5, BUDGET = 4.5;

  function opt(co, di, id) { return co.decisions[di].options.filter(function (o) { return o.id === id; })[0]; }
  function leansText(o) { return MEAS.filter(function (q) { return o.leans[q]; }).map(function (q) { return q + ' ' + (o.leans[q] > 0 ? '+' : '') + o.leans[q]; }).join(', '); }

  // The instruction. `system` for the Messages API; `user` carries the proposal.
  function prompt(co, c1, choice) {
    var o1 = opt(co, 0, c1), m = co.measures, e = {};
    co.endings.forEach(function (x) { e[x.id] = x; });
    var system = [
      'You design one new option for Eye of Agamoto, a tool a school board uses to rehearse a decision before taking it.',
      '',
      'The institute: Vidya Classes, a fictional coaching institute in Pune (classes 9-12 and entrance exams), founded in 2009 by Sunanda Joshi, a former physics teacher. Today: 2,000 students, 80 teachers, fees of ₹60,000 a year, exam results 55 out of 100. AI tutors now explain any topic, in any language, almost free; that attacks explanation and drilling, the core of a coaching institute. What AI cannot easily replace is mentoring, accountability and trust with parents.',
      '',
      'The board has already taken its 2026 decision: "' + o1.label + '" (' + o1.consequence + ').',
      'A board member now proposes their own 2027 decision. Turn it, honestly, into the terms the simulation understands.',
      '',
      'The simulation tracks four measures on a 0-100 scale:',
      '- students: demand (50 = 2,000 students; each point is ' + m.students.scale + ' students)',
      '- teachers: staff (60 = 80 teachers)',
      '- results: exam results',
      '- affordability: higher means lower fees for families (50 = ₹60,000 a year; each point is ₹' + m.affordability.fee.perPoint + ')',
      'An option adds a yearly "lean" to each measure every year from 2027 to 2036 (ten years), between -' + LIMIT + ' and +' + LIMIT + '. On top of that, each year has random ups and downs (standard deviation 4 points), and three luck events can hit: a free AI tutor app goes viral in 2028; a big coaching chain collapses in 2029 and parents look for a trusted name (more likely if the institute builds trust); a Vidya student tops the state exam in 2030 (more likely if AI is built into classes).',
      '',
      'For calibration, the existing options are:',
      '- 2026 "Ban AI in class": ' + leansText(opt(co, 0, 'ban')),
      '- 2026 "Build AI into every class": ' + leansText(opt(co, 0, 'build')),
      '- 2027 "Cut staff to cut fees": ' + leansText(opt(co, 1, 'cut')),
      '- 2027 "Retrain teachers as mentors": ' + leansText(opt(co, 1, 'retrain')),
      '',
      'Rules:',
      '- Be realistic. Most real decisions cost something as well as help; do not make every lean positive. Keep the sum of the absolute leans at or below about 3.5.',
      '- Think about how the proposal works together with the 2026 decision ("' + o1.label + '").',
      '- buildsTrust is true only if the proposal clearly builds trust with parents (mentoring, accountability, openness).',
      '- If the proposal is not something the institute could actually decide (off topic, harmful, or nonsense), set relevant to false, say why in note, and set every lean to 0. Otherwise use note for one sentence on how you read the proposal.',
      '- label: the decision as a short card title, at most 5 words, starting with a verb (for example "Run weekend doubt clinics"). consequence: one line, at most 14 words.',
      '- effects: for each measure a lean and a why (one short clause, at most 12 words).',
      '- atHome: one sentence (at most 14 words) a parent says at home in 2030 about this decision.',
      '- endings: the simulation decides where each future ends by 2036 using these rules: trusted (students >= ' + e.trusted.when.students[0] + ', teachers >= ' + e.trusted.when.teachers[0] + ', results >= ' + e.trusted.when.results[0] + ') "' + e.trusted.label + '"; lean (students >= ' + e.lean.when.students[0] + ', teachers < ' + e.lean.when.teachers[1] + ') "' + e.lean.label + '"; empty (students < ' + e.empty.when.students[1] + ') "' + e.empty.label + '"; otherwise smaller "' + e.smaller.label + '". For each of the four, write it as if this proposal had been taken and that ending happened: glimpse is two sentences, each starting "Monday morning, 2036." in the present tense with exactly one word wrapped in *asterisks*; callouts are two short tags of 2-4 words with no punctuation; line is one closing sentence of at most 14 words. Keep the hard ending dignified, never tragic.',
      '- Write in plain, warm English as people in Pune speak it. No jargon.'
    ].join('\n');
    var user = 'The 2027 decision proposed by a board member:\n"' + String(choice).replace(/"/g, "'") + '"';
    return { system: system, user: user };
  }

  // The same instruction as one prompt string, for the claude.ai page (sample.json has no system prompt).
  function samplePrompt(co, c1, choice) {
    var p = prompt(co, c1, choice);
    return p.system + '\n\n' + p.user + '\n\nReply with only one JSON object, with exactly these keys and types:\n' +
      '{"relevant": boolean, "note": string, "label": string, "consequence": string, "buildsTrust": boolean,\n' +
      ' "effects": {"students": {"lean": number, "why": string}, "teachers": {...same}, "results": {...same}, "affordability": {...same}},\n' +
      ' "atHome": string,\n' +
      ' "endings": {"trusted": {"glimpse": [string, string], "callouts": [string, string], "line": string}, "lean": {...same}, "empty": {...same}, "smaller": {...same}}}';
  }

  var effect = { type: 'object', additionalProperties: false, required: ['lean', 'why'], properties: { lean: { type: 'number' }, why: { type: 'string' } } };
  var ending = { type: 'object', additionalProperties: false, required: ['glimpse', 'callouts', 'line'], properties: { glimpse: { type: 'array', items: { type: 'string' } }, callouts: { type: 'array', items: { type: 'string' } }, line: { type: 'string' } } };
  var SCHEMA = {
    type: 'object', additionalProperties: false,
    required: ['relevant', 'note', 'label', 'consequence', 'buildsTrust', 'effects', 'atHome', 'endings'],
    properties: {
      relevant: { type: 'boolean' }, note: { type: 'string' }, label: { type: 'string' }, consequence: { type: 'string' }, buildsTrust: { type: 'boolean' },
      effects: { type: 'object', additionalProperties: false, required: MEAS, properties: { students: effect, teachers: effect, results: effect, affordability: effect } },
      atHome: { type: 'string' },
      endings: { type: 'object', additionalProperties: false, required: ENDS, properties: { trusted: ending, lean: ending, empty: ending, smaller: ending } }
    }
  };

  function str(v, max, fallback) {
    var s = (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim();
    if (!s) s = fallback || '';
    if (s.length > max) { s = s.slice(0, max); var cut = s.lastIndexOf(' '); if (cut > max * 0.6) s = s.slice(0, cut); s = s.replace(/[,;:\s]+$/, '') + '…'; }
    return s;
  }
  function num(v) { var n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : 0; }

  // Check and clamp whatever came back, so a strange answer can never break the simulation or the page.
  function clean(raw, co, c1, choice) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var relevant = raw.relevant !== false, fx = raw.effects || {}, leans = {}, why = {};
    MEAS.forEach(function (q) {
      var e = fx[q] || {}, l = relevant ? Math.max(-LIMIT, Math.min(LIMIT, num(e.lean))) : 0;
      leans[q] = Math.round(l * 10) / 10; why[q] = str(e.why, 90, relevant ? '' : 'Not a decision the institute could take.');
    });
    var total = MEAS.reduce(function (s, q) { return s + Math.abs(leans[q]); }, 0);
    if (total > BUDGET) MEAS.forEach(function (q) { leans[q] = Math.round(leans[q] * BUDGET / total * 10) / 10; });
    var endings = {}, base = {};
    co.endings.forEach(function (x) { base[x.id] = x; });
    ENDS.forEach(function (id) {
      var e = (raw.endings || {})[id] || {}, b = base[id];
      var g = (Array.isArray(e.glimpse) ? e.glimpse : []).slice(0, 2).map(function (s, i) {
        s = str(s, 150, b.glimpse[i]); if (!/^Monday morning, 2036\./.test(s)) s = 'Monday morning, 2036. ' + s.replace(/^Monday morning,?\s*2036\.?\s*/i, ''); return s;
      });
      while (g.length < 2) g.push(b.glimpse[g.length]);
      var co2 = (Array.isArray(e.callouts) ? e.callouts : []).slice(0, 2).map(function (s, i) { return str(String(s || '').replace(/[.!?]+$/, ''), 30, b.callouts[i]); });
      while (co2.length < 2) co2.push(b.callouts[co2.length]);
      endings[id] = { glimpse: g, callouts: co2, line: str(e.line, 110, b.line) };
    });
    return {
      relevant: relevant, note: str(raw.note, 220, ''), c1: c1, choice: str(choice, 240, ''),
      label: str(raw.label, 40, str(choice, 40, 'Your decision')), consequence: str(raw.consequence, 110, ''),
      buildsTrust: relevant && raw.buildsTrust === true, leans: leans, why: why,
      atHome: str(raw.atHome, 110, 'The board\'s new idea reached our dinner table.'), endings: endings
    };
  }

  // Designed by Claude in advance, for sites where Claude isn't connected. Same shape as a live answer.
  var EXAMPLES = [
    { c1: 'build', choice: 'Run free weekend doubt-clinics for parents and students', raw: {
      relevant: true, note: 'Read as Saturday sessions where teachers clear doubts with students and explain progress to parents.',
      label: 'Run weekend doubt clinics', consequence: 'Teachers spend Saturdays with families; the AI handles weekday drills.', buildsTrust: true,
      effects: { students: { lean: 0.9, why: 'Parents see the work and tell other parents.' }, teachers: { lean: 0.2, why: 'A little extra hiring for weekend cover.' },
        results: { lean: 0.7, why: 'Doubts get cleared before they pile up.' }, affordability: { lean: -0.4, why: 'Weekend staff costs nudge fees up.' } },
      atHome: 'We went to the Saturday clinic. Her teacher explained it to us too.',
      endings: {
        trusted: { glimpse: ['Monday morning, 2036. The Saturday clinics have a *waiting* list.', 'Monday morning, 2036. Parents greet the teachers by *name* at the gate.'], callouts: ['Saturday clinics full', 'Parents as partners'], line: 'Trust was built one Saturday at a time, and the rooms stayed full.' },
        lean: { glimpse: ['Monday morning, 2036. Fewer teachers, but every *Saturday* is packed.', 'Monday morning, 2036. The AI drills all week; people answer the *doubts*.'], callouts: ['AI drills, people explain', 'Busy weekends'], line: 'Lean on weekdays, generous on weekends.' },
        empty: { glimpse: ['Monday morning, 2036. The Saturday room holds a *handful* of families.', 'Monday morning, 2036. Sunanda still answers every doubt *herself*.'], callouts: ['A few loyal families', 'Doubts still answered'], line: 'The clinics kept a few families close when the rest drifted away.' },
        smaller: { glimpse: ['Monday morning, 2036. The clinics are smaller but *never* cancelled.', 'Monday morning, 2036. The families who stayed bring their *cousins*.'], callouts: ['Smaller, steadier', 'Word of mouth'], line: 'Not the biggest institute in Pune, but the one parents trust.' } } } },
    { c1: 'ban', choice: 'Pay teachers a bonus for every student whose results improve', raw: {
      relevant: true, note: 'Read as a performance bonus tied to each student\'s improvement, paid from fees.',
      label: 'Pay bonuses for improvement', consequence: 'Teachers earn more when their students\' results rise.', buildsTrust: false,
      effects: { students: { lean: 0.3, why: 'Better results attract a few more families.' }, teachers: { lean: 0.4, why: 'Good teachers stay for the bonus.' },
        results: { lean: 0.9, why: 'Teachers chase the weakest students\' gains.' }, affordability: { lean: -0.7, why: 'Bonuses are paid for out of fees.' } },
      atHome: 'His teacher calls every week now. I think it\'s about the bonus.',
      endings: {
        trusted: { glimpse: ['Monday morning, 2036. The best teachers in Pune *want* to work here.', 'Monday morning, 2036. Every student\'s progress is tracked, and *celebrated*.'], callouts: ['Teachers who stay', 'Progress you can see'], line: 'Paying for progress paid off, without any AI in class.' },
        lean: { glimpse: ['Monday morning, 2036. A few star teachers carry *big* classes.', 'Monday morning, 2036. The bonus board in the staffroom is always *full*.'], callouts: ['Star teachers', 'Big classes'], line: 'Fewer teachers, paid well, pushing hard.' },
        empty: { glimpse: ['Monday morning, 2036. The bonuses are *small* now; so are the classes.', 'Monday morning, 2036. Three students still get every minute of a teacher\'s *care*.'], callouts: ['Bonuses shrank', 'Care stayed'], line: 'The money ran thin, but the teachers who stayed still care.' },
        smaller: { glimpse: ['Monday morning, 2036. Results are up; the *fees* are too.', 'Monday morning, 2036. Some families left for the free apps, some *stayed*.'], callouts: ['Results up', 'Fees up too'], line: 'Better teaching, at a price not every family can pay.' } } } },
    { c1: 'build', choice: 'Partner with Pune schools to run after-school AI labs', raw: {
      relevant: true, note: 'Read as Vidya teachers running AI study labs inside partner schools after hours.',
      label: 'Run AI labs in schools', consequence: 'Vidya teachers run after-school AI labs inside partner schools.', buildsTrust: false,
      effects: { students: { lean: 1.1, why: 'Schools send their students straight to Vidya.' }, teachers: { lean: -0.2, why: 'Teachers are stretched across many sites.' },
        results: { lean: 0.4, why: 'The labs help, but time per student is thin.' }, affordability: { lean: 0.3, why: 'Schools share the cost of the labs.' } },
      atHome: 'She met Vidya at her school\'s AI lab. Now she wants to join.',
      endings: {
        trusted: { glimpse: ['Monday morning, 2036. Twelve schools open their labs with a *Vidya* mentor.', 'Monday morning, 2036. Students arrive already *knowing* their teacher.'], callouts: ['Labs in twelve schools', 'Known before they join'], line: 'The labs became the front door, and the rooms filled.' },
        lean: { glimpse: ['Monday morning, 2036. One teacher looks after *three* labs.', 'Monday morning, 2036. The AI keeps every student busy; the teacher *roams*.'], callouts: ['Three labs each', 'AI keeps them busy'], line: 'Wide reach, thin teaching, and plenty of new students.' },
        empty: { glimpse: ['Monday morning, 2036. The schools built their *own* labs.', 'Monday morning, 2036. Sunanda visits the last partner school on *foot*.'], callouts: ['Schools went it alone', 'One school left'], line: 'The partnership taught the schools to do it without Vidya.' },
        smaller: { glimpse: ['Monday morning, 2036. Half the labs are *still* running.', 'Monday morning, 2036. Teachers rush between schools between *bells*.'], callouts: ['Half the labs left', 'Teachers on the move'], line: 'A good idea that grew faster than the teachers could.' } } } }
  ];

  var api = { prompt: prompt, samplePrompt: samplePrompt, SCHEMA: SCHEMA, clean: clean, EXAMPLES: EXAMPLES, MEASURES: MEAS, ENDINGS: ENDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AgamotoDesign = api;
})(this);
