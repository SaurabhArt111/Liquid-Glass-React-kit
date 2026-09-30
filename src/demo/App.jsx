import { useEffect, useRef, useState } from "react";
import {
  LiquidButton,
  LiquidGlass,
  LiquidMagnifier,
  LiquidSearchbox,
  LiquidSlider,
  LiquidSwitch,
  supportsSvgBackdrop,
} from "../liquid-glass";

function useViewportWidth() {
  const [w, setW] = useState(typeof window === "undefined" ? 1200 : window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

/** A backdrop with enough detail for refraction to be visible. */
const Stage = ({ variant = "grid", className = "", children, stageRef }) => (
  <div ref={stageRef} className={`stage stage--${variant} ${className}`}>
    {children}
  </div>
);

const Code = ({ children }) => (
  <pre className="code">
    <code>{children}</code>
  </pre>
);

function Card({ title, text, code, children }) {
  return (
    <article className="card">
      <header>
        <h3>{title}</h3>
        <p>{text}</p>
      </header>
      {children}
      <Code>{code}</Code>
    </article>
  );
}

/* ---------------------------------- hero ---------------------------------- */

function Hero() {
  const stageRef = useRef(null);
  return (
    <Stage variant="aurora" className="hero" stageRef={stageRef}>
      <h1 className="hero-title">
        Glass that
        <br />
        bends the page.
      </h1>
      <p className="hero-sub">Drag the lens. Everything below is the same primitive, one div.</p>
      <LiquidMagnifier
        dragConstraints={stageRef}
        width={280}
        height={190}
        bezelWidth={32}
        style={{ position: "absolute", left: "36%", top: 84 }}
      />
    </Stage>
  );
}

/* ------------------------------- kit cards -------------------------------- */

function SwitchCard() {
  const [on, setOn] = useState(true);
  return (
    <Card
      title="Switch"
      text="A lip bezel: convex outside, concave in the middle. Tap it, or drag the thumb past the ends."
      code={`<LiquidSwitch checked={on} onChange={setOn} />`}
    >
      <Stage variant="grid">
        <LiquidSwitch checked={on} onChange={setOn} />
        <span className="readout">{on ? "on" : "off"}</span>
      </Stage>
    </Card>
  );
}

function SliderCard() {
  const [v, setV] = useState(35);
  const vw = useViewportWidth();
  const width = Math.min(330, vw - 96);
  return (
    <Card
      title="Slider"
      text="The fill reads through the middle of the lens while the edges refract the track."
      code={`<LiquidSlider value={v} onChange={setV} min={0} max={100} />`}
    >
      <Stage variant="grid">
        <LiquidSlider width={width} value={v} onChange={setV} />
        <span className="readout">{Math.round(v)}</span>
      </Stage>
    </Card>
  );
}

function SearchCard() {
  const [image, setImage] = useState(false);
  const [last, setLast] = useState("");
  const vw = useViewportWidth();
  const width = Math.min(420, vw - 80);
  return (
    <Card
      title="Searchbox"
      text="Shrinks at rest, inflates and brightens on focus. Switch the backdrop to see how it refracts."
      code={`<LiquidSearchbox onSubmit={(q) => search(q)} />`}
    >
      <Stage variant={image ? "stripes" : "grid"}>
        <LiquidSearchbox width={width} onSubmit={setLast} />
        <label className="toggle">
          <input type="checkbox" checked={image} onChange={(e) => setImage(e.target.checked)} />
          Busy background
        </label>
        {last && <span className="readout">↵ {last}</span>}
      </Stage>
    </Card>
  );
}

function ButtonCard() {
  const [n, setN] = useState(0);
  return (
    <Card
      title="Button"
      text="Presses inflate the glass and it springs back with a bounce."
      code={`<LiquidButton onClick={inc}>Pressed {n}×</LiquidButton>`}
    >
      <Stage variant="aurora">
        <LiquidButton onClick={() => setN(n + 1)}>Pressed {n}×</LiquidButton>
      </Stage>
    </Card>
  );
}

/* ------------------------------- any div ---------------------------------- */

function AnyDiv() {
  const stageRef = useRef(null);
  return (
    <section className="block">
      <div className="block-head">
        <h2>Put anything in it.</h2>
        <p>
          <code>LiquidGlass</code> is a regular div. Children sit on top of the glass; add <code>draggable</code> and it
          gets the inflate, refraction and jelly for free.
        </p>
      </div>
      <Stage variant="stripes" className="tall" stageRef={stageRef}>
        <LiquidGlass
          draggable
          dragConstraints={stageRef}
          width={300}
          height={176}
          radius={38}
          bezelWidth={30}
          glassThickness={90}
          refraction={1}
          tint={0.06}
          restScale={0.94}
          activeScale={1.03}
          jelly={1.2}
          style={{ position: "absolute", left: "12%", top: "18%" }}
        >
          <div className="panel">
            <strong>Now brewing</strong>
            <span>Ethiopia Guji · washed</span>
            <span className="panel-time">2:41 left</span>
          </div>
        </LiquidGlass>
        <LiquidGlass
          draggable
          dragConstraints={stageRef}
          width={132}
          height={132}
          radius={66}
          bezelWidth={34}
          glassThickness={100}
          bezelType="circle"
          tint={0.03}
          restScale={0.9}
          activeScale={1.05}
          style={{ position: "absolute", right: "14%", bottom: "16%" }}
        >
          <span className="orb">Drag</span>
        </LiquidGlass>
      </Stage>
      <Code>{`<LiquidGlass draggable dragConstraints={stageRef} width={300} height={176} radius={38}>
  <div className="panel">…any JSX…</div>
</LiquidGlass>`}</Code>
    </section>
  );
}

/* ------------------------------ playground -------------------------------- */

const DEFAULTS = {
  width: 260,
  height: 140,
  radius: 70,
  bezelWidth: 40,
  glassThickness: 90,
  refractiveIndex: 1.5,
  blur: 0,
  refraction: 1,
  specularOpacity: 0.5,
  specularSaturation: 6,
  magnify: 0,
  tint: 0.04,
  bezelType: "convex",
};

const CONTROLS = [
  ["width", 100, 380, 1],
  ["height", 60, 220, 1],
  ["radius", 0, 110, 1],
  ["bezelWidth", 4, 80, 1],
  ["glassThickness", 10, 200, 1],
  ["refractiveIndex", 1, 2, 0.05],
  ["refraction", 0, 1, 0.01],
  ["blur", 0, 10, 0.1],
  ["specularOpacity", 0, 1, 0.01],
  ["specularSaturation", 0, 20, 1],
  ["magnify", 0, 80, 1],
  ["tint", 0, 0.5, 0.01],
];

function Playground() {
  const stageRef = useRef(null);
  const [p, setP] = useState(DEFAULTS);
  const [hold, setHold] = useState(false);
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));

  return (
    <section className="block">
      <div className="block-head">
        <h2>Playground</h2>
        <p>Every optical property is a prop. Geometry changes re-render the maps once and cache them.</p>
      </div>
      <div className="play">
        <Stage variant="stripes" className="tall" stageRef={stageRef}>
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
        <form className="controls" onSubmit={(e) => e.preventDefault()}>
          <label className="ctl">
            <span>bezelType</span>
            <select value={p.bezelType} onChange={(e) => set("bezelType", e.target.value)}>
              <option value="convex">convex</option>
              <option value="circle">circle</option>
              <option value="concave">concave</option>
              <option value="lip">lip</option>
            </select>
          </label>
          {CONTROLS.map(([k, lo, hi, st]) => (
            <label className="ctl" key={k}>
              <span>{k}</span>
              <input type="range" min={lo} max={hi} step={st} value={p[k]} onChange={(e) => set(k, parseFloat(e.target.value))} />
              <output>{Number.isInteger(st) ? p[k] : p[k].toFixed(2)}</output>
            </label>
          ))}
          <label className="toggle">
            <input type="checkbox" checked={hold} onChange={(e) => setHold(e.target.checked)} />
            Hold in pressed state
          </label>
          <button type="button" className="reset" onClick={() => setP(DEFAULTS)}>
            Reset
          </button>
        </form>
      </div>
    </section>
  );
}

/* ---------------------------------- app ----------------------------------- */

export default function App() {
  const supported = supportsSvgBackdrop();
  return (
    <main className="page">
      {!supported && (
        <p className="notice">
          Your browser doesn’t support SVG filters in <code>backdrop-filter</code> (Chromium only). You’re seeing the
          frosted-glass fallback — open this in Chrome, Edge or Arc for full refraction.
        </p>
      )}
      <Hero />

      <section className="block">
        <div className="block-head">
          <h2>The kit</h2>
          <p>Each one is a thin preset over <code>LiquidGlass</code>.</p>
        </div>
        <div className="grid">
          <SwitchCard />
          <SliderCard />
          <SearchCard />
          <ButtonCard />
        </div>
      </section>

      <AnyDiv />
      <Playground />

      <footer className="foot">
        <span>Based on Kube’s “Liquid Glass in the Browser: Refraction with CSS and SVG”. Ported to plain React + CSS.</span>
        <a className="contact" href="https://github.com/SaurabhArt111/" target="_blank" rel="noopener noreferrer">
          <span aria-hidden="true">↗</span>
          GitHub
        </a>
      </footer>
    </main>
  );
}
