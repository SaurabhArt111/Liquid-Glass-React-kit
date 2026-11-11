# liquid-glass

Glass UI components for React that **refract what's behind them**: switches, sliders, nav bars,
swipeable tab bars, and lenses that melt into each other. Plain JavaScript, plain CSS, one
dependency (`motion`).

## Quick start

```bash
npm i motion react react-dom        # peer dependencies
```

1. Copy this folder (`liquid-glass/`) into your project, e.g. `src/liquid-glass/`.
   (Or link it: `npm i ./path/to/liquid-glass`. It has its own `package.json`.)
2. Import what you need. The stylesheet is imported for you by `index.js`.

```jsx
import { LiquidSwitch, LiquidSlider, LiquidGlass } from "./liquid-glass";

<LiquidSwitch defaultChecked onChange={(on) => console.log(on)} />
<LiquidSlider defaultValue={40} onChange={setVolume} />
```

3. Put glass **over something with detail**. It refracts whatever is behind the element, so on a flat
   colour it just looks like tinted glass. Text, images, gradients and patterns all work.

No build plugin, no provider, no config.

## Which component do I want?

| I want… | Use |
|---|---|
| any glass panel / lens / button, draggable, with my own content | `LiquidGlass` |
| several shapes that melt into one body | `LiquidMerge` + `LiquidBlob` |
| two lenses that merge and split (autoplay + drag, fills its stage) | `LiquidSplitLens` |
| swipeable pages with a tab bar whose lens splits in two | `LiquidSwipeView` (`LiquidSwipeTabs` for just the bar) |
| mobile tab bar with a detached action button | `LiquidBottomNav` |
| mobile top bar | `LiquidTopNav` (+ `LiquidIconButton`) |
| fade where content slides under a floating bar | `LiquidScrollEdge` |
| segmented nav / tab bar / page nav with links | `LiquidNav` |
| on/off switch (any size, optional icons) | `LiquidSwitch` |
| day/night theme switch (sky + stars, glass thumb) | `LiquidThemeSwitch` |
| a tab icon that is liquid glass | `startLiquidFavicon` |
| slider · search field · button · magnifier | `LiquidSlider` · `LiquidSearchbox` · `LiquidButton` · `LiquidMagnifier` |

Every preset forwards extra props to the `LiquidGlass` it is built on, so any optical prop below can
be overridden (`<LiquidMagnifier magnify={80} />`).

## `LiquidGlass`

A regular `<div>`. Children render on top of the glass.

```jsx
const stage = useRef(null);

<div ref={stage} style={{ position: "relative" }}>
  <LiquidGlass draggable dragConstraints={stage} width={300} height={176} radius={38}
               style={{ position: "absolute", left: 40, top: 40 }}>
    …any JSX…
  </LiquidGlass>
</div>
```

`draggable` gives press-to-inflate, jelly squash & stretch from velocity, springy refraction, a
touch glow and a lifting shadow.

| Prop | Default | |
|---|---|---|
| `width`, `height` | `200`, `64` | px, **numbers** (the maps are rendered at this size) |
| `radius` | `height/2` | corner radius, clamped to half the shorter side |
| `bezelWidth` | ~30 % of shorter side | width of the curved rim |
| `glassThickness` | `70` | thicker = stronger bending |
| `refractiveIndex` | `1.5` | |
| `bezelType` | `"convex"` | `"convex"` \| `"circle"` \| `"concave"` \| `"lip"` |
| `variant` | `"regular"` | `"clear"` = see-through media glass; pair with `dim` |
| `dim` | `0` | 0–1 dark layer under the glass so content stays legible |
| `blur` | `0.2` | blur of the refracted backdrop (px) |
| `refraction` / `restRefraction` | `1` / `0.8×` | strength while active / at rest (0–1) |
| `dispersion` | `0.04` on `high` / `ultra`, `0` otherwise | rainbow fringe at the rim (0 = off) |
| `saturation` | `1.1` | colour boost of the refracted backdrop (1 = off) |
| `priority` | `0` | higher keeps refracting first when the tier's refraction budget is exceeded |
| `specularOpacity`, `specularSaturation` | `0.5`, `6` | light rim strength; the colour boost on the rim applies in the `ultra` tier (other tiers use `saturation`) |
| `magnify` / `restMagnify` | `0` / `0.5×` | zoom in the middle (0 = off) |
| `tint` / `activeTint` / `tintColor` | `0.05` / = `tint` / `"255,255,255"` | overlay alpha at rest / active, colour as `"r,g,b"` |
| `glow` | `0.5` | light that spreads from the touch point (0 = off) |
| `shadow` | `1` | shadow strength multiplier |
| `restScale` / `activeScale` | `1` / `1.1` | scale at rest / while pressed (spring) |
| `jelly` | `1` | squash & stretch from drag velocity (0 = off) |
| `active` | `false` | force the pressed look (`boolean` or `MotionValue`) |
| `holdMs` | `0` | keep the pressed look at least this long after release, so a very quick tap still plays the inflate (buttons use 320) |
| `draggable` | `false` | `true` \| `"x"` \| `"y"` (+ `dragConstraints`, `dragElastic`) |
| `x`, `y` | internal | pass your own `MotionValue`s to drive position |
| `fallbackBlur` | `3` (`0` with `magnify`) | blur in px where refraction isn't available |

