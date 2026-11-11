# Liquid Glass for React (Vite): kit v2.0

Glass UI components that **refract what is behind them**: switches, sliders, nav bars, swipeable tab bars and
lenses that melt into each other. Plain React + plain CSS, one runtime dependency (`motion`).

This kit is what you downloaded from the site's **Install** section.

```
liquid-glass-kit/
├─ README.md                 ← you are here
├─ CHANGELOG.md
├─ liquid-glass/             ← the library. Copy this folder into your app's src/
│  ├─ index.js · index.d.ts  the only file you import from (+ TypeScript types)
│  ├─ package.json           peer deps + export map
│  ├─ README.md              full API, quality tiers, theming, performance guide
│  └─ styles/ core/ components/ lib/
└─ examples/
   └─ vite-react-starter/    a runnable app that already uses the library
```

## 60-second start

### Option A: try the starter first

```bash
cd examples/vite-react-starter
npm install
npm run dev          # open the printed URL (use Chrome / Edge to see real refraction)
```

### Option B: add it to your own Vite + React app

```bash
# 1. copy the folder
cp -r liquid-glass-kit/liquid-glass  my-app/src/liquid-glass

# 2. install the one dependency (react / react-dom you already have)
cd my-app && npm i motion
```

```jsx
// 3. use it
import { LiquidGlass, LiquidSwitch, LiquidNav } from "./liquid-glass";

export default function App() {
  return (
    <div style={{ position: "relative", height: 360, background: "linear-gradient(135deg,#ff5f7e,#3f6bff)" }}>
      <h1 style={{ color: "#fff", fontSize: 72 }}>Glass that bends the page.</h1>
      <LiquidGlass draggable width={260} height={140} radius={70}
                   style={{ position: "absolute", left: 40, top: 120 }}>
        drag me
      </LiquidGlass>
    </div>
  );
}
```

That is the whole setup: no Vite plugin, no provider, no config. The stylesheet is imported by `index.js`.

> **Put glass over something with detail.** It refracts whatever is behind the element, so on a flat colour it only
> looks tinted. Text, images, gradients and patterns all bend nicely.

### TypeScript

Nothing to do: `liquid-glass/index.d.ts` is picked up automatically (`import { LiquidGlass, type LiquidGlassProps } from "./liquid-glass"`).

### Next.js / SSR

Mount glass in a client component (`"use client"`). It is hydration-safe: the server and the first client render show
the CSS glass look, then Chromium upgrades to real refraction.

## Components

| I want… | Use |
|---|---|
| any glass panel / lens / button, draggable, with my own content | `LiquidGlass` |
| several shapes that melt into one body | `LiquidMerge` + `LiquidBlob` |
| two lenses that merge and split (autoplay + drag) | `LiquidSplitLens` |
| swipeable pages with a tab bar whose lens splits in two | `LiquidSwipeView` |
| mobile tab bar with a detached action button | `LiquidBottomNav` |
| mobile top bar · icon button · scroll-edge fade | `LiquidTopNav` · `LiquidIconButton` · `LiquidScrollEdge` |
| segmented nav / tab bar / page nav with links | `LiquidNav` |
| on/off switch · day/night switch | `LiquidSwitch` · `LiquidThemeSwitch` |
| slider · search field · button · magnifier | `LiquidSlider` · `LiquidSearchbox` · `LiquidButton` · `LiquidMagnifier` |

Every preset forwards extra props to the `LiquidGlass` it is built on (`<LiquidMagnifier magnify={80} />`).
The complete prop table is in `liquid-glass/README.md`, and live on the site (Playground → *copy the code*).

## Performance: what you get for free

Glass is expensive, so v2 adapts to the device:

- **Quality tiers** `ultra · high · balanced · low · css`: detected from the device, same liquid shape in every tier.
- **Adaptive governor:** watches real frame times while you scroll/drag, steps down when slow, back up when it recovers.
- **Refraction budget:** only the most important *visible* surfaces refract; the rest get frosted CSS glass.
- Off-screen glass costs nothing; maps are generated off the main thread.

```js
import { configureLiquidGlass, setQuality } from "./liquid-glass";

configureLiquidGlass({ quality: "auto" });   // default. Call once, before the first render
setQuality("balanced");                      // or pin a tier at any time
```

Useful knobs: `<LiquidGlass priority={5}>` for your hero, `?quality=low` and `?glass=css` in the URL to preview tiers.
If it still feels heavy: avoid animating content *behind* glass, keep few glass surfaces visible at once, or use
`balanced` / `low`. Full guide: `liquid-glass/README.md` → *Performance*.

## Browser support

| Engine | Result |
|---|---|
| Chromium (Chrome, Edge, Arc, Brave, Opera, Android Chrome) | full refraction |
| Safari and every browser on iPhone/iPad (WebKit) | CSS glass look; all motion identical |
| Firefox | CSS glass look; all motion identical |

WebKit and Firefox cannot run SVG filters inside `backdrop-filter`, so refraction is Chromium-only. That is a browser
limit, not a setting.

## Accessibility

Switches are `role="switch"`, sliders `role="slider"` (arrows / Home / End), nav bars are `navigation` / `radiogroup` /
`tablist` with arrow keys. With `prefers-reduced-motion` springs stop bouncing, jelly turns off and autoplay stays still.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Glass looks like plain tinted blur | Browser isn't Chromium, or the backdrop is flat. Try `?glass=svg` in Chrome over a text/gradient background |
| `Failed to resolve import "motion/react"` | `npm i motion` |
| Choppy on a low-end device | `setQuality("low")` or `configureLiquidGlass({ mode: "css" })` |
| Backwards/mirrored text near a bar at the screen edge | Update to v2: the merged glass layer is now sized to its shapes |

## License and credits

The original project this kit descends from ships without a LICENSE file and is based on Kube's article
[Liquid Glass in the Browser: Refraction with CSS and SVG](https://kube.io/blog/liquid-glass-css-svg). **Check its terms
before redistributing, and credit it.** This is an independent recreation of the Liquid Glass look, not affiliated with Apple.
