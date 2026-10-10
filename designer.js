/* designer.js — where the home page gets Claude from, for "Write your own choice".
   1. Inside claude.ai (the published artifact): the viewer's own Claude, through the `sample` capability.
   2. On the site (Vercel): POST api/design, which holds the API key server-side.
   3. Anywhere else: three designs Claude made in advance (design-prompt.js EXAMPLES). */
(function (root) {
  'use strict';
  var CO = null;
  function setCompany(co) { CO = co; }

  function detect() {
    var viaClaudeAi = (root.claude && typeof root.claude.use === 'function')
      ? root.claude.use('sample').then(function (s) { return s ? { mode: 'claude-ai', sample: s } : null; }, function () { return null; })
      : Promise.resolve(null);
    return viaClaudeAi.then(function (b) {
      if (b) return b;
      return fetch('api/design', { method: 'GET', headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { return j && j.ok ? { mode: j.connected ? 'api' : 'api-off', model: j.model } : { mode: 'examples' }; })
        .catch(function () { return { mode: 'examples' }; });
    });
  }

  var SAMPLE_COPY = {
    not_granted: 'Claude wasn\'t allowed for this page. You can still try the examples.',
    sampling_disabled: 'Claude isn\'t available on this account.',
    rate_limited: 'Claude is busy, or your usage limit was reached. Try again in a little while.',
    refused: 'Claude declined to design this one. Try wording it as a decision the institute could take.',
    invalid_json: 'Claude\'s answer couldn\'t be read. Try again.',
    empty_completion: 'Claude didn\'t answer. Try a shorter, clearer decision.',
    session_expired: 'Your claude.ai session expired. Sign in again and retry.',
    cancelled: 'Stopped.'
  };

  function design(backend, c1, choice, signal) {
    if (backend.mode === 'claude-ai') {
      return backend.sample.json(AgamotoDesign.samplePrompt(CO, c1, choice), { modelTier: 'default', signal: signal })
        .then(function (raw) { var d = AgamotoDesign.clean(raw, CO, c1, choice); d.source = 'claude-ai'; return d; },
          function (e) { var err = new Error(SAMPLE_COPY[e && e.code] || 'Claude couldn\'t finish that one. Try again.'); err.code = e && e.code; throw err; });
    }
    if (backend.mode === 'api') {
      return fetch('api/design', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ c1: c1, choice: choice }), signal: signal })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (!r.ok) { var err = new Error(j.error || 'The request failed (' + r.status + ').'); err.code = j.code; throw err; }
            return j.design;
          });
        }, function (e) { var err = new Error(e && e.name === 'AbortError' ? 'Stopped.' : 'Couldn\'t reach the site\'s designer. Check your connection.'); err.code = e && e.name === 'AbortError' ? 'cancelled' : 'network'; throw err; });
    }
    var err = new Error('Claude isn\'t connected here, so only the examples can run.'); err.code = 'not_connected';
    return Promise.reject(err);
  }

  function example(i) {
    var ex = AgamotoDesign.EXAMPLES[i], d = AgamotoDesign.clean(ex.raw, CO, ex.c1, ex.choice);
    d.source = 'example'; return d;
  }

  root.AgamotoDesigner = { setCompany: setCompany, detect: detect, design: design, example: example };
})(this);