Changing `width`, `height`, `radius`, `bezelWidth`, `glassThickness`, `refractiveIndex` or
`bezelType` regenerates the maps (cached). Everything else is driven by springs and never re-renders React.

## Presets at a glance

```jsx
<LiquidSwitch checked={on} onChange={setOn} />                          // height, onColor, offColor, startIcon, endIcon, holdMs
<LiquidThemeSwitch theme={theme} onChange={setTheme} />                  // "light" | "dark"
<LiquidSlider value={v} onChange={setV} min={0} max={100} step={1} />
<LiquidSearchbox width={420} onSubmit={(q) => search(q)} />
<LiquidButton onClick={inc}>Pressed</LiquidButton>
<LiquidMagnifier dragConstraints={stage} />
<LiquidNav items={items} value={tab} onChange={setTab} />                // items: [{ value, label, icon, href? }]

<LiquidTopNav title="Trip" leading={back} trailing={[next, prev]} />
<LiquidBottomNav items={tabs} value={tab} onChange={setTab} action={search} />
<LiquidScrollEdge position="top" radius={42} />   // pass the frame's corner radius so the blur doesn't leak into rounded corners
```

### Switch and theme switch

`LiquidSwitch` scales with `height`, takes `startIcon` / `endIcon`, and its thumb stays a liquid glass lens
for at least `holdMs` (default 480 ms) after **any** change: a tap, a key press or a change made from outside.
Even the quickest tap plays the full inflate, slide and settle, and rapid toggling keeps it glassy.
For custom designs it also takes `thumb={(progress) => node}` (content inside the thumb) and
`trackOff` / `trackOn` (scenery for the two states, cross-faded and refracted by the thumb).

`LiquidThemeSwitch` is built from exactly those: a sky with clouds and a night sky with stars in the track, and a
see-through glass thumb in which a sun morphs into a moon.

### Swipeable pages with a splitting lens

```jsx
<LiquidSwipeView
  width={328} height={588}
  pages={[
    { key: "photos", label: "Photos", icon: <PhotoIcon />, content: <Photos /> },
    { key: "map",    label: "Map",    icon: <MapIcon />,   content: <Map /> },
  ]}
  onIndexChange={(i) => …}
/>
```

Swipe the pages, tap a tab, or slide along the bar. The selection lens is two glass blobs in one merged
body: while the page moves they pull apart (a liquid neck stretches between them) and melt back into a
single lens when it settles. Control it with `index`, or use `LiquidSwipeTabs` with your own `progress`
MotionValue.

### Merging glass: `LiquidMerge` / `LiquidBlob`

```jsx
const box = useRef(null);
<LiquidMerge ref={box} width={560} height={280} smoothing={34}>
  <LiquidBlob left={80}  top={60} width={200} height={130} draggable dragConstraints={box} />
  <LiquidBlob left={380} top={80} width={110} height={110} draggable dragConstraints={box} />
</LiquidMerge>

<LiquidSplitLens auto />                            // ready-made pair; fills its position:relative parent
<LiquidSplitLens auto width={560} height={280} />   // …or give it a fixed size
```

