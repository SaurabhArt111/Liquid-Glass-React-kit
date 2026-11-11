import { useEffect, useMemo, useRef, useState } from "react";
import { LiquidGlass, TIERS, getDetectedQuality, isAutoQuality, keepSampling, setQuality, supportsSvgBackdrop, useQuality } from "../../liquid-glass";
import { useFps, useGlassStatsLive } from "../hooks.js";
import { Stage } from "./Stage.jsx";
import { BENCH } from "../data/bench.js";

const ORDER = ["auto", "ultra", "high", "balanced", "low", "css"];

function Meter({ label, value, hint }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <b>{value}</b>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function StressStage({ count, animate }) {
  const lenses = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i * 137.5 * Math.PI) / 180;
        return {
          left: 8 + ((i * 53) % 78),
          top: 10 + ((i * 37) % 72),
          w: 88 + ((i * 29) % 70),
          h: 56 + ((i * 17) % 50),
          delay: -((i * 0.9) % 7),
          dur: 7 + (i % 5),
          a,
        };
      }),
    [count],
  );
  return (
    <Stage variant="aurora" className={`stress-stage ${animate ? "is-animating" : ""}`}>
      <div className="stress-bg" aria-hidden="true" />
      <div className="stage-words" aria-hidden="true">
        <span>stress test</span>
        <span>{count} lenses</span>
      </div>
      {lenses.map((l, i) => (
        <div key={i} className="stress-lens" style={{ left: `${l.left}%`, top: `${l.top}%`, animationDelay: `${l.delay}s`, animationDuration: `${l.dur}s` }}>
          <LiquidGlass width={l.w} height={l.h} radius={Math.min(l.h / 2, 30)} bezelWidth={Math.round(Math.min(l.w, l.h) * 0.3)} tint={0.04} />
        </div>
      ))}
    </Stage>
  );
}

const CARDS = [
  ["Filter region = the element", "SVG filters default to a region of 120 % × 120 % of the element. Now it is exactly the box: up to ~31 % fewer pixels for the GPU to filter, per glass, per frame."],
  ["Maps computed on the ring only", "Light only bends in the bezel, so the map generator skips the flat middle. Output is bit-identical (checked pixel-for-pixel on 6 shapes × 4 densities) at a fraction of the work."],
  ["Async, density-aware maps", "Maps are encoded off the main thread (blob URLs) at the density of the active tier instead of a fixed 3×. First paint no longer stalls on a 1.7 M-pixel loop."],
  ["No-op passes removed", "A 0.2 px Gaussian blur is invisible but still a full filter pass. Passes that change nothing are no longer emitted; dispersion is opt-in per tier."],
  ["Rim light in CSS", "The specular rim moved out of the filter into vector inset shadows: crisp on any pixel density, no extra feImage, no composite chain. Ultra keeps the original filter rim."],
  ["Budget + governor", "Only the N most important visible surfaces refract; the rest get frosted CSS glass. A frame-time governor steps tiers down when scrolling drops below ~35 fps and back up when it recovers."],
];

export function PerfLab() {
  const [tier, profile] = useQuality();
  const auto = isAutoQuality();
  const stats = useGlassStatsLive();
  const { fps, p75 } = useFps();
  const [count, setCount] = useState(10);
  const [animate, setAnimate] = useState(false);
  const refracts = supportsSvgBackdrop();
  const hold = useRef(0);

  // while the stress animation runs, keep the governor sampling even without pointer/scroll input
  useEffect(() => {
    if (!animate) return;
    hold.current = setInterval(keepSampling, 600);
    return () => clearInterval(hold.current);
  }, [animate]);

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency : "?";

  return (
    <section className="section" id="performance">
      <header className="section-head">
        <p className="kicker">Performance</p>
        <h2>Same liquid shape. A fraction of the cost.</h2>
        <p>
          Every tier bends light with the same Snell's-law bezel profile, so the liquid look stays. Tiers only trade away extras:
          fringe, rim-in-filter, map density and how many surfaces refract at once.
        </p>
      </header>

      <div className="lab">
        <div className="lab-panel">
          <div className="lab-block">
            <h3>Quality tier</h3>
            <div className="seg" role="radiogroup" aria-label="Quality tier">
              {ORDER.map((t) => {
                const on = t === "auto" ? auto : !auto && tier === t;
                return (
                  <button key={t} type="button" role="radio" aria-checked={on} className={on ? "on" : ""} onClick={() => setQuality(t)}>
                    {t}
                  </button>
                );
              })}
            </div>
            <p className="hint">
              {auto ? `Auto: starts at “${getDetectedQuality()}” for this device and adapts to measured frame times.` : `Pinned to “${tier}”. Choose Auto to let the governor decide.`}
            </p>
          </div>

          <div className="meters">
            <Meter label="Mode" value={refracts && tier !== "css" ? "Refraction" : "CSS glass"} hint={refracts ? "SVG backdrop filter" : "this browser has no SVG backdrop"} />
            <Meter label="Active tier" value={tier} hint={profile.dispersion ? "dispersion on" : "no dispersion"} />
            <Meter label="Refracting" value={`${stats.refracting} / ${stats.visible}`} hint={`budget ${stats.budget}`} />
            <Meter label="Frame rate" value={fps ? `${fps} fps` : "—"} hint={fps ? `p75 ${p75.toFixed(1)} ms` : "scroll or drag to measure"} />
            <Meter label="Device" value={`${cores} cores`} hint={`${dpr}× pixels`} />
            <Meter label="Map density" value={`${profile.mapDpr}×`} hint={profile.rimInFilter ? "rim in filter" : "rim in CSS"} />
          </div>
        </div>

        <div className="lab-stage">
          <div className="lab-controls">
            <label className="range">
              <span>Lenses</span>
              <input type="range" min="1" max="24" value={count} onChange={(e) => setCount(+e.target.value)} />
              <output>{count}</output>
            </label>
            <label className="check">
              <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} />
              Animate backdrop (stress)
            </label>
          </div>
          <StressStage count={count} animate={animate} />
        </div>
      </div>

      <div className="tiers">
        {TIERS.slice()
          .reverse()
          .map((t) => (
            <div key={t} className={`tier ${tier === t ? "on" : ""}`}>
              <b>{t}</b>
              <span>{TIER_NOTES[t]}</span>
            </div>
          ))}
      </div>

      <div className="cards">
        {CARDS.map(([t, d], i) => (
          <article className="card" key={t}>
            <span className="card-n">{String(i + 1).padStart(2, "0")}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </div>

      <div className="bench">
        <h3>Measured: scrolling the original demo page</h3>
        <table>
          <thead>
            <tr>
              <th>Run</th>
              <th>Before</th>
              <th>After</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {BENCH.rows.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
                <td className="good">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fine">{BENCH.note}</p>
      </div>
    </section>
  );
}

const TIER_NOTES = {
  ultra: "dispersion · rim in filter · 2.5× maps · 24 surfaces",
  high: "dispersion · CSS rim · 2× maps · 12 surfaces",
  balanced: "no dispersion · 1.5× maps · 7 surfaces",
  low: "1× maps · no blur pass · 3 surfaces",
  css: "no SVG refraction · frosted CSS glass",
};
