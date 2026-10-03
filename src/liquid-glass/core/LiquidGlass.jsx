import { forwardRef, useId, useMemo } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { LiquidFilter } from "./LiquidFilter.jsx";
import { getSpecularMap } from "../lib/optics.js";
import { useLiquidMotion } from "../lib/useLiquidMotion.js";
import { clamp, lerp, supportsSvgBackdrop, useMv } from "../lib/utils.js";

// CSS-only "curved glass" sheen used where SVG refraction is unavailable (iOS/WebKit, Firefox)
const SHEEN =
  "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.06) 34%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.16) 100%)";

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
    variant = "regular", // 'regular' | 'clear' (clear = see-through media glass; pair with `dim`)
    dim = 0, // 0..1 dark layer under the glass, keeps content legible on clear glass
    dispersion = 0.04, // chromatic fringe at the rim (0 = off)
    glow = 0.5, // "illuminates from within" at the touch point (0 = off)
    blur,
    refraction = 1, // 0..1 — strength while active
    restRefraction, // strength at rest (default 80 % of `refraction`)
    specularOpacity,
    specularSaturation = 6,
    magnify = 0, // zoom strength while active (0 = off)
    restMagnify, // zoom at rest (default 50 % of `magnify`)
    /* surface */
    tint, // overlay alpha at rest (default 0.05, clear: 0.01)
    tintColor = "255,255,255", // overlay colour as "r,g,b"
    activeTint, // white overlay alpha while active (default = tint)
    shadow = 1, // shadow strength multiplier (0 = none)
    fallbackBlur, // px of blur when SVG refraction is unavailable (default 3, or 0 for magnifiers)
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
    onPointerMove,
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
  const specUrl = useMemo(
    () => (svgBackdrop ? null : getSpecularMap({ width, height, radius: r })),
    [svgBackdrop, width, height, r],
  );
  const specOpacityMv = useMv(specularOpacity ?? 0.5);
  const specOverlayOpacity = useTransform(() => clamp(specOpacityMv.get() * 0.9, 0, 1));

  const clear = variant === "clear";
  const tintV = tint ?? (clear ? 0.01 : 0.05);
  const blurV = blur ?? (clear ? 0 : 0.2);
  const specV = specularOpacity ?? (clear ? 0.7 : 0.5);

  const {
    pressed,
    setPressed,
    refractionMv,
    magnifyMv,
    tintMv,
    lift,
    glowAmt,
    x,
    y,
    scaleX,
    scaleY,
  } = useLiquidMotion({
    restScale,
    activeScale,
    refraction,
    restRefraction,
    magnify,
    restMagnify,
    tint: tintV,
    activeTint,
    jelly,
    active,
    onPressChange,
    x: xProp,
    y: yProp,
  });

  // touch glow: a soft radial light that follows the finger inside the glass
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glowBg = useTransform(
    () =>
      `radial-gradient(circle at ${gx.get()}% ${gy.get()}%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.32) 26%, rgba(255,255,255,0) 64%)`,
  );
  const glowOpacity = useTransform(() => clamp(glowAmt.get() * glow * 0.65, 0, 1));
  const trackGlow = (e) => {
    if (!glow) return;
    const rc = e.currentTarget.getBoundingClientRect();
    gx.set(((e.clientX - rc.left) / rc.width) * 100);
    gy.set(((e.clientY - rc.top) / rc.height) * 100);
  };

  /* ------------------------------ appearance ------------------------------ */
  const boxShadow = useTransform(() => {
    const t = lift.get();
    const s = shadow;
    const g = clamp(glowAmt.get() * glow, 0, 1);
    const bloom = g > 0.01 ? `, 0 0 ${lerp(8, 30, g)}px ${lerp(0, 3, g)}px rgba(255,255,255,${0.3 * g})` : "";
    if (!svgBackdrop) {
      // Rim lighting for the CSS-only look: bright top-left / bottom-right edges,
      // dark inner edges, soft drop shadow. (Same idea as a hand-built glass nav.)
      return [
        "inset 0 0 0 1px rgba(255,255,255,0.20)",
        "inset 1.8px 3px 0 -2px rgba(255,255,255,0.85)",
        "inset -2px -2px 0 -2px rgba(255,255,255,0.70)",
        "inset -3px -8px 1px -6px rgba(255,255,255,0.50)",
        `inset -0.3px -1px 4px 0 rgba(0,0,0,${0.12 * s})`,
        `inset -1.5px 2.5px 0 -2px rgba(0,0,0,${0.2 * s})`,
        `inset 0 3px 4px -2px rgba(0,0,0,${0.2 * s})`,
        `inset 2px -6.5px 1px -4px rgba(0,0,0,${0.1 * s})`,
        `0 ${lerp(1, 4, t)}px ${lerp(5, 12, t)}px rgba(0,0,0,${lerp(0.1, 0.16, t) * s})`,
        `0 ${lerp(6, 16, t)}px ${lerp(16, 30, t)}px rgba(0,0,0,${lerp(0.08, 0.14, t) * s})`,
      ].join(", ") + bloom;
    }
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
    ].join(", ") + bloom;
  });
  const backgroundColor = useTransform(tintMv, (a) => `rgba(${tintColor},${a})`);
  const fbBlur = fallbackBlur ?? (magnify ? 0 : 3);
  const backdropFilter = svgBackdrop
    ? `url(#${filterId})`
    : `${fbBlur ? `blur(${fbBlur}px) ` : ""}saturate(1.8) brightness(1.08)`;

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
        trackGlow(e);
        setPressed(1);
        onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        if (pressed.get()) trackGlow(e);
        onPointerMove?.(e);
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
      {svgBackdrop && (
        <LiquidFilter
          id={filterId}
          width={width}
          height={height}
          radius={r}
          bezelWidth={bezel}
          glassThickness={glassThickness}
          refractiveIndex={refractiveIndex}
          bezelType={bezelType}
          blur={blurV}
          dispersion={dispersion}
          scaleRatio={refractionMv}
          specularOpacity={specV}
          specularSaturation={specularSaturation}
          magnifyingScale={magnify ? magnifyMv : undefined}
        />
      )}
      {dim > 0 && <div className="lg-dim" style={{ borderRadius: r, background: `rgba(0,0,0,${dim})` }} />}
      <motion.div
        className="lg-glass"
        style={{
          borderRadius: r,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
          backgroundColor,
          backgroundImage: svgBackdrop ? undefined : SHEEN,
          boxShadow,
        }}
      />
      {!svgBackdrop && (
        <motion.div
          className="lg-spec"
          style={{ borderRadius: r, backgroundImage: `url(${specUrl})`, opacity: specOverlayOpacity }}
        />
      )}
      {glow > 0 && <motion.div className="lg-glow" style={{ borderRadius: r, backgroundImage: glowBg, opacity: glowOpacity }} />}
      {children != null && (
        <div className="lg-content" style={{ borderRadius: r }}>
          {children}
        </div>
      )}
    </motion.div>
  );
});
