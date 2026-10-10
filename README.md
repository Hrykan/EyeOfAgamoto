# Eye of Agamoto · Vidya Classes

Eye of Agamoto lets a room rehearse a decision before making it: two choices, 10 futures per road with the same luck, and you see who it affects.

AI tutors now explain any topic, in any language, almost free. That attacks the core of a coaching institute: explanation and drilling. What AI can't easily replace is mentoring, accountability and trust with parents. The futures split on whether the institute moves its people up to that work, or competes with AI on price.

Vidya Classes is a coaching institute in Pune (classes 9–12 and entrance exams), founded in 2009 by Sunanda Joshi, a former physics teacher: 2,000 students and 80 teachers. The room makes two choices:

1. **2026 · What do we do about AI tutors?** Ban AI in class, or build AI into every class.
2. **2027 · What happens to the teachers?** Cut staff to cut fees, or retrain teachers as mentors.

Each of the 4 roads is run as **10 futures with the same luck** (a seeded engine, the same random draws on every road), so the only difference between roads is the decision. The story then plays 2036 for the road's most common ending, and "What if?" rewinds to try another road and compare who it affects.

**A fictional company. Illustrative futures — a rehearsal, not a prediction.**

## Live link

- The room player is the home page, `index.html`. It opens on a menu: start the story, skip to the first vote, or jump into any of the four scenarios (from 2026, or 2036 only).
- Vercel: import this repository (Framework Preset: Other, no build command, no output directory). The root URL opens the player.
- GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root.
- Fallback, drawn live on a canvas: `story.html` (click a card, or 1 / 2 then Enter; R rewinds).
- Ultimate fallback: `walkthrough.mp4`

## Run it

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

## Room controls

On screen, a control bar appears when you move the mouse: **Menu · Restart · −5s · Pause · +5s · Skip**. Skip jumps to the next part; during a vote it locks the current choice. Each vote has a **Lock it in** button and a 10-second timer.

| Key | Action |
|---|---|
| Enter (on the menu) | start the story |
| 1–4 (on the menu) | play that scenario from 2026 |
| 1 / 2 or click a card | vote |
| Enter, **Lock it in**, or the 10 s timer | lock the choice |
| Space | pause / resume |
| ← / → | back / forward 5 seconds |
| N | skip to the next part |
| R | restart the story |
| M | back to the menu |
| click a road on the What if? map (or 1–4) | rewind and try that road |

## How it's made

- `company.json` — the company, two decisions, three luck events, four endings.
- `engine.js` — pure, seeded engine (mulberry32; future *k* seeded from hash(seed, k), same draw order on every road). `simulate(road)`, `road(road)`, `compare(a, b)`. `calibrate.mjs` runs 4 roads × 2,000 futures and picks the seed whose 10 futures best match.
- `collage.js` — the paper-collage kit: torn paper, halftone, silhouettes, captions, stamps, rings, callouts, camera tracks, grain, vignette.
- `scenes.js` — the data-driven classroom set and the prologue / choice / 2027–2030 clips.
- `endings.js` — the four 2036 films and the rewind.
- `story.html` — one 1920×1080 canvas; `draw(t)` is a pure function of clip and time. `?clip=<id>` plays one clip for the renderer.
- `render.mjs` — Playwright steps each clip at 30 fps and pipes frames to ffmpeg → `clips/<id>.mp4`.
- `index.html` — the room player: menu, double-buffered videos, vote overlays, countdown, control bar, path map, rewind, compare card, Web Audio cues. (`play.html` redirects here.)

Built from an empty folder in 30 minutes from one prompt by Opus 5.5 (lead) with three Sonnet 5.5 subagents.
