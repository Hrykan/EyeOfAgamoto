# Eye of Agamoto · Vidya Classes

Eye of Agamoto lets a room rehearse a decision before making it: two choices, 10 futures per road with the same luck, and you see who it affects.

AI tutors now explain any topic, in any language, almost free. That attacks the core of a coaching institute: explanation and drilling. What AI can't easily replace is mentoring, accountability and trust with parents. The futures split on whether the institute moves its people up to that work, or competes with AI on price.

Vidya Classes is a coaching institute in Pune (classes 9–12 and entrance exams), founded in 2009 by Sunanda Joshi, a former physics teacher: 2,000 students and 80 teachers. The room makes two choices:

1. **2026 · What do we do about AI tutors?** Ban AI in class, or build AI into every class.
2. **2027 · What happens to the teachers?** Cut staff to cut fees, or retrain teachers as mentors.

Each of the 4 roads is run as **10 futures with the same luck** (a seeded engine, the same random draws on every road), so the only difference between roads is the decision. The story then plays 2036 for the road's most common ending, and "What if?" rewinds to try another road and compare who it affects.

**A fictional company. Illustrative futures — a rehearsal, not a prediction.**

## Live link

- Stage player: `play.html` — on GitHub Pages: Settings → Pages → Deploy from a branch → `claude/sleepy-faraday-48qv15` / root, then open https://hrykan.github.io/EyeOfAgamoto/play.html
- Fallback, drawn live: `index.html` (keys 1 / 2 choose, Enter locks, R rewinds)
- Ultimate fallback: `walkthrough.mp4`

## Run it

```bash
python3 -m http.server 8000
# open http://localhost:8000/play.html
```

## Room controls (play.html)

| Key | Action |
|---|---|
| click / any key | begin (unlocks sound) |
| 1 / 2 or click a card | vote |
| Enter (or the 10 s timer) | lock the choice |
| Space | pause / resume |
| ← / → | seek within the clip |
| R | restart |
| click a road on the path map | rewind and try that road |

## How it's made

- `company.json` — the company, two decisions, three luck events, four endings.
- `engine.js` — pure, seeded engine (mulberry32; future *k* seeded from hash(seed, k), same draw order on every road). `simulate(road)`, `road(road)`, `compare(a, b)`. `calibrate.mjs` runs 4 roads × 2,000 futures and picks the seed whose 10 futures best match.
- `collage.js` — the paper-collage kit: torn paper, halftone, silhouettes, captions, stamps, rings, callouts, camera tracks, grain, vignette.
- `scenes.js` — the data-driven classroom set and the prologue / choice / 2027–2030 clips.
- `endings.js` — the four 2036 films and the rewind.
- `index.html` — one 1920×1080 canvas; `draw(t)` is a pure function of clip and time. `?clip=<id>` plays one clip for the renderer.
- `render.mjs` — Playwright steps each clip at 30 fps and pipes frames to ffmpeg → `clips/<id>.mp4`.
- `play.html` — the stage player: double-buffered videos, vote overlays, countdown, path map, rewind, compare card, Web Audio cues.

Built from an empty folder in 30 minutes from one prompt by Opus 5.5 (lead) with three Sonnet 5.5 subagents.
