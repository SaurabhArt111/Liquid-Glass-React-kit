import { useEffect, useRef } from "react";
import { animate, motion, useDragControls, useMotionValue, useTransform } from "motion/react";
import { LiquidGlass } from "../LiquidGlass.jsx";
import { clamp } from "../lib/utils.js";

const SPRING = { type: "spring", stiffness: 500, damping: 30 };

/**
 * Slider whose thumb is a glass lens: the fill shows through the centre while
 * the sides refract the track. Drag the thumb, click/tap the track (the thumb
 * snaps under your finger and follows), or use the arrow keys.
 */
export function LiquidSlider({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  width = 330,
  color = "#0377F7",
  trackHeight = 14,
  className = "",
  ...glassProps
}) {
  const THUMB_W = 90;
  const THUMB_H = 60;
  const REST = 0.6;
  const restW = THUMB_W * REST;
  const x0 = restW / 2 - THUMB_W / 2; // thumb x when value = min
  const x1 = width - restW / 2 - THUMB_W / 2; // thumb x when value = max

  const isControlled = value !== undefined;
  const toX = (v) => x0 + clamp((v - min) / (max - min), 0, 1) * (x1 - x0);
  const toValue = (xv) => {
    const raw = min + clamp((xv - x0) / (x1 - x0), 0, 1) * (max - min);
    if (!step) return raw;
    const snapped = Math.round((raw - min) / step) * step + min;
    return Number(clamp(snapped, min, max).toFixed(6));
  };

  const x = useMotionValue(toX(isControlled ? value : defaultValue));
  const controls = useDragControls();
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const last = useRef(isControlled ? value : defaultValue);

  const report = (v) => {
    if (v === last.current) return;
    last.current = v;
    rootRef.current?.setAttribute("aria-valuenow", String(v));
    onChange?.(v);
  };

  // controlled: animate to externally-changed values
  useEffect(() => {
    if (isControlled && value !== last.current) {
      last.current = value;
      animate(x, toX(value), SPRING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fillWidth = useTransform(x, (v) => v + THUMB_W / 2);

  const nudge = (delta) => {
    const next = clamp(last.current + delta, min, max);
    report(next);
    animate(x, toX(next), SPRING);
  };

  return (
    <div
      ref={rootRef}
      className={`lg-slider ${className}`}
      role="slider"
      tabIndex={0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={last.current}
      style={{ width, height: THUMB_H }}
      onPointerDown={(e) => {
        // pressing the bare track: jump the thumb under the cursor (this also
        // reports the value, since a plain click never emits a drag event),
        // then hand the same gesture to the drag controls so it keeps following.
        if (e.target.closest?.(".lg-root")) return;
        const rect = rootRef.current.getBoundingClientRect();
        x.set(clamp(e.clientX - rect.left - THUMB_W / 2, x0, x1));
        report(toValue(x.get()));
        controls.start(e);
      }}
      onPointerUp={() => {
        // a tap on the track never fires onDragEnd; settle onto the nearest step
        if (step) animate(x, toX(toValue(x.get())), SPRING);
      }}
      onKeyDown={(e) => {
        const s = step || (max - min) / 100;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") nudge(s);
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") nudge(-s);
        else if (e.key === "Home") nudge(min - last.current);
        else if (e.key === "End") nudge(max - last.current);
        else return;
        e.preventDefault();
      }}
    >
      <div
        ref={trackRef}
        className="lg-slider-track"
        style={{ height: trackHeight, top: (THUMB_H - trackHeight) / 2, borderRadius: trackHeight / 2 }}
      >
        <motion.div className="lg-slider-fill" style={{ width: fillWidth, background: color }} />
      </div>

      <LiquidGlass
        width={THUMB_W}
        height={THUMB_H}
        bezelWidth={16}
        glassThickness={80}
        refractiveIndex={1.45}
        blur={0}
        specularOpacity={0.4}
        specularSaturation={7}
        refraction={0.9}
        restRefraction={0.4}
        tint={1}
        activeTint={0.1}
        restScale={REST}
        activeScale={1}
        jelly={1.5}
        draggable="x"
        dragControls={controls}
        dragConstraints={{ left: x0, right: x1 }}
        dragElastic={0.1}
        x={x}
        onDrag={() => report(toValue(x.get()))}
        onDragEnd={() => {
          // settle onto the nearest step
          if (step) animate(x, toX(toValue(x.get())), SPRING);
        }}
        style={{ position: "absolute", left: 0, top: 0 }}
        {...glassProps}
      />
    </div>
  );
}
