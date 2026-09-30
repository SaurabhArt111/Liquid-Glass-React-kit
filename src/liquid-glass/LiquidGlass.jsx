import { forwardRef, useEffect, useId, useMemo, useRef } from "react";
import {
  isMotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { LiquidFilter } from "./LiquidFilter.jsx";
import { clamp, lerp, supportsSvgBackdrop } from "./lib/utils.js";

/**
 * <LiquidGlass> — a refractive glass "lens" you can put anything inside.
 *
 * It is a plain <div>: children render on top of the glass, and the glass
 * refracts whatever is *behind* the div. Add `draggable` to get the full
 * physical feel: inflate on press, jelly squash & stretch with velocity,
 * springy refraction and a lifting shadow.
 */
export const LiquidGlass = forwardRef(function LiquidGlass(
  {
    /* geometry */
    width = 200,
    height = 64,
    radius,
    /* optics */
    bezelWidth,
    glassThickness = 70,
    refractiveIndex = 1.5,
    bezelType = "convex", // 'convex' | 'circle' | 'concave' | 'lip'
    blur = 0.2,
    refraction = 1, // 0..1 — strength while active
    restRefraction, // strength at rest (default 80 % of `refraction`)
    specularOpacity = 0.5,
    specularSaturation = 6,
    magnify = 0, // zoom strength while active (0 = off)
    restMagnify, // zoom at rest (default 50 % of `magnify`)
    /* surface */
    tint = 0.05, // white overlay alpha at rest
    activeTint, // white overlay alpha while active (default = tint)
    shadow = 1, // shadow strength multiplier (0 = none)
    /* motion */
    restScale = 1,
    activeScale = 1.1,
    jelly = 1, // squash & stretch amount (0 = off)
    active = false, // force the "pressed" look (boolean | MotionValue)
    onPressChange,
    /* dragging */
    draggable = false, // false | true | 'x' | 'y'
    dragConstraints,
    dragElastic = 0.13,
    x: xProp,
    y: yProp,
    /* dom */
    className = "",
    style,
    children,
    onPointerDown,
    onDragStart,
    onDragEnd,
    ...rest
  },
  ref,
) {
  const r = Math.min(radius ?? height / 2, width / 2, height / 2);
  const bezel = Math.min(bezelWidth ?? Math.round(Math.min(width, height) * 0.3), r);
  const filterId = "lg" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const svgBackdrop = useMemo(supportsSvgBackdrop, []);

  /* ------------------------------ press state ----------------------------- */
  const pressed = useMotionValue(0);
  const forceMv = useMotionValue(0);
  useEffect(() => {
    if (!isMotionValue(active)) forceMv.set(active ? 1 : 0);
  }, [active, forceMv]);
  const forced = isMotionValue(active) ? active : forceMv;

  const onPressChangeRef = useRef(onPressChange);
  onPressChangeRef.current = onPressChange;
  const setPressed = (v) => {
    if (pressed.get() === v) return;
    pressed.set(v);
    onPressChangeRef.current?.(!!v);
  };
  useEffect(() => {
    const release = () => {
      if (pressed.get()) {
        pressed.set(0);
        onPressChangeRef.current?.(false);
      }
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [pressed]);

  // NOTE: read every MotionValue unconditionally inside useTransform(() => …)
  // so all dependencies are tracked.
  const activeMv = useTransform(() => {
    const f = Number(forced.get());
    const p = pressed.get();
    return f || p ? 1 : 0;
  });

  /* ------------------------------- springs -------------------------------- */
  const bouncy = { stiffness: 340, damping: 20 };
  const soft = { stiffness: 250, damping: 14 };
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

  /* -------------------------------- jelly --------------------------------- */
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

  /* ------------------------------ appearance ------------------------------ */
  const boxShadow = useTransform(() => {
    const t = lift.get();
    const s = shadow;
    const sx = 4 * t;
    const sy = lerp(4, 16, t);
    const blurPx = lerp(9, 24, t);
    const a = lerp(0.16, 0.22, t) * s;
    const ia = lerp(0.2, 0.27, t) * s;
    return [
      `${sx}px ${sy}px ${blurPx}px rgba(0,0,0,${a})`,
      `inset ${sx / 2}px ${sy / 2}px 24px rgba(0,0,0,${ia * 0.6})`,
      `inset ${-sx / 2}px ${-sy / 2}px 24px rgba(255,255,255,${ia * 0.7})`,
      `inset 0 0 0 1px rgba(255,255,255,0.14)`,
    ].join(", ");
  });
  const backgroundColor = useTransform(tintMv, (a) => `rgba(255,255,255,${svgBackdrop ? a : Math.max(a, 0.1)})`);
  const backdropFilter = svgBackdrop ? `url(#${filterId})` : "blur(14px) saturate(1.7) brightness(1.06)";

  /* -------------------------------- dragging ------------------------------ */
  const dragProp = draggable === true ? true : draggable || false;
  const touchAction = dragProp === "x" ? "pan-y" : dragProp === "y" ? "pan-x" : dragProp ? "none" : undefined;

  return (
    <motion.div
      ref={ref}
      className={`lg-root ${dragProp ? "lg-draggable" : ""} ${className}`}
      style={{ width, height, borderRadius: r, x, y, scaleX, scaleY, touchAction, ...style }}
      drag={dragProp}
      dragConstraints={dragConstraints}
      dragElastic={dragElastic}
      dragMomentum={false}
      onPointerDown={(e) => {
        setPressed(1);
        onPointerDown?.(e);
      }}
      onDragStart={(...a) => {
        setPressed(1);
        onDragStart?.(...a);
      }}
      onDragEnd={(...a) => {
        setPressed(0);
        onDragEnd?.(...a);
      }}
      {...rest}
    >
      <LiquidFilter
        id={filterId}
        width={width}
        height={height}
        radius={r}
        bezelWidth={bezel}
        glassThickness={glassThickness}
        refractiveIndex={refractiveIndex}
        bezelType={bezelType}
        blur={blur}
        scaleRatio={refractionMv}
        specularOpacity={specularOpacity}
        specularSaturation={specularSaturation}
        magnifyingScale={magnify ? magnifyMv : undefined}
      />
      <motion.div
        className="lg-glass"
        style={{
          borderRadius: r,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
          backgroundColor,
          boxShadow,
        }}
      />
      {children != null && (
        <div className="lg-content" style={{ borderRadius: r }}>
          {children}
        </div>
      )}
    </motion.div>
  );
});
