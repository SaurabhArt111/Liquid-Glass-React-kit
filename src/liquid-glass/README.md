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
| `dispersion` | `0.04` on `high` quality, `0` otherwise | rainbow fringe at the rim (0 = off) |
| `specularOpacity`, `specularSaturation` | `0.5`, `6` | light rim + colour boost on it |
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

Glass is expensive, so the kit is built to do as little as possible:

- **Quality profiles.** `configureLiquidGlass({ quality: "high" | "balanced" | "low" })`, detected from the device by
  default (touch screens and ≤ 4 cores / ≤ 4 GB → `balanced`; ≤ 2 cores / ≤ 2 GB → `low`). **Resolution always follows
  the screen's pixel density**: glass is crisp on a 3× phone. The tiers differ only in budgets and in chromatic
  dispersion (only `high` has it, since it triples each element's filter work). `?quality=low|balanced|high` in the URL
  switches tier for comparison.
- **Off-screen glass is free.** Every glass element drops its backdrop filter while it is more than ~240 px
  outside the viewport (and `LiquidMerge` stops drawing).
- **Merged glass only draws what it covers.** `LiquidMerge` works inside the bounding box of its blobs, never the
  whole container, so it can fill a large stage. Moving glass draws at close to display density (≈ 2–6 ms a frame on a laptop) and re-renders once at the full
  density, when the browser is idle, 90 ms after things stop. The shade is painted onto a canvas, so
  nothing is encoded to an image except the displacement map. If frames get clearly slow it steps its resolution down, never below about half the display density, and recovers when it can.
- No `will-change` layers: Motion promotes elements only while they animate.
- Prefer fewer, larger glass elements over many tiny ones; each refracting element is its own filter.

## Browser support

| Engine | What you get |
|---|---|
| **Chromium** (Chrome, Edge, Arc, Brave, Opera, Android Chrome) | Full refraction via `backdrop-filter: url(#svg)` |
| **WebKit** (Safari, and *every* browser on iPhone/iPad) | CSS glass look: light blur, rim light, sheen |
| Firefox | CSS glass look |

WebKit and Firefox can't run SVG filters in `backdrop-filter`, so there is no refraction there, but all
motion (drag, inflate, jelly, springs, merging) is JavaScript and is identical everywhere.

- `configureLiquidGlass({ mode, quality })` (call once, before the first render): `mode` is `"auto"` (default),
  `"refraction"` or `"css"` (cheapest; forces the CSS look everywhere); `quality` is described under Performance.
- `?glass=css` / `?glass=svg` in the URL forces a mode, handy for previewing the iOS look on desktop.
- `supportsSvgBackdrop()` and `isIOS()` are exported if you want to branch yourself.

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
lib/                  optics (Snell's law, maps), sdf (merged maps), quality profiles, favicon, motion hook, utils
```
