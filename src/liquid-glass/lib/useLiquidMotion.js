import { useEffect, useRef } from "react";
import { isMotionValue, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import { clamp, lerp } from "./utils.js";

/**
 * The shared "physical" behaviour of every glass piece: press → inflate,
 * velocity → jelly squash/stretch, springy refraction / tint / shadow.
 * Used by <LiquidGlass> (a div with its own backdrop filter) and by
 * <LiquidBlob> (a shape inside a merged <LiquidMerge> body).
 *
 * NOTE: every MotionValue is read unconditionally inside `useTransform(() => …)`
 * so all dependencies are tracked.
 */
export function useLiquidMotion({
  restScale = 1,
  activeScale = 1.1,
  refraction = 1,
  restRefraction,
  magnify = 0,
  restMagnify,
  tint = 0.05,
  activeTint,
  jelly = 1,
  active = false,
  holdMs = 0,
  onPressChange,
  x: xProp,
  y: yProp,
} = {}) {
  /* press state */
  const pressed = useMotionValue(0);
  const forceMv = useMotionValue(0);
  useEffect(() => {
    if (!isMotionValue(active)) forceMv.set(active ? 1 : 0);
  }, [active, forceMv]);
  const forced = isMotionValue(active) ? active : forceMv;

  const onPressChangeRef = useRef(onPressChange);
  onPressChangeRef.current = onPressChange;
  const holdRef = useRef(holdMs);
  holdRef.current = holdMs;
  const timer = useRef(0);
  // Pressing is instant; releasing waits `holdMs` so even a very quick tap plays the full glass inflate.
  const settle = () => {
    clearTimeout(timer.current);
    const done = () => {
      if (pressed.get()) {
        pressed.set(0);
        onPressChangeRef.current?.(false);
      }
    };
    if (holdRef.current > 0) timer.current = setTimeout(done, holdRef.current);
    else done();
  };
  const setPressed = (v) => {
    if (v) {
      clearTimeout(timer.current);
      if (pressed.get() === 1) return;
      pressed.set(1);
      onPressChangeRef.current?.(true);
    } else settle();
  };
  useEffect(() => {
    const release = () => settle();
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressed]);

  const activeMv = useTransform(() => {
    const f = Number(forced.get());
    const p = pressed.get();
    return f || p ? 1 : 0;
  });

  /* springs — critically damped (no bounce) and no jelly when the user prefers reduced motion */
  const reduce = useReducedMotion();
  const bouncy = reduce ? { stiffness: 340, damping: 37 } : { stiffness: 340, damping: 20 };
  const soft = reduce ? { stiffness: 250, damping: 32 } : { stiffness: 250, damping: 14 };
  if (reduce) jelly = 0;
  const snappy = { stiffness: 2000, damping: 80 };

  const baseScale = useSpring(useTransform(activeMv, (a) => lerp(restScale, activeScale, a)), bouncy);
  const refractionMv = useSpring(
    useTransform(activeMv, (a) => lerp(restRefraction ?? refraction * 0.8, refraction, a)),
    soft,
  );
  const magnifyMv = useSpring(
    useTransform(activeMv, (a) => lerp(restMagnify ?? magnify * 0.5, magnify, a)),
    soft,
  );
  const tintMv = useSpring(useTransform(activeMv, (a) => lerp(tint, activeTint ?? tint, a)), snappy);
  const lift = useSpring(activeMv, { stiffness: 340, damping: 30 });
  const glowAmt = useSpring(activeMv, { stiffness: 260, damping: 26 });

  /* jelly */
  const ownX = useMotionValue(0);
  const ownY = useMotionValue(0);
  const x = xProp ?? ownX;
  const y = yProp ?? ownY;
  const vx = useVelocity(x);
  const vy = useVelocity(y);
  const stretch = useSpring(
    useTransform(() => {
      const kx = Math.min(0.3, Math.abs(vx.get()) / 5000);
      const ky = Math.min(0.3, Math.abs(vy.get()) / 5000);
      return kx - ky;
    }),
    { stiffness: 400, damping: 16 }, // under-damped → wobbles when you stop
  );
  const scaleX = useTransform(() => baseScale.get() * (1 + clamp(jelly * stretch.get(), -0.4, 0.4)));
  const scaleY = useTransform(() => baseScale.get() * (1 - clamp(jelly * stretch.get(), -0.4, 0.4)));

  return {
    pressed,
    setPressed,
    activeMv,
    baseScale,
    refractionMv,
    magnifyMv,
    tintMv,
    lift,
    glowAmt,
    x,
    y,
    scaleX,
    scaleY,
  };
}
