import { useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent, useSpring, useTransform } from "motion/react";
import { LiquidGlass } from "../core/LiquidGlass.jsx";
import { LiquidBlob, LiquidMerge } from "../core/LiquidMerge.jsx";
import { clamp } from "../lib/utils.js";

/**
 * Tab bar driven by a continuous `progress` (0 … items-1), built for swiping pages.
 *
 * The selection lens is TWO glass blobs in one merged body: the *head* sits exactly at
 * `progress`, the *tail* trails behind on a softer spring. While progress is changing they
 * pull apart — the lens splits into two with a liquid neck between them — and when it settles
 * they melt back into a single lens. Tap a tab, or press and slide along the bar, to seek.
 *
 *   progress  MotionValue<number>   current position, in tab units (1.5 = half-way to tab 2)
 *   onSeek(position, final)         called while sliding (final = false, position is fractional)
 *                                   and when released / tapped (final = true, whole number)
 *
 * Layout: width = items × itemWidth + 2 × padding.  items: [{ value, label?, icon? }]
 */
export function LiquidSwipeTabs({
  items,
  progress,
  onSeek,
  itemWidth = 88,
  height = 64,
  padding = 6,
  smoothing = 34,
  label = "Pages",
  className = "",
  ...glassProps
}) {
  const count = items.length;
  const width = count * itemWidth + padding * 2;
  const lensH = height - padding * 2;

  const [index, setIndex] = useState(Math.round(progress.get()));
  useMotionValueEvent(progress, "change", (v) => {
    const i = Math.round(v);
    setIndex((prev) => (prev === i ? prev : i));
  });

  // head = exactly where we are; tail = the same, a beat late (and a little bouncy)
  const head = useTransform(progress, (p) => p * itemWidth);
  const tail = useSpring(head, { stiffness: 70, damping: 12, mass: 1 });
  const press = useMotionValue(0);
  const inflate = useTransform(() => {
    const split = Math.abs(head.get() - tail.get()) > 2.5 ? 1 : 0;
    return split || press.get() ? 1 : 0;
  });

  const drag = useRef(null);
  const posFromX = (clientX, rect) => (clientX - rect.left - padding) / itemWidth - 0.5;

  const down = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { startX: e.clientX, moved: false, rect: e.currentTarget.getBoundingClientRect() };
    press.set(1);
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.startX) > 5) d.moved = true;
    if (d.moved) onSeek(clamp(posFromX(e.clientX, d.rect), 0, count - 1), false);
  };
  const up = (e) => {
    const d = drag.current;
    drag.current = null;
    press.set(0);
    if (!d) return;
    if (d.moved) onSeek(clamp(Math.round(progress.get()), 0, count - 1), true);
    else onSeek(clamp(Math.floor((e.clientX - d.rect.left - padding) / itemWidth), 0, count - 1), true);
  };

  // narrower than a tab, so a swipe can pull the two apart into separate lenses
  const bw = Math.round(itemWidth * 0.78);
  const bh = Math.round(lensH * 0.92);
  const blob = {
    left: padding + (itemWidth - bw) / 2,
    top: padding + (lensH - bh) / 2,
    width: bw,
    height: bh,
    restScale: 0.94,
    activeScale: 1.12,
    jelly: 0.8,
    active: inflate,
  };

  return (
    <LiquidGlass
      className={`lg-nav lg-tabbar lg-swipetabs ${className}`}
      role="tablist"
      aria-label={label}
      width={width}
      height={height}
      bezelWidth={Math.round(height * 0.42)}
      glassThickness={55}
      refraction={0.55}
      restRefraction={0.55}
      blur={2}
      fallbackBlur={8}
      tint={0.1}
      activeTint={0.1}
      restScale={1}
      activeScale={1}
      jelly={0}
      glow={0}
      {...glassProps}
    >
      <div
        className="lg-nav-inner lg-swipetabs-inner"
        style={{ width, height }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          drag.current = null;
          press.set(0);
        }}
      >
        <LiquidMerge
          width={width}
          height={height}
          smoothing={smoothing}
          bezelWidth={Math.round(lensH * 0.35)}
          glassThickness={50}
          refraction={0.8}
          tint={0.16}
          specularOpacity={0.7}
          shadow={0.8}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <LiquidBlob {...blob} x={head} />
          <LiquidBlob {...blob} x={tail} />
        </LiquidMerge>

        <div className="lg-nav-items" style={{ left: padding, top: padding, height: lensH }}>
          {items.map((it, i) => (
            <button
              key={it.value}
              type="button"
              role="tab"
              aria-selected={i === index}
              tabIndex={i === index ? 0 : -1}
              className={`lg-nav-item${i === index ? " is-active" : ""}`}
              style={{ width: itemWidth }}
              aria-label={it.ariaLabel ?? (typeof it.label === "string" ? it.label : undefined)}
              onClick={(e) => {
                if (e.detail === 0) onSeek(i, true); // keyboard activation; pointer taps are handled above
              }}
              onKeyDown={(e) => {
                const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                if (!d) return;
                e.preventDefault();
                const next = clamp(i + d, 0, count - 1);
                onSeek(next, true);
                e.currentTarget.parentElement.children[next]?.focus();
              }}
            >
              {it.icon}
              {it.label != null && <span>{it.label}</span>}
            </button>
          ))}
        </div>
      </div>
    </LiquidGlass>
  );
}
