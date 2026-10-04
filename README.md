# Liquid Glass for React (Vite)

Glass UI components that refract what's behind them, in plain React (JavaScript) and plain CSS.
Based on Kube's article
[Liquid Glass in the Browser: Refraction with CSS and SVG](https://kube.io/blog/liquid-glass-css-svg).

```bash
npm install
npm run dev      # the demo site
npm run build
```

## The library

Everything reusable is in **`src/liquid-glass/`**. It has its own `package.json` and
[README](src/liquid-glass/README.md) with the full API, theming variables, browser support and a
"which component do I want?" table. To use it in another project, copy that folder, add `motion`, and:

```jsx
import { LiquidSwitch, LiquidSwipeView, LiquidBottomNav } from "./liquid-glass";
```

## The demo (`src/demo/`)

Home · Kit · Split lens (autoplay + drag, full-stage) · Mobile split lens (swipe) · Any div · Playground · Usage, plus an
About page (`#/about`). On phones the navigation becomes a bottom tab bar. Light / dark theme via the
glass theme switch.

- `?glass=css` previews the iOS (non-refracting) look in any browser.
- The tab icon is a live liquid-glass favicon (`startLiquidFavicon`); static versions are in `public/`.
- The stage backgrounds use a hotlinked photo with gradient fallbacks underneath; self-host it by
  putting an image in `public/` and changing the URL in `src/demo/demo.css`.

## Notes

- The original project ships without a LICENSE file. Check its terms before redistributing, and credit it.
- This is an independent recreation of the Liquid Glass look, not affiliated with Apple.
