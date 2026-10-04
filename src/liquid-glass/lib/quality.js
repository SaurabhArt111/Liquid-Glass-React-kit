/**
 * Quality profiles. Refraction is GPU/CPU heavy, so weaker devices (phones, ≤4 cores, ≤4 GB)
 * default to "balanced": cheaper maps and no chromatic dispersion (which triples the displacement
 * work of every glass element). Override with configureLiquidGlass({ quality }).
 */
export const PROFILES = {
  high: { mapDpr: 2, moveScale: 0.75, idleScale: 2, moveMaxPx: 140000, idleMaxPx: 420000, dispersion: true },
  balanced: { mapDpr: 1.5, moveScale: 0.55, idleScale: 1.25, moveMaxPx: 80000, idleMaxPx: 200000, dispersion: false },
  low: { mapDpr: 1, moveScale: 0.4, idleScale: 1, moveMaxPx: 45000, idleMaxPx: 90000, dispersion: false },
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
  return current ?? (current = detectQuality());
}

export function getQuality() {
  return PROFILES[getQualityName()];
}
