/* Reference data for the API table (kept next to the site so the docs can't drift from the page). */

export const GLASS_PROPS = [
  // geometry
  ["width", "number", "200", "Geometry", "Width in px. A number: the maps are rendered at this size."],
  ["height", "number", "64", "Geometry", "Height in px."],
  ["radius", "number", "height / 2", "Geometry", "Corner radius, clamped to half the shorter side."],
  ["bezelWidth", "number", "≈ 30 % of the shorter side", "Geometry", "Width of the curved rim that bends light."],
  // optics
  ["glassThickness", "number", "70", "Optics", "Thicker glass bends light more."],
  ["refractiveIndex", "number", "1.5", "Optics", "Index of refraction used in Snell's law (1 – 2)."],
  ["bezelType", '"convex" | "circle" | "concave" | "lip"', '"convex"', "Optics", "Shape of the rim's height profile."],
  ["variant", '"regular" | "clear"', '"regular"', "Optics", "`clear` is see-through media glass; pair it with `dim`."],
  ["refraction", "0 – 1", "1", "Optics", "Refraction strength while pressed / active."],
  ["restRefraction", "0 – 1", "0.8 × refraction", "Optics", "Refraction strength at rest."],
  ["magnify", "number", "0", "Optics", "Zoom in the middle of the lens (0 = off)."],
  ["blur", "number (px)", "0.2", "Optics", "Blur of the refracted backdrop. Below 0.3 px no blur pass is added to the filter."],
  ["dispersion", "number", "0.04 on high / ultra, else 0", "Optics", "Rainbow fringe at the rim. Triples the filter's displacement work, so only the top tiers enable it."],
  ["saturation", "number", "1.1", "Optics", "Colour boost of the refracted backdrop (1 = off)."],
  ["specularOpacity", "0 – 1", "0.5", "Optics", "Strength of the light rim."],
  // surface
  ["tint", "0 – 1", "0.05", "Surface", "Overlay alpha at rest."],
  ["activeTint", "0 – 1", "= tint", "Surface", "Overlay alpha while pressed."],
  ["tintColor", '"r,g,b"', '"255,255,255"', "Surface", "Overlay colour."],
  ["dim", "0 – 1", "0", "Surface", "Dark layer under the glass so content stays legible."],
  ["glow", "0 – 1", "0.5", "Surface", "Light that spreads from the touch point (0 = off)."],
  ["shadow", "number", "1", "Surface", "Shadow strength multiplier."],
  ["fallbackBlur", "number (px)", "3 (0 with magnify)", "Surface", "Blur used where refraction is unavailable (Safari, Firefox, `css` tier, over budget)."],
  // motion
  ["restScale / activeScale", "number", "1 / 1.1", "Motion", "Spring scale at rest / while pressed."],
  ["jelly", "number", "1", "Motion", "Squash and stretch from drag velocity (0 = off). Forced to 0 with reduced motion."],
  ["holdMs", "number", "0", "Motion", "Keep the pressed look at least this long after release."],
  ["active", "boolean | MotionValue", "false", "Motion", "Force the pressed look."],
  ["draggable", 'boolean | "x" | "y"', "false", "Motion", "Enable dragging (+ `dragConstraints`, `dragElastic`)."],
  // perf
  ["priority", "number", "0", "Performance", "Higher keeps refracting first when more glass is visible than the tier's budget allows."],
];

export const COMPONENTS = [
  ["LiquidGlass", "Any glass panel, lens or button. A regular div; children render on top.", "<LiquidGlass draggable width={300} height={176} />"],
  ["LiquidMerge + LiquidBlob", "Several shapes that melt into one liquid body.", "<LiquidMerge><LiquidBlob … /></LiquidMerge>"],
  ["LiquidSplitLens", "Two lenses that merge and split, autoplay + drag.", "<LiquidSplitLens auto />"],
  ["LiquidSwipeView / LiquidSwipeTabs", "Swipeable pages with a splitting selection lens.", "<LiquidSwipeView pages={…} />"],
  ["LiquidNav", "Segmented nav / tab bar with a sliding lens. Links or radio buttons.", "<LiquidNav items={items} value={tab} onChange={setTab} />"],
  ["LiquidBottomNav · LiquidTopNav · LiquidIconButton", "Mobile bars, with a detached action button.", "<LiquidBottomNav items={tabs} action={search} />"],
  ["LiquidScrollEdge", "Fade where content slides under a floating bar.", '<LiquidScrollEdge position="top" />'],
  ["LiquidSwitch · LiquidThemeSwitch", "On/off and day/night switches.", "<LiquidSwitch checked={on} onChange={setOn} />"],
  ["LiquidSlider · LiquidSearchbox · LiquidButton · LiquidMagnifier", "Controls built on LiquidGlass.", "<LiquidSlider value={v} onChange={setV} />"],
];

export const UTILS = [
  ["setQuality(tier)", '"auto" | "ultra" | "high" | "balanced" | "low" | "css". Pins a tier, or hands control back to the governor with "auto".'],
  ["configureLiquidGlass({ mode, quality })", 'Call once before the first render. `mode`: "auto" | "refraction" | "css".'],
  ["useQuality()", "Hook: `[tierName, profile]`, re-renders when the tier changes."],
  ["getGlassStats()", "`{ total, visible, refracting, budget }`, for a performance HUD."],
  ["onGovernorSample(fn)", "Receives `{ fps, p75, tier }` every ~36 sampled frames while the page is active."],
  ["supportsSvgBackdrop() · isIOS()", "Feature checks, if you want to branch yourself."],
  ["startLiquidFavicon()", "A tab icon that is liquid glass."],
];

export const CSS_VARS = [
  ["--lg-nav-fg", "Nav / top bar / icon button text and icon colour", "#fff"],
  ["--lg-nav-accent", "Nav hover and focus ring", "currentColor"],
  ["--lg-tab-fg · --lg-tab-accent", "Tab bars: colour / selected colour", "#fff · #ff3b6b"],
  ["--lg-fg", "Searchbox text", "rgba(255,255,255,.92)"],
  ["--lg-switch-icon", "Switch icons", "#fff"],
];

export const TIER_TABLE = [
  ["ultra", "Dispersion, rim light inside the SVG filter, 2.5× maps, 24 surfaces", "Desktops with ≥ 12 cores"],
  ["high", "Dispersion, CSS rim light, 2× maps, 12 surfaces", "Most desktops"],
  ["balanced", "No dispersion, 1.5× maps, 7 surfaces", "Phones, tablets, ≤ 4 cores"],
  ["low", "1× maps, no blur pass, 3 surfaces", "≤ 2 cores or ≤ 2 GB"],
  ["css", "No SVG refraction; frosted CSS glass everywhere", "Cheapest; always available"],
];
