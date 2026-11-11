/**
 * Quality tiers + adaptive governor.
 *
 *   ultra     full fidelity: chromatic dispersion, specular rim inside the SVG filter, densest maps
 *   high      dispersion on, rim light drawn in CSS (vector-crisp, free), 2× maps          ← desktop default
 *   balanced  no dispersion, 1.5× maps, small refraction budget                           ← phones / tablets
 *   low       1× maps, no blur pass, tiny budget                                          ← weak devices
 *   css       no SVG refraction at all (frosted CSS glass, works everywhere, cheapest)
 *
 * The *shape* of the glass (the Snell's-law bezel profile that gives it the liquid look) is identical
 * in every tier. Tiers only trade away extras: fringe, rim-in-filter, map density, how many glass
 * surfaces may refract at the same time.
 *
 * With `quality: "auto"` (default) the governor watches real frame times while the page is
 * scrolling / being dragged and steps down when frames get slow, then back up when they recover.
 */

export const TIERS = ["css", "low", "balanced", "high", "ultra"];

export const PROFILES = {
  ultra: { mapDpr: 2.5, dispersion: true, rimInFilter: true, blurPass: true, budget: 24, moveBase: 1, moveMaxPx: 320000, idleMaxPx: 1600000 },
  high: { mapDpr: 2, dispersion: true, rimInFilter: false, blurPass: true, budget: 12, moveBase: 1, moveMaxPx: 260000, idleMaxPx: 1200000 },
  balanced: { mapDpr: 1.5, dispersion: false, rimInFilter: false, blurPass: true, budget: 7, moveBase: 0.85, moveMaxPx: 190000, idleMaxPx: 800000 },
  low: { mapDpr: 1, dispersion: false, rimInFilter: false, blurPass: false, budget: 3, moveBase: 0.6, moveMaxPx: 90000, idleMaxPx: 400000 },
  css: { mapDpr: 1, dispersion: false, rimInFilter: false, blurPass: false, budget: 0, moveBase: 0.6, moveMaxPx: 90000, idleMaxPx: 400000 },
};

const listeners = new Set();
let pinned; // tier chosen by the app / URL (disables the governor)
let detected; // best tier for this device (ceiling for auto mode)
let current; // tier in effect
let version = 0;

const hasWindow = typeof window !== "undefined";
const dpr = () => (hasWindow ? window.devicePixelRatio || 1 : 1);

export function detectQuality() {
  if (typeof navigator === "undefined") return "balanced";
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  if (cores <= 2 || mem <= 2) return "low";
  if (coarse || cores <= 4 || mem <= 4) return "balanced";
  return cores >= 12 && mem >= 8 && !coarse ? "ultra" : "high";
}

function urlTier() {
  if (!hasWindow) return null;
  const q = new URLSearchParams(window.location.search).get("quality");
  return PROFILES[q] ? q : null;
}

function init() {
  if (current) return;
  detected = detectQuality();
  pinned = urlTier() || undefined;
  current = pinned || detected;
}

function emit() {
  version++;
  listeners.forEach((l) => l());
}

/** "auto" lets the governor adapt; a tier name pins it. */
export function setQuality(name) {
  init();
  if (name === "auto" || !name) {
    pinned = undefined;
    current = detected;
  } else if (PROFILES[name]) {
    pinned = name;
    current = name;
  } else return;
  emit();
}

