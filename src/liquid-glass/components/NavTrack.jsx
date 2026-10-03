import { useEffect, useRef } from "react";
import { animate, useDragControls, useMotionValue, useReducedMotion } from "motion/react";
import { LiquidGlass } from "../core/LiquidGlass.jsx";
import { clamp } from "../lib/utils.js";

const SPRING = { type: "spring", stiffness: 380, damping: 24 }; // under-damped → overshoots
const SPRING_CALM = { type: "spring", stiffness: 380, damping: 39 }; // reduced motion: no overshoot

/**
 * The inside of a nav bar: the items plus the sliding glass lens that sits
 * *under* their labels (so icons and text stay crisp). Drag the lens and it
 * snaps to the nearest item on release. Used by <LiquidNav> and <LiquidBottomNav>.
 */
export function NavTrack({ items, index: rawIndex, onSelect, itemWidth, height, padding, indicatorProps }) {
  const count = items.length;
  const index = Math.max(0, rawIndex); // rawIndex < 0 → nothing selected, lens hidden
  const width = count * itemWidth + padding * 2;
  const lensH = height - padding * 2;

  const x = useMotionValue(index * itemWidth);
  const dragging = useRef(false);
  const spring = useReducedMotion() ? SPRING_CALM : SPRING;
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
    const anim = animate(x, index * itemWidth, spring);
    return () => anim.stop();
  }, [index, itemWidth, x, spring]);

  return (
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
          onSelect(i);
          animate(x, i * itemWidth, spring); // also covers "released on same item"
        }}
        style={{ position: "absolute", left: padding, top: padding, pointerEvents: "none", opacity: rawIndex < 0 ? 0 : 1, transition: "opacity 200ms" }}
        {...indicatorProps}
      />
      <div className="lg-nav-items" style={{ left: padding, top: padding, height: lensH }}>
        {items.map((it, i) => {
          const selected = i === rawIndex;
          const shared = {
            onPointerDown: (e) => {
              if (!selected) return;
              press.set(1);
              controls.start(e); // drag the lens from its own label
            },
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
                onSelect(i);
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
              onClick={() => onSelect(i)}
              {...shared}
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** value ↔ index plumbing shared by the nav components */
export function useNavSelection({ items, value, defaultValue, onChange, useState }) {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const current = isControlled ? value : inner;
  const count = items.length;
  const index = items.findIndex((i) => i.value === current); // -1 → none selected
  const select = (i) => {
    const next = items[clamp(i, 0, count - 1)];
    if (!next) return;
    if (!isControlled) setInner(next.value);
    if (next.value !== current) onChange?.(next.value);
  };
  return { index, select, count };
}
