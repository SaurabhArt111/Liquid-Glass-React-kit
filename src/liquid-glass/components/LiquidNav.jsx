import { useEffect, useRef, useState } from "react";
import { animate, useDragControls, useMotionValue } from "motion/react";
import { LiquidGlass } from "../LiquidGlass.jsx";
import { clamp } from "../lib/utils.js";

const SPRING = { type: "spring", stiffness: 380, damping: 24 }; // under-damped → overshoots

/**
 * Segmented nav / tab bar. The whole bar is a refractive glass pill; the
 * selected item is a second, smaller glass lens that slides between items,
 * stretching with its own velocity (jelly) and overshooting like a spring.
 * Drag the lens and it snaps to the nearest item on release.
 *
 * items: [{ value, label?, icon?, href?, ariaLabel? }]
 *  - with `href`s it renders <a> links inside role="navigation"
 *  - otherwise <button role="radio"> inside role="radiogroup" (← → keys)
 * All geometry is numeric: total width = items × itemWidth + 2 × padding.
 */
export function LiquidNav({
  items,
  value,
  defaultValue,
  onChange,
  itemWidth = 76,
  height = 64,
  padding = 6,
  label = "Navigation",
  className = "",
  indicatorProps,
  ...glassProps
}) {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const current = isControlled ? value : inner;
  const count = items.length;
  const index = Math.max(0, items.findIndex((i) => i.value === current));
  const linkMode = items.some((i) => i.href);

  const width = count * itemWidth + padding * 2;
  const lensH = height - padding * 2;

  const x = useMotionValue(index * itemWidth);
  const dragging = useRef(false);
  const controls = useDragControls();
  const press = useMotionValue(0); // inflates the lens as soon as you press it

  useEffect(() => {
    const release = () => press.set(0);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [press]);

  useEffect(() => {
    if (dragging.current) return;
    const controls = animate(x, index * itemWidth, SPRING);
    return () => controls.stop();
  }, [index, itemWidth, x]);

  const select = (i) => {
    const next = items[clamp(i, 0, count - 1)];
    if (!next) return;
    if (!isControlled) setInner(next.value);
    if (next.value !== current) onChange?.(next.value);
  };

  return (
    <LiquidGlass
      className={`lg-nav ${className}`}
      role={linkMode ? "navigation" : "radiogroup"}
      aria-label={label}
      width={width}
      height={height}
      bezelWidth={Math.round(height * 0.42)}
      glassThickness={55}
      refraction={0.55}
      restRefraction={0.55}
      blur={2}
      fallbackBlur={8} /* bar sits over content: frost it so labels stay readable */
      tint={0.1}
      activeTint={0.1}
      specularOpacity={0.5}
      specularSaturation={6}
      restScale={1}
      activeScale={1}
      jelly={0}
      onKeyDown={
        linkMode
          ? undefined
          : (e) => {
              const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!d) return;
              e.preventDefault();
              const next = clamp(index + d, 0, count - 1);
              select(next);
              e.currentTarget.querySelectorAll(".lg-nav-item")[next]?.focus();
            }
      }
      {...glassProps}
    >
      <div className="lg-nav-inner" style={{ width, height }}>
        {/* the sliding lens sits *under* the labels so icons and text stay crisp */}
        <LiquidGlass
          width={itemWidth}
          height={lensH}
          bezelWidth={Math.round(lensH * 0.35)}
          glassThickness={50}
          refractiveIndex={1.5}
          blur={0.3}
          fallbackBlur={1}
          refraction={0.8}
          restRefraction={0.45}
          specularOpacity={0.65}
          specularSaturation={6}
          tint={0.16}
          activeTint={0.06}
          restScale={1}
          activeScale={1.14}
          jelly={0.8}
          draggable="x"
          dragListener={false}
          dragControls={controls}
          active={press}
          dragConstraints={{ left: 0, right: (count - 1) * itemWidth }}
          dragElastic={0.12}
          x={x}
          onDragStart={() => {
            dragging.current = true;
          }}
          onDragEnd={() => {
            dragging.current = false;
            const i = clamp(Math.round(x.get() / itemWidth), 0, count - 1);
            select(i);
            animate(x, i * itemWidth, SPRING); // also covers "released on same item"
          }}
          style={{ position: "absolute", left: padding, top: padding, pointerEvents: "none" }}
          {...indicatorProps}
        />
        <div className="lg-nav-items" style={{ left: padding, top: padding, height: lensH }}>
          {items.map((it, i) => {
            const selected = i === index;
            const grab = (e) => {
              if (!selected) return;
              press.set(1);
              controls.start(e); // drag the lens from its own label
            };
            const shared = {
              onPointerDown: grab,
              draggable: false,
              className: `lg-nav-item${selected ? " is-active" : ""}`,
              style: { width: itemWidth },
              "aria-label": it.ariaLabel ?? (typeof it.label === "string" ? it.label : undefined),
            };
            const body = (
              <>
                {it.icon}
                {it.label != null && <span>{it.label}</span>}
              </>
            );
            return it.href ? (
              <a
                key={it.value}
                href={it.href}
                aria-current={selected ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  select(i);
                }}
                {...shared}
              >
                {body}
              </a>
            ) : (
              <button
                key={it.value}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                {...shared}
              >
                {body}
              </button>
            );
          })}
        </div>
      </div>
    </LiquidGlass>
  );
}
