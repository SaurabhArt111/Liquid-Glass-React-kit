# Liquid Glass for React (Vite): v2

The library, the dev-tools site and the downloadable kit, in one repo.

```bash
npm install
npm run dev        # the site (also regenerates the download zips)
npm run build      # production build → dist/
npm run preview
npm run pack       # rebuild public/downloads/*.zip only
```

## What is in here

| Path | What |
|---|---|
| `src/liquid-glass/` | **The library.** Self-contained: copy it into any Vite/React app (see its README). Has `index.d.ts` types |
| `src/site/` | The dev-tools page: navbar, hero, performance lab, component gallery, playground with code export, install guide, API reference, FAQ, footer |
| `kit/` | Template for the downloadable kit: `README.md`, `CHANGELOG.md`, runnable `examples/vite-react-starter` |
| `scripts/pack.mjs` | Builds `public/downloads/liquid-glass-kit.zip` and `liquid-glass-lib.zip` from `src/liquid-glass` + `kit/` (runs before `dev` and `build`) |
| `scripts/bench/` | `test-optics.mjs` (map generator equivalence) and `perf.py` (scroll benchmark, needs Python + Playwright) |

The "Download" buttons on the site serve the generated zips, so the kit users get is always built from the library
you see on the page (one source of truth).

## What changed in v2 (short)

Quality tiers + adaptive governor + refraction budget; filter region trimmed to the element; ring-only async maps;
no-op passes removed; CSS rim light; merged glass filters only its blobs (fixes backwards text above phone docks);
hydration-safe detection; TypeScript types; the page mounts only the selected gallery demo. Details and numbers:
`kit/CHANGELOG.md` and `src/liquid-glass/README.md` → *Performance*.

Measured on the original demo page with only the library swapped (headless Chrome 153, software GL, 4× CPU throttle,
median of 3): desktop scroll **13.4 → 38.7 fps**, phone emulation **19.2 → 33.4 fps**. These are relative numbers; a real
GPU is far faster. To reproduce: build the old and new variants, serve them, then
`python scripts/bench/perf.py <url> <label> 4 desktop|mobile`.

## Deploy

Static site: `npm run build`, deploy `dist/`. `vercel.json` rewrites everything to `index.html`. For a sub-path, set
`base` in `vite.config.js` (download links respect `import.meta.env.BASE_URL`).

## Notes

- Refraction needs a Chromium browser (`backdrop-filter: url(#svg)`); Safari/iOS and Firefox get the CSS glass look automatically.
- The original project ships without a LICENSE file and is based on Kube's article
  [Liquid Glass in the Browser](https://kube.io/blog/liquid-glass-css-svg). Check its terms before redistributing, and credit it.
  Independent recreation, not affiliated with Apple.