The refraction map, rim light, shading and drop shadow come from the *smooth union* of the blobs' signed
distance fields, so nearby blobs grow a neck and refract as one piece of glass. `smoothing` and
`refraction` accept a MotionValue. The container is click-through; only blobs take input. Keep blobs
inside the container's box (glass is only drawn there), so give it the whole stage. `LiquidSplitLens` with no
`width`/`height` fills its parent and measures it (resize-aware); with `auto` it plays when scrolled into view,
stops when you grab a lens and resumes shortly after you let go.

## Theming

Everything is plain CSS variables; set them on any ancestor.

| Variable | Used by | Fallback |
|---|---|---|
| `--lg-nav-fg` | nav bars, top bar, icon buttons: text / icon colour | `#fff` |
| `--lg-nav-accent` | nav hover / focus ring | `currentColor` |
| `--lg-tab-fg`, `--lg-tab-accent` | tab bars (`LiquidBottomNav`, `LiquidSwipeTabs`): colour / selected colour | `#fff`, `#ff3b6b` |
| `--lg-fg` | `LiquidSearchbox` text | `rgba(255,255,255,.92)` |
| `--lg-switch-icon` | `LiquidSwitch` icons | `#fff` |

A bar that floats over arbitrary content should get a frosted backing so labels stay readable, e.g.
`tint={0.6} tintColor="255,255,255"` (light) or `tint={0.34} tintColor="12,16,40"` (dark).

## Favicon

```js
import { startLiquidFavicon } from "./liquid-glass";
startLiquidFavicon();            // two lenses melt together and split apart in the tab icon (~8 fps)
```

Draws the icon on a 64 px canvas with real refraction of a colourful tile, rainbow dispersion at the rim, rim
light and shadow, in about 1.5 ms per frame. Pauses while the tab is hidden, shows one still frame for
`prefers-reduced-motion`, and returns `stop()`. Keep a static `<link rel="icon">` in your HTML for the first paint.
`renderLiquidFavicon({ size, phase })` returns a single frame as a canvas (this is how the PNGs in `public/` were made).

## Performance

