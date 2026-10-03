import { useState } from "react";
import { LiquidGlass } from "../core/LiquidGlass.jsx";
import { clamp } from "../lib/utils.js";
import { NavTrack, useNavSelection } from "./NavTrack.jsx";

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
  const { index, select, count } = useNavSelection({ items, value, defaultValue, onChange, useState });
  const linkMode = items.some((i) => i.href);
  const width = count * itemWidth + padding * 2;

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
      glow={0}
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
      <NavTrack
        items={items}
        index={index}
        onSelect={select}
        itemWidth={itemWidth}
        height={height}
        padding={padding}
        indicatorProps={indicatorProps}
      />
    </LiquidGlass>
  );
}
