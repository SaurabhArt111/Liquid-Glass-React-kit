import { useEffect, useState } from "react";
import { mix, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { LiquidGlass } from "../LiquidGlass.jsx";

const TRACK_W = 160;
const TRACK_H = 67;
const THUMB_W = 146;
const THUMB_H = 92;
const REST = 0.65;
const ACTIVE = 0.9;
const TRAVEL = TRACK_W - TRACK_H - (THUMB_W - THUMB_H) * REST;
const LEFT = -((1 - REST) * THUMB_W) / 2 + (TRACK_H - THUMB_H * REST) / 2;
const TOP = (TRACK_H - THUMB_H) / 2;

/**
 * On/off switch with a "lip" bezel thumb: tap anywhere to toggle, or drag the
 * thumb. The thumb inflates into a clear lens while held and rubber-bands
 * when pulled past either end.
 *
 * Colors must be 6-digit hex (e.g. "#3BBF4E").
 */
export function LiquidSwitch({
  checked,
  defaultChecked = false,
  onChange,
  onColor = "#3BBF4E",
  offColor = "#94949F",
  className = "",
  style,
  ...props
}) {
  const isControlled = checked !== undefined;
  const checkedMv = useMotionValue((isControlled ? checked : defaultChecked) ? 1 : 0);
  const [ariaChecked, setAriaChecked] = useState(checkedMv.get() > 0.5);
  const pressed = useMotionValue(0);
  const dragRatio = useMotionValue(0);
  const startX = useMotionValue(0);
  const moved = useMotionValue(0);

  useEffect(() => {
    if (isControlled) checkedMv.set(checked ? 1 : 0);
  }, [checked, isControlled, checkedMv]);
  useEffect(() => checkedMv.on("change", (v) => setAriaChecked(v > 0.5)), [checkedMv]);

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
    { stiffness: 700, damping: 32 }, // slight overshoot = bounce
  );
  const thumbX = useTransform(() => xRatio.get() * TRAVEL);

  const considerChecked = useTransform(() => {
    const p = pressed.get();
    const d = dragRatio.get();
    const c = checkedMv.get();
    return p > 0.5 ? (d > 0.5 ? 1 : 0) : c > 0.5 ? 1 : 0;
  });
  const backgroundColor = useTransform(
    useSpring(considerChecked, { stiffness: 1000, damping: 80 }),
    mix(offColor + "77", onColor + "EE"),
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
    const ratio = checkedMv.get() + dx / TRAVEL;
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

  return (
    <motion.div
      className={`lg-switch ${className}`}
      role="switch"
      aria-checked={ariaChecked}
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
      style={{ width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor, ...style }}
      {...props}
    >
      <LiquidGlass
        width={THUMB_W}
        height={THUMB_H}
        bezelWidth={19}
        glassThickness={47}
        refractiveIndex={1.5}
        bezelType="lip"
        blur={0.2}
        specularOpacity={0.5}
        specularSaturation={6}
        refraction={0.9}
        restRefraction={0.4}
        tint={1}
        activeTint={0.1}
        restScale={REST}
        activeScale={ACTIVE}
        jelly={3}
        x={thumbX}
        active={pressed}
        style={{ position: "absolute", left: LEFT, top: TOP, pointerEvents: "none" }}
      />
    </motion.div>
  );
}
