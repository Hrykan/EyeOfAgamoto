import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url);
const Kal = require('./engine.js'); const co = JSON.parse(fs.readFileSync('company.json'));
Kal.init(co);
const big = {};
for (const r of Kal.ROADS) { const c = Kal.counts(Kal.simulate(r, 7777, 2000)); big[r] = c; console.log(r, JSON.stringify(c), 'mode', Kal.mode(c)); }
let best = null;
for (let s = 1; s <= 300; s++) {
  let score = 0, ok = true;
  for (const r of Kal.ROADS) {
    const c = Kal.counts(Kal.simulate(r, s, 10));
    if (Kal.mode(c) !== Kal.mode(big[r]) || c[Kal.mode(big[r])] <= Math.max(...Object.entries(c).filter(([k]) => k !== Kal.mode(big[r])).map(([, v]) => v))) ok = false;
    const used = Object.values(c).filter(v => v > 0).length; if (used < 2) ok = false;
    for (const e in c) score += Math.abs(c[e] - big[r][e] / 200);
  }
  if (ok && (!best || score < best.score)) best = { s, score };
}
console.log('best seed', best);
if (best && process.argv[2] === 'write') { co.seed = best.s; fs.writeFileSync('company.json', JSON.stringify(co, null, 2) + '\n'); }
