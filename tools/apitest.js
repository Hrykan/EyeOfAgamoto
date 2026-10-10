// node tools/apitest.js — exercises api/design.js with a stand-in Claude client (no network, no key needed).
const D = require('../design-prompt.js');
process.env.ANTHROPIC_API_KEY = 'test-key';
const handler = require('../api/design.js');
const A = handler.Anthropic;
function call(method, body, reply) {
  let sent = null;
  handler.makeClient = () => ({ beta: { messages: { create: async (req) => { sent = req; if (reply instanceof Error) throw reply; return reply; } } } });
  return new Promise((resolve) => {
    const res = { headers: {}, code: 0, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(o) { resolve({ code: this.code, body: o, sent }); } };
    handler({ method, body, headers: { 'x-forwarded-for': '10.0.0.' + Math.floor(Math.random() * 250) } }, res);
  });
}
const good = { model: 'claude-opus-5-5', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(D.EXAMPLES[0].raw) }] };
(async () => {
  const out = [];
  let r = await call('GET'); out.push(['GET reports connected', r.code === 200 && r.body.connected === true]);
  r = await call('POST', { c1: 'build', choice: 'Run free weekend doubt-clinics for parents' }, good);
  out.push(['POST returns a cleaned design', r.code === 200 && r.body.design.label === 'Run weekend doubt clinics' && r.body.design.leans.students === 0.9]);
  out.push(['request: model, fallbacks, json_schema', r.sent.model === 'claude-opus-5-5' && r.sent.fallbacks === 'default' && r.sent.betas[0] === 'server-side-fallback-2026-07-01' && r.sent.output_config.format.type === 'json_schema' && r.sent.output_config.effort === 'medium']);
  r = await call('POST', { c1: 'build', choice: 'x' }, good); out.push(['too short → 400', r.code === 400]);
  r = await call('POST', { c1: 'maybe', choice: 'Run clinics' }, good); out.push(['bad first choice → 400', r.code === 400]);
  r = await call('POST', JSON.stringify({ c1: 'ban', choice: 'Run clinics on Sundays' }), good); out.push(['string body is parsed', r.code === 200]);
  r = await call('POST', { c1: 'ban', choice: 'Something odd' }, { stop_reason: 'refusal', content: [] }); out.push(['refusal → 422', r.code === 422]);
  r = await call('POST', { c1: 'ban', choice: 'Something odd' }, { stop_reason: 'end_turn', content: [{ type: 'text', text: '{not json' }] }); out.push(['unreadable answer → 502', r.code === 502 && r.body.code === 'bad_json']);
  r = await call('POST', { c1: 'ban', choice: 'Something odd' }, new A.APIConnectionError({ message: 'offline' })); out.push(['connection error → 502', r.code === 502 && r.body.code === 'api_error']);
  delete process.env.ANTHROPIC_API_KEY;
  r = await call('POST', { c1: 'ban', choice: 'Run clinics' }, good); out.push(['no key → 503 not_connected', r.code === 503 && r.body.code === 'not_connected']);
  r = await call('GET'); out.push(['GET without key reports not connected', r.body.connected === false]);
  out.forEach(([n, ok]) => console.log((ok ? 'PASS  ' : 'FAIL  ') + n));
  process.exit(out.every((x) => x[1]) ? 0 : 1);
})();
