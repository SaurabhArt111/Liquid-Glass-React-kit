import { useRef, useState } from "react";
import { LiquidGlass } from "../../liquid-glass";
import { BASE, CONTROLS, PRESETS, toJSX } from "../data/presets.js";
import { CodeBlock } from "./CodeBlock.jsx";
import { Stage } from "./Stage.jsx";

const BACKDROPS = ["aurora", "text", "stripes", "grid"];

export function Playground() {
  const stageRef = useRef(null);
  const [p, setP] = useState(BASE);
  const [preset, setPreset] = useState("regular");
  const [bg, setBg] = useState("text");
  const [hold, setHold] = useState(false);
  const [out, setOut] = useState("jsx");
  const set = (k, v) => {
    setPreset(null);
    setP((s) => ({ ...s, [k]: v }));
  };
  const code = out === "jsx" ? toJSX(p) : JSON.stringify(p, null, 2);

  return (
    <section className="section" id="playground">
      <header className="section-head">
        <p className="kicker">Playground</p>
        <h2>Tune it, then copy the code.</h2>
        <p>Every optical property is a prop. Geometry changes regenerate the maps once (async) and cache them; everything else is spring-driven and never re-renders React.</p>
      </header>

      <div className="presets" role="radiogroup" aria-label="Presets">
        {PRESETS.map((x) => (
          <button key={x.id} role="radio" aria-checked={preset === x.id} className={preset === x.id ? "on" : ""} onClick={() => (setP(x.props), setPreset(x.id))}>
            {x.label}
          </button>
        ))}
      </div>

      <div className="play">
        <div className="play-stage">
          <Stage variant={bg} className="stage--tall" stageRef={stageRef}>
            <LiquidGlass
              draggable
              dragConstraints={stageRef}
              active={hold}
              restScale={0.85}
              activeScale={1}
              style={{ position: "absolute", left: "calc(50% - 130px)", top: "calc(50% - 70px)" }}
              {...p}
            />
          </Stage>
          <div className="play-bar">
            <div className="seg seg--sm" role="radiogroup" aria-label="Backdrop">
              {BACKDROPS.map((b) => (
                <button key={b} role="radio" aria-checked={bg === b} className={bg === b ? "on" : ""} onClick={() => setBg(b)}>
                  {b}
                </button>
              ))}
            </div>
            <label className="check">
              <input type="checkbox" checked={hold} onChange={(e) => setHold(e.target.checked)} />
              Hold pressed
            </label>
          </div>
        </div>

        <form className="controls" onSubmit={(e) => e.preventDefault()} aria-label="Glass properties">
          <div className="ctl-row">
            <label className="ctl ctl--select">
              <span>bezelType</span>
              <select value={p.bezelType} onChange={(e) => set("bezelType", e.target.value)}>
                {["convex", "circle", "concave", "lip"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="ctl ctl--select">
              <span>variant</span>
              <select value={p.variant} onChange={(e) => set("variant", e.target.value)}>
                {["regular", "clear"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          {Object.entries(CONTROLS).map(([group, list]) => (
            <fieldset key={group}>
              <legend>{group}</legend>
              {list.map(([k, lo, hi, st]) => (
                <label className="ctl" key={k}>
                  <span>{k}</span>
                  <input type="range" min={lo} max={hi} step={st} value={p[k]} onChange={(e) => set(k, parseFloat(e.target.value))} />
                  <output>{Number.isInteger(st) ? p[k] : Number(p[k]).toFixed(st < 0.01 ? 3 : 2)}</output>
                </label>
              ))}
            </fieldset>
          ))}
        </form>
      </div>

      <div className="output">
        <div className="seg seg--sm" role="tablist" aria-label="Output format">
          {["jsx", "json"].map((o) => (
            <button key={o} role="tab" aria-selected={out === o} className={out === o ? "on" : ""} onClick={() => setOut(o)}>
              {o === "jsx" ? "JSX" : "Props JSON"}
            </button>
          ))}
        </div>
        <CodeBlock code={code} label={out === "jsx" ? "jsx" : "json"} id="play-out" />
      </div>
    </section>
  );
}