export function getQualityName() {
  init();
  return current;
}
export function getQuality() {
  return PROFILES[getQualityName()];
}
export function isAutoQuality() {
  init();
  return !pinned;
}
export function getDetectedQuality() {
  init();
  return detected;
}
export function subscribeQuality(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
/** snapshot for useSyncExternalStore */
export function getQualityVersion() {
  return version;
}

/* ------------------------------ resolutions ------------------------------ */

/** density of the displacement map: follows the tier, never above the screen's own density */
export function mapDprFor(profile = getQuality()) {
  return Math.max(1, Math.min(profile.mapDpr, Math.ceil(dpr() * 2) / 2));
}
/** canvas px per css px while merged glass is moving */
export function moveScaleFor(profile = getQuality()) {
  return Math.max(0.7, Math.min(2, dpr()) * profile.moveBase);
}
/** canvas px per css px for the settled, sharp pass */
export function idleScaleFor(profile = getQuality()) {
  return Math.max(1.5, Math.min(3, dpr())) * (profile.moveBase < 0.7 ? 0.75 : 1);
}
export function moveFloorFor() {
  return Math.max(1, Math.min(2, dpr()) * 0.5);
}

/* -------------------------------------------------------------------------- */
/* Governor: adapts the tier to *measured* smoothness                          */
/* -------------------------------------------------------------------------- */

const gov = {
  raf: 0,
  last: 0,
  frames: [],
  badWindows: 0,
  goodWindows: 0,
  idleTimer: 0,
  lockUntil: 0,
  running: false,
  fps: 60,
  onSample: null,
};

const WINDOW = 36; // frames per decision
const QUIET_MS = 1200; // stop sampling this long after the last interaction

function step(now) {
  gov.raf = 0;
  if (!gov.running) return;
  if (gov.last) {
    const dt = now - gov.last;
    // ignore stalls from tab switches / debugger pauses
    if (dt < 250) gov.frames.push(dt);
  }
  gov.last = now;
  if (gov.frames.length >= WINDOW) decide();
  gov.raf = requestAnimationFrame(step);
}

function decide() {
  const f = gov.frames.splice(0).sort((a, b) => a - b);
  const p75 = f[Math.floor(f.length * 0.75)];
  const avg = f.reduce((a, b) => a + b, 0) / f.length;
  gov.fps = Math.round(1000 / avg);
  gov.onSample?.({ fps: gov.fps, p75, tier: current });
  if (pinned || performance.now() < gov.lockUntil) return;

  const idx = TIERS.indexOf(current);
  if (p75 > 30) {
    gov.goodWindows = 0;
    if (++gov.badWindows >= 2 && idx > 1) {
      // never auto-drop to "css": that is an explicit choice (low is the floor)
      current = TIERS[idx - 1];
      gov.badWindows = 0;
      gov.lockUntil = performance.now() + 6000; // let it settle before judging again
      emit();
    }
  } else if (p75 < 18.5) {
    gov.badWindows = 0;
    if (++gov.goodWindows >= 8 && TIERS.indexOf(detected) > idx) {
      current = TIERS[idx + 1];
      gov.goodWindows = 0;
      gov.lockUntil = performance.now() + 15000;
      emit();
    }
  } else gov.badWindows = gov.goodWindows = 0;
}

function poke() {
  if (!gov.running) return;
  clearTimeout(gov.idleTimer);
  if (!gov.raf) {
    gov.last = 0;
    gov.raf = requestAnimationFrame(step);
  }
  gov.idleTimer = setTimeout(() => {
    // quiet: stop sampling (zero idle cost, no battery drain)
    cancelAnimationFrame(gov.raf);
    gov.raf = 0;
    gov.frames.length = 0;
  }, QUIET_MS);
}

/** Starts the governor once (idempotent). Called by the first glass element that mounts. */
export function startGovernor() {
  if (gov.running || !hasWindow) return;
  init();
  gov.running = true;
  const opts = { passive: true, capture: true };
  ["scroll", "pointermove", "pointerdown", "wheel", "touchmove", "keydown"].forEach((e) => window.addEventListener(e, poke, opts));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(gov.raf);
      gov.raf = 0;
    }
  });
  poke();
}

/** subscribe to per-window fps samples (for the performance HUD) */
export function onGovernorSample(fn) {
  gov.onSample = fn;
  return () => {
    if (gov.onSample === fn) gov.onSample = null;
  };
}
/** wake the sampler (e.g. while a long autoplay animation runs) */
export function keepSampling() {
  poke();
}
