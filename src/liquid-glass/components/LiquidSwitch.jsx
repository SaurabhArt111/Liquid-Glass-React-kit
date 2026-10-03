import { useEffect, useMemo, useState } from "react";
import { mix, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { LiquidGlass } from "../core/LiquidGlass.jsx";

const REST = 0.65; // thumb scale at rest
const ACTIVE = 0.9; // thumb scale while held

/** All geometry scales with `height` (the original design is 67px tall). */
function geometry(h) {
  const r = h / 67;
  const trackW = 160 * r;
  const thumbW = 146 * r;
  const thumbH = 92 * r;
  return {
    r,
    trackW,
    trackH: h,
    thumbW,
    thumbH,
    travel: trackW - h - (thumbW - thumbH) * REST,
    left: -((1 - REST) * thumbW) / 2 + (h - thumbH * REST) / 2,
    top: (h - thumbH) / 2,
  };
}

/**
 * On/off switch with a "lip" bezel glass thumb. Tap anywhere to toggle, or drag
 * the thumb; it inflates into a clear lens while held, overshoots like a spring
 * and rubber-bands when pulled past either end.
 *
 * Props
 *  - checked / defaultChecked / onChange(bool)
 *  - height         track height in px (default 67). Everything scales with it.
 *  - onColor, offColor   6-digit hex track colours
 *  - onAlpha, offAlpha   2-digit hex opacity of those colours
 *  - startIcon, endIcon  nodes drawn in the track, left / right (e.g. sun / moon); they sit
 *                        above the thumb, so give the thumb a low `thumbTint` to see through it
 *  - thumbTint      white overlay of the thumb at rest (default 1 = solid white)
 *  - label          accessible name
 */
export function LiquidSwitch({
  checked,
  defaultChecked = false,
  onChange,
  height = 67,
  onColor = "#3BBF4E",
  offColor = "#94949F",
  onAlpha = "EE",
  offAlpha = "77",
  startIcon,
  endIcon,
  thumbTint = 1,
  label,
  className = "",
  style,
  ...props
}) {
  const g = useMemo(() => geometry(height), [height]);
  const reduce = useReducedMotion();
  const isControlled = checked !== undefined;
  const checkedMv = useMotionValue((isControlled ? checked : defaultChecked) ? 1 : 0);
  const [on, setOn] = useState(checkedMv.get() > 0.5);
  const pressed = useMotionValue(0);
  const dragRatio = useMotionValue(0);
  const startX = useMotionValue(0);
  const moved = useMotionValue(0);

  useEffect(() => {
    if (isControlled) checkedMv.set(checked ? 1 : 0);
  }, [checked, isControlled, checkedMv]);
  useEffect(() => checkedMv.on("change", (v) => setOn(v > 0.5)), [checkedMv]);

  const commit = (next) => {
    if (next === checkedMv.get() > 0.5) return;
    checkedMv.set(next ? 1 : 0);
    onChange?.(next);
  };

  // Thumb position: follows the finger while pressed, otherwise the state.
  const xRatio = useSpring(
    useTransform(() => {
      const p = pressed.get();
      const d = dragRatio.get();
      const c = checkedMv.get();
      return p > 0.5 ? d : c;
    }),
    reduce ? { stiffness: 700, damping: 53 } : { stiffness: 700, damping: 32 }, // slight overshoot = bounce
  );
  const thumbX = useTransform(() => xRatio.get() * g.travel);

  const considerChecked = useTransform(() => {
    const p = pressed.get();
    const d = dragRatio.get();
    const c = checkedMv.get();
    return p > 0.5 ? (d > 0.5 ? 1 : 0) : c > 0.5 ? 1 : 0;
  });
  const backgroundColor = useTransform(
    useSpring(considerChecked, { stiffness: 1000, damping: 80 }),
    mix(offColor + offAlpha, onColor + onAlpha),
  );

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startX.set(e.clientX);
    moved.set(0);
    dragRatio.set(checkedMv.get());
    pressed.set(1);
  };
  const onPointerMove = (e) => {
    if (!pressed.get()) return;
    const dx = e.clientX - startX.get();
    if (Math.abs(dx) > 4) moved.set(1);
    const ratio = checkedMv.get() + dx / g.travel;
    const overflow = ratio < 0 ? -ratio : ratio > 1 ? ratio - 1 : 0;
    const sign = ratio < 0 ? -1 : 1;
    dragRatio.set(Math.min(1, Math.max(0, ratio)) + (sign * overflow) / 22);
  };
  const onPointerUp = () => {
    if (!pressed.get()) return;
    const next = moved.get() ? dragRatio.get() > 0.5 : !(checkedMv.get() > 0.5);
    commit(next); // update state first, then release, so the spring has one target
    pressed.set(0);
  };

  const iconSize = Math.round(g.trackH * 0.46);
  const iconPad = (g.trackH - iconSize) / 2;

  return (
    <motion.div
      className={`lg-switch ${className}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => pressed.set(0)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          commit(!(checkedMv.get() > 0.5));
        }
      }}
      style={{ width: g.trackW, height: g.trackH, borderRadius: g.trackH / 2, backgroundColor, ...style }}
      {...props}
    >
      <LiquidGlass
        width={g.thumbW}
        height={g.thumbH}
        bezelWidth={19 * g.r}
        glassThickness={47 * g.r}
        refractiveIndex={1.5}
        bezelType="lip"
        blur={0.2}
        specularOpacity={0.5}
        specularSaturation={6}
        refraction={0.9}
        restRefraction={0.4}
        tint={thumbTint}
        activeTint={0.1}
        restScale={REST}
        activeScale={ACTIVE}
        jelly={3}
        x={thumbX}
        active={pressed}
        style={{ position: "absolute", left: g.left, top: g.top, pointerEvents: "none" }}
      />
      {startIcon && (
        <span className={`lg-switch-icon${!on ? " is-on" : ""}`} style={{ left: iconPad, top: iconPad, width: iconSize, height: iconSize }}>
          {startIcon}
        </span>
      )}
      {endIcon && (
        <span className={`lg-switch-icon${on ? " is-on" : ""}`} style={{ right: iconPad, top: iconPad, width: iconSize, height: iconSize }}>
          {endIcon}
        </span>
      )}
    </motion.div>
  );
}
