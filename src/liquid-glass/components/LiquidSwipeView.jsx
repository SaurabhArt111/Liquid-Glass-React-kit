import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { LiquidScrollEdge } from "./LiquidScrollEdge.jsx";
import { LiquidSwipeTabs } from "./LiquidSwipeTabs.jsx";
import { clamp } from "../lib/utils.js";

const SPRING = { type: "spring", stiffness: 260, damping: 28 };

/**
 * Swipeable pages with a glass tab bar whose lens splits and re-merges as you swipe.
 * Drag the pages left / right (or tap / slide the bar) to change page.
 *
 *   <LiquidSwipeView
 *     width={328} height={600}
 *     pages={[{ key: "a", label: "Photos", icon: <PhotoIcon />, content: <Photos /> }, …]}
 *     onIndexChange={(i) => …}
 *   />
 *
 * `width` / `height` are numbers (the glass maps are rendered at that size). Page content fills
 * the frame; the bar floats at the bottom over it (pad your content's bottom by ~110 px).
 * Control it with `index` (or leave it uncontrolled with `defaultIndex`).
 */
export function LiquidSwipeView({
  pages,
  width = 328,
  height = 600,
  index,
  defaultIndex = 0,
  onIndexChange,
  itemWidth,
  barHeight = 62,
  edge = true,
  className = "",
  style,
  tabsProps,
}) {
  const count = pages.length;
  const reduce = useReducedMotion();
  const isControlled = index !== undefined;
  const [inner, setInner] = useState(defaultIndex);
  const current = isControlled ? index : inner;

  const x = useMotionValue(-current * width);
  const progress = useTransform(x, (v) => -v / width);
  const anim = useRef(null);
  const last = useRef(current);

  const goTo = (i) => {
    const next = clamp(i, 0, count - 1);
    anim.current?.stop();
    anim.current = animate(x, -next * width, reduce ? { duration: 0.2 } : SPRING);
    if (next !== last.current) {
      last.current = next;
      if (!isControlled) setInner(next);
      onIndexChange?.(next);
    }
  };

  // controlled: follow the `index` prop
  useEffect(() => {
    if (!isControlled || index === last.current) return;
    last.current = index;
    anim.current?.stop();
    anim.current = animate(x, -index * width, reduce ? { duration: 0.2 } : SPRING);
  }, [isControlled, index, width, reduce, x]);

  const seek = (p, final) => {
    if (!final) {
      anim.current?.stop();
      x.set(-clamp(p, 0, count - 1) * width);
    } else goTo(Math.round(p));
  };

  const tabItemW = itemWidth ?? Math.floor((width - 24 - 12) / count);

  return (
    <div className={`lg-swipeview ${className}`} style={{ width, height, ...style }}>
      <motion.div
        className="lg-swipeview-track"
        style={{ x, width: width * count }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -(count - 1) * width, right: 0 }}
        dragElastic={0.16}
        dragMomentum={false}
        onDragStart={() => anim.current?.stop()}
        onDragEnd={(_, info) => {
          const p = -x.get() / width;
          goTo(Math.round(p - (info.velocity.x / width) * 0.25));
        }}
      >
        {pages.map((pg, i) => (
          <section key={pg.key ?? i} className="lg-swipeview-page" style={{ width }} aria-label={pg.label} aria-hidden={i !== current}>
            {pg.content}
          </section>
        ))}
      </motion.div>
      {edge && <LiquidScrollEdge position="bottom" height={130} />}
      <div className="lg-swipeview-bar">
        <LiquidSwipeTabs
          items={pages.map((p, i) => ({ value: p.key ?? i, label: p.label, icon: p.icon }))}
          progress={progress}
          onSeek={seek}
          itemWidth={tabItemW}
          height={barHeight}
          {...tabsProps}
        />
      </div>
    </div>
  );
}
