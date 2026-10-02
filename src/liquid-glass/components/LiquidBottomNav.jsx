import { useRef, useState } from "react";
import { useMotionValue, useSpring } from "motion/react";
import { LiquidBlob, LiquidMerge } from "../LiquidMerge.jsx";
import { NavTrack, useNavSelection } from "./NavTrack.jsx";

const BLEED = 24; // room around the glass for the drop shadow and the inflating lens
const PULL = 40; // how far the action button can be pulled (extra room is added when `elastic`)

/**
 * Mobile tab bar: a glass pill of tabs (icon above label, accent-coloured
 * when selected, with a sliding lens) plus an optional detached round action
 * button (search, compose…). The two are one <LiquidMerge> body: press or pull
 * the action button and a liquid neck forms between it and the bar, then
 * pinches off when you let go.
 *
 * items:  [{ value, label, icon }]
 * action: { icon, label, onClick }
 * Layout box = bar + gap + button (the shadow bleed is cancelled with negative margins).
 */
export function LiquidBottomNav({
  items,
  value,
  defaultValue,
  onChange,
  action,
  itemWidth = 72,
  height = 64,
  padding = 6,
  gap = 12,
  actionSize,
  elastic = true, // drag the action button; it springs back
  neck = 30, // how far the liquid neck reaches while pressed
  label = "Tabs",
  className = "",
  style,
  ...mergeProps
}) {
  const { index, select, count } = useNavSelection({ items, value, defaultValue, onChange, useState });
  const bleed = BLEED + (action && elastic ? PULL : 0); // the merged glass can only draw inside its own box
  const barW = count * itemWidth + padding * 2;
  const size = actionSize ?? height;
  const bodyW = barW + (action ? gap + size : 0);
  const W = bodyW + bleed * 2;
  const H = height + bleed * 2;

  const dragged = useRef(false); // a drag must not also fire the button's click
  const k = useMotionValue(0);
  const smoothing = useSpring(k, { stiffness: 240, damping: 20 });

  return (
    <LiquidMerge
      width={W}
      height={H}
      smoothing={smoothing}
      bezelWidth={Math.round(height * 0.4)}
      glassThickness={60}
      refraction={0.7}
      tint={0.1}
      className={`lg-tabbar ${className}`}
      style={{ margin: -bleed, ...style }}
      {...mergeProps}
    >
      <LiquidBlob
        left={bleed}
        top={bleed}
        width={barW}
        height={height}
        restScale={1}
        activeScale={1}
        jelly={0}
        role="radiogroup"
        aria-label={label}
      >
        <NavTrack items={items} index={index} onSelect={select} itemWidth={itemWidth} height={height} padding={padding} />
      </LiquidBlob>
      {action && (
        <LiquidBlob
          left={bleed + barW + gap}
          top={bleed + (height - size) / 2}
          width={size}
          height={size}
          restScale={1}
          activeScale={1.1}
          jelly={1}
          draggable={elastic}
          dragSnapToOrigin
          dragConstraints={{ left: -PULL, right: PULL, top: -PULL, bottom: PULL }}
          dragElastic={0.3}
          onPressChange={(down) => k.set(down ? neck : 0)}
          onPointerDown={() => {
            dragged.current = false;
          }}
          onDragStart={() => {
            dragged.current = true;
          }}
        >
          <button
            type="button"
            className="lg-tab-action"
            aria-label={action.label}
            onClick={(e) => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              action.onClick?.(e);
            }}
          >
            {action.icon}
          </button>
        </LiquidBlob>
      )}
    </LiquidMerge>
  );
}
