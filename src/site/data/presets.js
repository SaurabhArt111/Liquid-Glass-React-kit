/* Playground presets: every key is a real <LiquidGlass> prop. */

export const BASE = {
  width: 260,
  height: 140,
  radius: 70,
  bezelWidth: 40,
  glassThickness: 90,
  refractiveIndex: 1.5,
  blur: 0.2,
  refraction: 1,
  specularOpacity: 0.5,
  magnify: 0,
  tint: 0.04,
  dispersion: 0.04,
  glow: 0.5,
  dim: 0,
  bezelType: "convex",
  variant: "regular",
};

export const PRESETS = [
  { id: "regular", label: "Regular", props: { ...BASE } },
  { id: "clear", label: "Clear media", props: { ...BASE, variant: "clear", tint: 0.01, dim: 0.14, refraction: 0.85, glassThickness: 80 } },
  { id: "magnifier", label: "Magnifier", props: { ...BASE, width: 240, height: 170, radius: 85, bezelWidth: 40, magnify: 48, glassThickness: 110, blur: 0 } },
  { id: "frosted", label: "Frosted bar", props: { ...BASE, width: 340, height: 72, radius: 36, bezelWidth: 26, blur: 3, tint: 0.16, glassThickness: 60, refraction: 0.7 } },
  { id: "orb", label: "Orb", props: { ...BASE, width: 170, height: 170, radius: 85, bezelWidth: 56, bezelType: "circle", glassThickness: 130, tint: 0.02 } },
  { id: "lip", label: "Lip", props: { ...BASE, width: 220, height: 96, radius: 48, bezelWidth: 34, bezelType: "lip", glassThickness: 100 } },
  { id: "dish", label: "Concave dish", props: { ...BASE, width: 240, height: 150, radius: 60, bezelType: "concave", glassThickness: 120, refraction: 0.9 } },
];

export const CONTROLS = {
  Shape: [
    ["width", 80, 380, 1],
    ["height", 48, 220, 1],
    ["radius", 0, 110, 1],
    ["bezelWidth", 4, 80, 1],
  ],
  Optics: [
    ["glassThickness", 10, 200, 1],
    ["refractiveIndex", 1, 2, 0.05],
    ["refraction", 0, 1, 0.01],
    ["magnify", 0, 80, 1],
    ["blur", 0, 10, 0.1],
    ["dispersion", 0, 0.15, 0.005],
    ["specularOpacity", 0, 1, 0.01],
  ],
  Surface: [
    ["tint", 0, 0.5, 0.01],
    ["dim", 0, 0.6, 0.02],
    ["glow", 0, 1, 0.05],
  ],
};

/** Turns a props object into copy-ready JSX, listing only what differs from the component defaults. */
const DEFAULTS = {
  width: 200,
  height: 64,
  glassThickness: 70,
  refractiveIndex: 1.5,
  blur: 0.2,
  refraction: 1,
  specularOpacity: 0.5,
  magnify: 0,
  tint: 0.05,
  glow: 0.5,
  dim: 0,
  bezelType: "convex",
  variant: "regular",
};

export function toJSX(p, { draggable = true } = {}) {
  const out = [];
  if (draggable) out.push("  draggable");
  out.push(`  width={${p.width}}`, `  height={${p.height}}`);
  for (const [k, v] of Object.entries(p)) {
    if (k === "width" || k === "height") continue;
    if (k === "dispersion") {
      if (v !== 0.04) out.push(`  dispersion={${v}}`);
    } else if (k === "radius") {
      if (v !== p.height / 2) out.push(`  radius={${v}}`);
    } else if (k === "bezelWidth") {
      if (v !== Math.round(Math.min(p.width, p.height) * 0.3)) out.push(`  bezelWidth={${v}}`);
    } else if (DEFAULTS[k] !== v) out.push(typeof v === "string" ? `  ${k}="${v}"` : `  ${k}={${v}}`);
  }
  return `<LiquidGlass\n${out.join("\n")}\n/>`;
}
