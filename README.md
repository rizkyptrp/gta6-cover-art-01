# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rizkyptrp/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/rizkyptrp/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Coast Cover Studio — turn your own photo into a neon-sunset poster cover in the style of a crime-saga game box. Pick a layout, drop in your photos, write a title, pick a colour grade, and export a print-ready PNG. A live canvas preview updates as you change every setting, so what you see is exactly what the export will look like. Everything runs offline in the browser: your photos never leave your machine, and there are no game logos, artwork, or fonts anywhere in it.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies the app and the screenshots into `out/` and writes `out/dossier.json`. Open `app/index.html` in a desktop browser to use the studio, or serve it locally with `node serve.ts` and open http://localhost:8080.

## How to use it

1. **Add photos** — drop in photos from your device, or hit "Load demo photos" to try the two included samples (a boulevard and a pier). Click a photo in the tray, then click a panel in the preview to place it there.
2. **Pick a layout** — four-panel grid, hero plus three, or one full-bleed photo.
3. **Write a caption** — a title (up to 28 characters) and a subtitle (up to 48), with a size slider and four lettering styles: sunset gradient, bold white, neon pink, or black ink.
4. **Grade it** — four colour grades: Vice Sunset, Neon Night, Palm Teal, and Golden Hour, plus optional film grain with a vignette and a white poster frame with a badge.
5. **Frame each panel** — click a panel to select it, drag inside it to reposition the photo, scroll over it to zoom, or centre it and cycle to the next photo.
6. **Export** — one click saves a PNG straight to your downloads: square 1080 × 1080, portrait 1080 × 1350, or landscape 1920 × 1080.

## What is inside

- `app/` — the studio itself: plain static HTML, CSS, and vanilla JavaScript, no libraries and no network requests. `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` through the vendored make.fun library.
- `app/samples/` — two demo photos made for this entry, free to use.
- `screenshots/` — four real captures of the studio in use (the first by name is the cover).

---

<sub>Entered on [make.fun](https://make.fun/?ref=67v2e6cq&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