Glass is expensive: each refracting surface is a GPU filter over a moving backdrop. v2 is built to do as little
as possible while keeping the liquid shape (the Snell's-law bezel profile) identical in every tier.

### Quality tiers

| Tier | Gets | Default on |
|---|---|---|
| `ultra` | chromatic dispersion, rim light inside the SVG filter, 2.5× maps, 24 refracting surfaces | desktops with ≥ 12 cores |
| `high` | dispersion, CSS rim light, 2× maps, 12 surfaces | most desktops |
| `balanced` | no dispersion, 1.5× maps, 7 surfaces | phones, tablets, ≤ 4 cores |
| `low` | 1× maps, no blur pass, 3 surfaces | ≤ 2 cores or ≤ 2 GB |
| `css` | no SVG refraction, frosted CSS glass | explicit choice (cheapest) |

```js
import { configureLiquidGlass, setQuality, useQuality } from "./liquid-glass";

configureLiquidGlass({ quality: "auto" }); // once, before the first render. "auto" is the default
setQuality("balanced");                    // pin a tier any time ("auto" hands control back)
const [tier, profile] = useQuality();      // hook: re-renders when the tier changes
```

`?quality=ultra|high|balanced|low|css` in the URL pins a tier for comparison.

### Adaptive governor (`quality: "auto"`)

While the page is being scrolled or dragged, the governor samples real frame times (36-frame windows). Two bad
windows in a row (p75 > 30 ms) step one tier down (never below `low`; `css` is only ever explicit). Eight good
windows in a row (p75 < 18.5 ms) step back up, never above what the device was detected as. Decisions are
rate-limited (6 s after a step down, 15 s after a step up) so it cannot oscillate. When the page is quiet it
samples nothing: zero idle cost.

### Refraction budget

Only the N most important *visible* glass surfaces refract (N = the tier's budget). Importance = `priority` prop,
then area. Everything else renders the CSS glass look, so a page with 40 glass elements stays smooth.
`<LiquidGlass priority={5}>` marks the hero. `getGlassStats()` returns `{ total, visible, refracting, budget }`.

### What got cheaper (and how it was checked)

- **Filter region = the element.** SVG filters default to 120 % × 120 % of the box; now exactly the box.
- **Maps are computed on the bezel ring only** (the flat middle is neutral), checked pixel-for-pixel against the
  original generator for 6 shapes × 4 densities (`scripts/bench/test-optics.mjs` in the site repo).
- **Maps are encoded off the main thread** (`toBlob` → blob URL) at the tier's density instead of a fixed 3×.
  Until a map exists the surface shows the CSS glass (no flash of un-refracted content).
- **No-op passes are not emitted**: a 0.2 px blur is invisible but costs a full pass; dispersion (3 displacement
  passes) is per tier.
- **Rim light in CSS** (inset shadows): vector-sharp at any pixel density, no `feImage`/composite chain.
  `ultra` keeps the original in-filter rim.
- **Merged glass only filters the blobs' region.** `LiquidMerge`'s backdrop layer used to cover its whole container;
  on phones that made it wider than the screen, and Chromium mirrors page content at the viewport edge (backwards
  text above a dock). It now covers just the blobs plus the neck's reach: 6× fewer pixels on a phone dock.
- Off-screen glass drops its backdrop filter entirely; no `will-change` layers (Motion promotes only while animating).
- Prefer fewer, larger glass elements over many tiny ones; each refracting element is its own filter.

Measured on the original demo page with only the library swapped (headless Chrome, software GL, 4× CPU throttle,
median of 3): desktop scroll 13.4 → 38.7 fps, phone emulation 19.2 → 33.4 fps. Relative numbers: real GPUs are faster.

### If it still feels heavy

1. `setQuality("balanced")` or `"low"`: the shape stays, extras go.
2. Give heroes `priority`, and keep the number of simultaneously *visible* glass surfaces small.
3. Avoid animating the content *behind* glass (a moving backdrop forces the filter to re-run every frame).
4. `configureLiquidGlass({ mode: "css" })` for the cheapest look everywhere.

## Browser support

| Engine | What you get |
|---|---|
| **Chromium** (Chrome, Edge, Arc, Brave, Opera, Android Chrome) | Full refraction via `backdrop-filter: url(#svg)` |
| **WebKit** (Safari, and *every* browser on iPhone/iPad) | CSS glass look: light blur, rim light, sheen |
| Firefox | CSS glass look |

WebKit and Firefox can't run SVG filters in `backdrop-filter`, so there is no refraction there, but all
motion (drag, inflate, jelly, springs, merging) is JavaScript and is identical everywhere.

- `configureLiquidGlass({ mode, quality })` (call once, before the first render): `mode` is `"auto"` (default),
  `"refraction"` or `"css"` (forces the CSS look everywhere).
- `?glass=css` / `?glass=svg` in the URL forces a mode, handy for previewing the iOS look on desktop.
- `supportsSvgBackdrop()` and `isIOS()` are exported if you want to branch yourself.
- **SSR / Next.js:** components are hydration-safe (server and first client render both show CSS glass, Chromium then
  upgrades). Mount them in a client component (`"use client"`).

## TypeScript

`index.d.ts` ships in this folder: every component and the quality API are typed (`LiquidGlassProps`, `NavItem`, …).

## Accessibility

Switches are `role="switch"`, sliders `role="slider"` (arrows / Home / End), nav bars are
`navigation` / `radiogroup` / `tablist` with arrow-key support, buttons respond to Enter and Space.
With `prefers-reduced-motion` springs stop bouncing, jelly turns off, `LiquidSplitLens auto` stays still and the favicon shows one frame.

## Layout of this folder

```
index.js              the only file you import from
package.json          peer deps + export map (so the folder can be linked like a package)
styles/               liquid-glass.css (imported by index.js)
core/                 LiquidGlass, LiquidFilter, LiquidMerge (+ LiquidBlob)
components/           the presets (Nav, Switch, Slider, SwipeView, BottomNav, …) and icons
lib/                  optics (Snell's law, ring-only async maps), sdf (merged maps), quality tiers + governor, refraction budget, favicon, motion hook, utils
index.d.ts            TypeScript types
```
