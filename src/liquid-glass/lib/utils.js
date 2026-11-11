import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { getQuality, getQualityName, getQualityVersion, setQuality, startGovernor, subscribeQuality } from "./quality.js";
import { isMotionValue, useMotionValue } from "motion/react";

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/** Accept `number | MotionValue<number>` and always hand back a MotionValue. */
export function useMv(value) {
  const own = useMotionValue(isMotionValue(value) ? 0 : value);
  useEffect(() => {
    if (!isMotionValue(value)) own.set(value);
  }, [value, own]);
  return isMotionValue(value) ? value : own;
}

let chromiumCache;
let modeOverride; // set by configureLiquidGlass()

/**
 * Global switch. Call once, before the first render.
 *   mode:    "auto" (default) → refraction on Chromium, CSS glass elsewhere
 *            "refraction"     → always use SVG refraction
 *            "css"            → always use the CSS-only glass (cheapest, works everywhere)
 *   quality: "auto" (default: detected from the device and adapted to measured frame times) or a fixed tier:
 *            "ultra" | "high" | "balanced" | "low" | "css". Lower = cheaper maps, no dispersion, smaller refraction budget.
 */
export function configureLiquidGlass({ mode, quality } = {}) {
  if (mode) modeOverride = mode;
  if (quality) setQuality(quality);
  chromiumCache = undefined;
}
/**
 * `backdrop-filter: url(#svg-filter)` is only implemented by Chromium
 * (Chrome, Edge, Arc, Brave, Opera…). WebKit — Safari and *every* browser on
 * iPhone/iPad — and Firefox ignore it, so there we switch to a CSS-only glass
 * look (light blur + rim lighting + sheen) instead of real refraction.
 *
 * Dev override: add `?glass=css` to the URL to force the fallback (preview the
 * iOS look on desktop) or `?glass=svg` to force refraction.
 */
export function supportsSvgBackdrop() {
  if (chromiumCache !== undefined) return chromiumCache;
  if (typeof navigator === "undefined") return (chromiumCache = false);
  const forced = new URLSearchParams(window.location.search).get("glass");
  if (forced === "css" || modeOverride === "css") return (chromiumCache = false);
  if (forced === "svg" || modeOverride === "refraction") return (chromiumCache = true);
  const brands = navigator.userAgentData?.brands;
  chromiumCache = brands
    ? brands.some((b) => b.brand === "Chromium")
    : /Chrome\//.test(navigator.userAgent) && !/Edge?\/|Firefox|CriOS|FxiOS/.test(navigator.userAgent);
  return chromiumCache;
}

/** iPhone / iPad (including iPadOS, which reports a Mac user agent). */
export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** true while the element is within `margin` px of the viewport. Glass off-screen costs nothing. */
export function useNearViewport(ref, margin = 240) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: `${margin}px` });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return near;
}

/** Measured content size of an element ({ width, height }, 0 until measured). */
export function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      setSize((p) => (p.width === w && p.height === h ? p : { width: w, height: h }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Use an internal ref and still honour a forwarded one. */
export function useForwardedRef(forwarded) {
  const inner = useRef(null);
  const set = useCallback(
    (node) => {
      inner.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded],
  );
  return [inner, set];
}


/** Re-renders when the quality tier changes (device detection, governor step, or `setQuality`). */
export function useQuality() {
  useSyncExternalStore(subscribeQuality, getQualityVersion, getQualityVersion);
  return [getQualityName(), getQuality()];
}

/* -------------------------------------------------------------------------- */
/* Refraction budget: only the N most important visible glass surfaces refract  */
/* -------------------------------------------------------------------------- */

const slots = new Map(); // id -> { near, area, priority }
const slotSubs = new Set();
let allowed = new Set();
const sameSet = (a, b) => a.size === b.size && [...a].every((v) => b.has(v));

function recompute() {
  const budget = getQuality().budget;
  const live = [...slots].filter(([, e]) => e.near).sort((a, b) => b[1].priority - a[1].priority || b[1].area - a[1].area);
  const next = new Set(live.slice(0, budget).map(([id]) => id));
  stats = { total: slots.size, visible: live.length, refracting: next.size, budget };
  statSubs.forEach((f) => f());
  if (sameSet(next, allowed)) return;
  allowed = next;
  slotSubs.forEach((f) => f());
}

let stats = { total: 0, visible: 0, refracting: 0, budget: 0 };
const statSubs = new Set();
/** Live counters for a performance HUD: glass surfaces mounted / near the viewport / currently refracting. */
export function getGlassStats() {
  return stats;
}
export function subscribeGlassStats(fn) {
  statSubs.add(fn);
  return () => statSubs.delete(fn);
}
subscribeQuality(recompute);

/**
 * Registers a glass surface. Returns `near` (is it close to the viewport) and `refract`
 * (is it inside the refraction budget). Surfaces outside the budget fall back to CSS glass.
 */
export function useGlassSlot(ref, { area = 0, priority = 0 } = {}) {
  const id = useId();
  const near = useNearViewport(ref);
  useEffect(() => {
    startGovernor();
  }, []);
  useEffect(() => {
    slots.set(id, { near, area, priority });
    recompute();
    return () => {
      slots.delete(id);
      recompute();
    };
  }, [id, near, area, priority]);
  const refract = useSyncExternalStore(
    (f) => (slotSubs.add(f), () => slotSubs.delete(f)),
    () => allowed.has(id),
    () => false,
  );
  return { near, refract };
}
