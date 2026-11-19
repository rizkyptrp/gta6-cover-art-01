# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rizkyptrp/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/rizkyptrp/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

## Vice Coast Cover Studio

An entry for the make.fun bounty **gta6-cover-art-01**: "Make GTA 6 Cover Art" ($250).

Vice Coast Cover Studio is an offline web app that turns any photo and a caption into GTA 6-style cover art — the multi-panel poster look with bold lettering and a Vice City sunset or neon colour grade — and exports it as a PNG to share. Photos never leave the machine; everything runs from static files in the browser.

- 3 layouts: four-panel grid, hero + three, full-bleed
- 4 grades: Vice Sunset, Neon Night, Palm Teal, Golden Hour
- Per-panel crop, pan and zoom; caption title + subtitle in 4 lettering styles
- Grain, vignette, frame and badge; PNG export at 1080×1080, 1080×1350 and 1920×1080
- System fonts only, no Rockstar assets

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`. Run it twice and compare — the output is deterministic.

Serve the app locally with `node serve.ts`, then open http://localhost:8080.

---

<sub>Entered on [make.fun](https://make.fun/?ref=67v2e6cq&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
