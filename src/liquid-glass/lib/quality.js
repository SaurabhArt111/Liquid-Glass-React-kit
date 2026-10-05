/**
 * Quality profiles.
 *
 * Resolution follows the device's pixel density — glass must be crisp on a 3× phone screen — so the
 * profiles only differ in *budgets*: how many pixels merged glass may draw per frame, and whether the
 * (costly) chromatic dispersion is on (only "high" has it). Weak devices ("low": ≤ 2 cores / ≤ 2 GB) also get lower resolution.
 * Merged glass additionally steps its resolution down automatically if frames genuinely get slow, and
 * back up when they recover, so a fast phone is never penalised for a slow one.
 */
export const PROFILES = {
  high: { mapDpr: 3, moveBase: 1, moveMaxPx: 320000, idleMaxPx: 1600000, dispersion: true },
  balanced: { mapDpr: 3, moveBase: 0.85, moveMaxPx: 220000, idleMaxPx: 1200000, dispersion: false },
  low: { mapDpr: 2, moveBase: 0.6, moveMaxPx: 90000, idleMaxPx: 450000, dispersion: false },
};

let current;

export function detectQuality() {
  if (typeof navigator === "undefined") return "balanced";
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  if (cores <= 2 || mem <= 2) return "low";
  return coarse || cores <= 4 || mem <= 4 ? "balanced" : "high";
}

export function setQuality(name) {
  current = PROFILES[name] ? name : undefined;
}

export function getQualityName() {
  if (current) return current;
  // dev override: ?quality=high | balanced | low
  const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("quality") : null;
  return (current = PROFILES[q] ? q : detectQuality());
}

export function getQuality() {
  return PROFILES[getQualityName()];
}

const dpr = () => (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);

/** canvas px per css px while glass is moving (cheap, but still close to native sharpness) */
export function moveScaleFor(profile = getQuality()) {
  return Math.max(0.7, Math.min(2, dpr()) * profile.moveBase);
}

/** canvas px per css px for the settled, sharp pass: the device's real pixel density */
export function idleScaleFor(profile = getQuality()) {
  return Math.max(1.5, Math.min(3, dpr())) * (profile.moveBase < 0.7 ? 0.75 : 1);
}

/** the lowest resolution the adaptive step-down may reach while moving: about half the display density */
export function moveFloorFor() {
  return Math.max(1, Math.min(2, dpr()) * 0.5);
}
