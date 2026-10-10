// POST /api/design {c1: "ban"|"build", choice: "..."} → {design}
// GET  /api/design → {ok, connected}   (the home page uses this to decide whether Claude is available here)
// Claude designs the effects and 2036 narration of a board member's own 2027 decision. Needs ANTHROPIC_API_KEY.
const AgamotoDesign = require('../design-prompt.js');
const company = require('../company.json');

let Anthropic = null;
try { const m = require('@anthropic-ai/sdk'); Anthropic = m.default || m.Anthropic || m; } catch (e) { Anthropic = null; }

const MODEL = 'claude-opus-5-5';
const WINDOW_MS = 10 * 60 * 1000, PER_WINDOW = 6;   // best-effort per-visitor limit (per warm instance)
const hits = new Map();

function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > PER_WINDOW;
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const connected = Boolean(process.env.ANTHROPIC_API_KEY && Anthropic);
  if (req.method === 'GET') return res.status(200).json({ ok: true, connected, model: connected ? MODEL : null });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.', code: 'method' });
  if (!connected) return res.status(503).json({ error: 'Claude isn\'t connected on this site yet. The owner can add an ANTHROPIC_API_KEY in the Vercel project settings.', code: 'not_connected' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  if (limited(ip)) return res.status(429).json({ error: 'That\'s a lot of designs in a few minutes. Try again in ten minutes.', code: 'rate_limited' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const c1 = body && body.c1, choice = String((body && body.choice) || '').replace(/\s+/g, ' ').trim();
  if (c1 !== 'ban' && c1 !== 'build') return res.status(400).json({ error: 'Pick the 2026 decision first.', code: 'bad_c1' });
  if (choice.length < 4) return res.status(400).json({ error: 'Write the decision in a few words.', code: 'too_short' });
  if (choice.length > 240) return res.status(400).json({ error: 'Keep the decision under 240 characters.', code: 'too_long' });

  const p = AgamotoDesign.prompt(company, c1, choice);
  try {
    const msg = await module.exports.makeClient().beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      // if a safety classifier declines, Anthropic re-runs the request on its recommended fallback model
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: AgamotoDesign.SCHEMA } },
      system: p.system,
      messages: [{ role: 'user', content: p.user }]
    });
    if (msg.stop_reason === 'refusal') return res.status(422).json({ error: 'Claude declined to design this one. Try wording it as a decision the institute could take.', code: 'refused' });
    if (msg.stop_reason === 'max_tokens') return res.status(502).json({ error: 'Claude\'s answer was cut short. Try again.', code: 'cut_short' });
    const text = (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    const design = AgamotoDesign.clean(JSON.parse(text), company, c1, choice);
    design.source = 'claude-api'; design.model = msg.model;
    return res.status(200).json({ design });
  } catch (e) {
    if (Anthropic.RateLimitError && e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'Claude is busy right now. Try again in a minute.', code: 'rate_limited' });
    if (Anthropic.AuthenticationError && e instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: 'The site\'s Claude API key was rejected. The owner needs to check ANTHROPIC_API_KEY.', code: 'bad_key' });
    if (Anthropic.PermissionDeniedError && e instanceof Anthropic.PermissionDeniedError) return res.status(503).json({ error: 'The site\'s Claude API key isn\'t allowed to use this model.', code: 'forbidden' });
    if (Anthropic.APIError && e instanceof Anthropic.APIError) return res.status(502).json({ error: 'Claude returned an error (' + (e.status || 'network') + '). Try again.', code: 'api_error' });
    if (e instanceof SyntaxError) return res.status(502).json({ error: 'Claude\'s answer couldn\'t be read. Try again.', code: 'bad_json' });
    console.error(e);
    return res.status(500).json({ error: 'Something went wrong designing that decision.', code: 'server' });
  }
}

module.exports = handler;
module.exports.makeClient = () => new Anthropic();
module.exports.Anthropic = Anthropic;
