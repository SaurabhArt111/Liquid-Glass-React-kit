# Liquid Glass for React

A reusable, draggable **liquid glass** primitive for React + Vite, plus ready-made
Magnifier, Searchbox, Switch, Slider and Button. Pure JavaScript (no TypeScript),
plain CSS (no Tailwind). The only runtime dependency besides React is
[`motion`](https://motion.dev) (springs, drag, MotionValues).

Based on Kube's article *"Liquid Glass in the Browser: Refraction with CSS and SVG"*.
The optics (Snell's-law bezel profile → displacement map → specular rim) are ported
from that project; the build-time Node `canvas` + Vite virtual-module pipeline was
replaced by **runtime generation in the browser**, so there is nothing to configure.

```bash
npm install
npm run dev
```

## Use it in your own project

1. `npm i motion react react-dom`
2. Copy the `src/liquid-glass/` folder into your app.
3. Import from it (the CSS is imported by the folder's `index.js`):

```jsx
import { LiquidGlass, LiquidSwitch, LiquidSlider, LiquidSearchbox,
         LiquidMagnifier, LiquidButton } from "./liquid-glass";
```

The glass **refracts whatever is behind it**, so place it over something with
detail (text, images, gradients, patterns). Over a flat colour it will look like
plain tinted glass.

## `<LiquidGlass>` — the primitive

A regular `<div>`. Children render on top of the glass.

```jsx
const stage = useRef(null);

<div ref={stage} style={{ position: "relative" }}>
  <LiquidGlass
    draggable
    dragConstraints={stage}
    width={300}
    height={176}
    radius={38}
    style={{ position: "absolute", left: 40, top: 40 }}
  >
    <div>…any JSX…</div>
  </LiquidGlass>
</div>
```

| Prop | Default | |
|---|---|---|
| `width`, `height` | `200`, `64` | px, **numbers** (the maps are rendered at this size) |
| `radius` | `height/2` | corner radius; clamped to half the shorter side |
| `bezelWidth` | ~30 % of shorter side | width of the curved rim |
| `glassThickness` | `70` | thicker = stronger bending |
| `refractiveIndex` | `1.5` | |
| `bezelType` | `"convex"` | `"convex"` \| `"circle"` \| `"concave"` \| `"lip"` |
| `blur` | `0.2` | blur of the refracted backdrop (px) |
| `refraction` / `restRefraction` | `1` / `0.8×` | strength while active / at rest (0–1) |
| `specularOpacity`, `specularSaturation` | `0.5`, `6` | light rim + colour boost on it |
| `fallbackBlur` | `3` (`0` if `magnify`) | blur in px where SVG refraction isn't available |
| `magnify` / `restMagnify` | `0` / `0.5×` | zoom in the middle (0 = off) |
| `tint` / `activeTint` | `0.05` / = `tint` | overlay alpha at rest / active |
| `tintColor` | `"255,255,255"` | overlay colour as `"r,g,b"` |
| `shadow` | `1` | shadow strength multiplier |
| `restScale` / `activeScale` | `1` / `1.1` | scale at rest / while pressed (spring, bouncy) |
| `jelly` | `1` | squash & stretch from drag velocity (`0` = off) |
| `active` | `false` | force the pressed look (`boolean` or `MotionValue`) |
| `onPressChange(bool)` | | |
| `draggable` | `false` | `true` \| `"x"` \| `"y"` |
| `dragConstraints`, `dragElastic` | – / `0.13` | forwarded to motion |
| `x`, `y` | internal | pass your own `MotionValue`s to drive position |
| `className`, `style`, `...rest` | | forwarded to the root `motion.div` |

Numbers that change *geometry or optics* (`width`, `height`, `radius`, `bezelWidth`,
`glassThickness`, `refractiveIndex`, `bezelType`) regenerate the maps (cached).
Everything else is driven by springs and never re-renders React.

## Presets

```jsx
<LiquidSwitch checked={on} onChange={setOn} onColor="#3BBF4E" offColor="#94949F" />
<LiquidSlider value={v} onChange={setV} min={0} max={100} step={1} width={330} color="#0377F7" />
<LiquidSearchbox width={420} placeholder="Search" onSubmit={(q) => search(q)} />
<LiquidButton onClick={inc}>Pressed</LiquidButton>
<LiquidNav items={tabs} value={tab} onChange={setTab} />
<LiquidThemeSwitch theme={theme} onChange={setTheme} />
<LiquidMagnifier dragConstraints={stageRef} style={{ position: "absolute", left: 40, top: 40 }} />
```

Every preset spreads extra props onto `LiquidGlass`, so you can override any of the
optics (e.g. `<LiquidMagnifier magnify={80} width={260} />`). `LiquidSwitch` and
`LiquidSlider` are controlled or uncontrolled (`defaultChecked` / `defaultValue`)
and keyboard accessible (`role="switch"` / `role="slider"`).

### `LiquidNav` / `LiquidThemeSwitch`

A glass bar with a glass lens that slides to the selected item (spring overshoot +
velocity-based jelly). Tap an item, or grab the lens and drag; it snaps to the nearest
item on release. Labels are drawn above the lens so icons and text stay crisp.

```jsx
const items = [
  { value: "home", label: "Home", icon: <HomeIcon /> },
  { value: "saved", label: "Saved", icon: <HeartIcon /> },
];
<LiquidNav items={items} value={tab} onChange={setTab} itemWidth={88} height={68} />

// with href → renders <a> links in role="navigation" (used for the page's top bar)
<LiquidNav items={[{ value: "kit", label: "Kit", href: "#kit" }]} value={id} onChange={go} />

<LiquidThemeSwitch theme="light" onChange={setTheme} />   // sun / moon
```

Text colour comes from `--lg-nav-fg` (hover: `--lg-nav-accent`). A bar that floats over
arbitrary content should get a frosted backing so labels stay readable, e.g.
`tint={0.6} tintColor="255,255,255"` (light) or `tint={0.34} tintColor="12,16,40"` (dark).
`tintColor` is available on every `LiquidGlass`. Keyboard: ← → on radio-mode bars.

## Browser support

| Engine | What you get |
|---|---|
| **Chromium** (Chrome, Edge, Arc, Brave, Opera, Android Chrome) | Full refraction: `backdrop-filter: url(#svg)` |
| **WebKit** (Safari, and *every* browser on iPhone/iPad, incl. Chrome/Edge for iOS) | CSS-only glass look |
| Firefox | CSS-only glass look |

WebKit can't run SVG filters inside `backdrop-filter` yet (there is an open WebKit change for it,
but it hasn't shipped), so true refraction/magnification is impossible on iOS today. Instead of
a plain blur, the fallback builds the glass feel from: a light blur + saturation/brightness boost
(no blur at all on magnifier lenses, so they stay sharp), layered inset rim lighting, a diagonal
sheen, and the same specular-edge map used by the refraction path. All motion (drag, press
inflate, jelly, springs) is JavaScript and is identical on every browser.

- `?glass=css` in the URL forces the fallback on any browser (preview the iOS look on desktop);
  `?glass=svg` forces refraction.
- `fallbackBlur` prop (px) sets the fallback blur per component (default `3`, `0` for magnifiers;
  `LiquidNav` uses `8` on the bar so labels stay readable).
- `supportsSvgBackdrop()` and `isIOS()` are exported if you want to branch yourself.

## Files

```
src/liquid-glass/
  index.js                    public exports (+ imports the CSS)
  liquid-glass.css            component styles
  LiquidGlass.jsx             the primitive: springs, jelly, drag, shadow
  LiquidFilter.jsx            SVG filter (refraction → saturation → specular)
  lib/optics.js               Snell's law + displacement/specular/magnify maps (browser canvas)
  lib/surfaces.js             bezel profiles
  lib/utils.js                useMv (number|MotionValue), Chromium detection
  components/                 Magnifier, Searchbox, Switch, Slider, Button, Nav, ThemeSwitch
src/demo/                     the demo page: top bar, light/dark theme, kit, playground
```

## Notes

- The original project ships without a LICENSE file. If you plan to publish or
  redistribute this, check the upstream repository's terms and credit the author.
- Maps are generated at ≥2× device pixel ratio for crisp bezel edges.
