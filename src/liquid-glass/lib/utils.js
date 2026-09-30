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
 * (Chrome, Edge, Arc, Brave, Opera…). Everywhere else we fall back to a
 * regular frosted-glass blur so the components still look good.
 */
export function supportsSvgBackdrop() {
  if (chromiumCache !== undefined) return chromiumCache;
  if (typeof navigator === "undefined") return (chromiumCache = false);
  const brands = navigator.userAgentData?.brands;
  chromiumCache = brands
    ? brands.some((b) => b.brand === "Chromium")
    : /Chrome\//.test(navigator.userAgent) && !/Edge?\/|Firefox|CriOS|FxiOS/.test(navigator.userAgent);
  return chromiumCache;
}
