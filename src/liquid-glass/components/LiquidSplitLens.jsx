import { useEffect, useRef, useState } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { LiquidBlob, LiquidMerge } from "../core/LiquidMerge.jsx";

const sleep = (ms, alive) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    alive.timers.add(t);
  });

/**
 * Two lenses that melt into one body when they touch and split apart again —
 * refracted as a single piece of glass. Drag them to play with it.
 *
 * Props
 *  - width, height      size of the stage the lenses live in (px)
 *  - smoothing          how far the liquid neck reaches (px, default 34)
 *  - auto               play a looping merge ↔ split animation while the lens is on screen.
 *                       It starts when the area scrolls into view, pauses when it leaves,
 *                       stops when you grab a lens and resumes a moment after you let go.
 *                       (Disabled for users who prefer reduced motion.)
 *  - ...props           forwarded to <LiquidMerge> (tint, refraction, dispersion, …)
 */
export function LiquidSplitLens({ width = 520, height = 260, smoothing = 34, auto = false, ...props }) {
  const box = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(box, { amount: 0.5 });
  const [held, setHeld] = useState(false);
  const resume = useRef(0);

  const big = Math.min(height - 56, 150);
  const small = Math.round(big * 0.78);
  const aW = Math.round(big * 1.35);
  const aLeft = Math.round(width * 0.12);
  const bLeft = Math.round(width * 0.66);

  const xA = useMotionValue(0);
  const yA = useMotionValue(0);
  const xB = useMotionValue(0);
  const yB = useMotionValue(0);
  const pulseA = useMotionValue(0); // forced "pressed" look = inflate + glow
  const pulseB = useMotionValue(0);

  const release = () => {
    clearTimeout(resume.current);
    resume.current = setTimeout(() => setHeld(false), 2200);
  };
  const grab = () => {
    clearTimeout(resume.current);
    setHeld(true);
    // a plain press (no drag) must resume too, so listen on the window
    window.addEventListener("pointerup", release, { once: true });
    window.addEventListener("pointercancel", release, { once: true });
  };
  useEffect(() => () => clearTimeout(resume.current), []);

  useEffect(() => {
    if (!auto || !inView || held || reduce) return;
    const alive = { on: true, timers: new Set(), anims: new Set() };
    const go = (mv, to, opts) => {
      const a = animate(mv, to, opts);
      alive.anims.add(a);
      return a.then?.(() => {}, () => {}) ?? Promise.resolve();
    };
    const drift = { type: "spring", stiffness: 46, damping: 12 }; // slow, gooey
    const settle = { type: "spring", stiffness: 90, damping: 11 };
    const gap = bLeft - (aLeft + aW); // distance between the two shapes at rest
    const meet = gap - 10; // B travels this far to overlap A slightly

    (async () => {
      // always begin from the "apart" pose, so re-entering the section replays the animation
      await Promise.all([go(xA, 0, settle), go(xB, 0, settle), go(yA, 0, settle), go(yB, 0, settle)]);
      while (alive.on) {
        await sleep(700, alive);
        if (!alive.on) break;
        // 1 · approach: both drift toward each other, B arcs in from slightly above
        go(yB, -24, drift);
        go(xA, meet * 0.38, drift);
        await go(xB, -meet * 0.62, drift);
        if (!alive.on) break;
        go(yB, 0, settle);
        // 2 · merge: both inflate (the neck swells), then hold as one body
        pulseA.set(1);
        pulseB.set(1);
        await sleep(1400, alive);
        pulseA.set(0);
        pulseB.set(0);
        await sleep(500, alive);
        if (!alive.on) break;
        // 3 · split: B is pulled away down-right, A recoils, the neck stretches and pinches off
        go(yB, 22, drift);
        go(xA, 0, drift);
        await go(xB, 0, { type: "spring", stiffness: 38, damping: 10 });
        go(yB, 0, settle);
        await sleep(900, alive);
      }
    })();

    return () => {
      alive.on = false;
      alive.timers.forEach(clearTimeout);
      alive.anims.forEach((a) => a.stop?.());
    };
  }, [auto, inView, held, reduce, aLeft, aW, bLeft, xA, xB, yA, yB, pulseA, pulseB]);

  const shared = {
    restScale: 0.88,
    activeScale: 1,
    jelly: 1.2,
    draggable: true,
    dragConstraints: box,
    onPointerDown: grab,
  };

  return (
    <LiquidMerge
      ref={box}
      width={width}
      height={height}
      smoothing={smoothing}
      bezelWidth={30}
      glassThickness={86}
      refraction={1}
      tint={0.16}
      specularOpacity={0.8}
      shadow={1.4}
      {...props}
    >
      <LiquidBlob left={aLeft} top={(height - big) / 2} width={aW} height={big} x={xA} y={yA} active={pulseA} aria-label="Lens one" {...shared} />
      <LiquidBlob left={bLeft} top={(height - small) / 2} width={small} height={small} x={xB} y={yB} active={pulseB} aria-label="Lens two" {...shared} />
    </LiquidMerge>
  );
}
