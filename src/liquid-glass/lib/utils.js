import { useEffect } from "react";
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
  if (forced === "css") return (chromiumCache = false);
  if (forced === "svg") return (chromiumCache = true);
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
