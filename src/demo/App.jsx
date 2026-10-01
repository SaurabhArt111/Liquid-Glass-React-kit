import { useEffect, useRef, useState } from "react";
import {
  LiquidButton,
  LiquidGlass,
  LiquidMagnifier,
  LiquidNav,
  LiquidSearchbox,
  LiquidSlider,
  LiquidSwitch,
  LiquidThemeSwitch,
  supportsSvgBackdrop,
} from "../liquid-glass";
import { CompassIcon, HeartIcon, HomeIcon } from "./icons.jsx";

/* --------------------------------- helpers --------------------------------- */

function useViewportWidth() {
  const [w, setW] = useState(typeof window === "undefined" ? 1200 : window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("lg-theme", theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);
  return [theme, setTheme];
}

const SECTIONS = [
  { id: "kit", long: "Kit", short: "Kit" },
  { id: "any", long: "Any div", short: "Div" },
  { id: "play", long: "Playground", short: "Play" },
  { id: "usage", long: "Usage", short: "Docs" },
];

/** Highlights the section under the middle of the viewport; `lock` pauses it during click-scrolls. */
function useScrollSpy(ids, lock) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        if (lock.current) return;
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [active, setActive];
}

/* ---------------------------------- top bar --------------------------------- */

function TopBar({ theme, setTheme, active, onGo }) {
  const vw = useViewportWidth();
  const compact = vw < 640;
  const height = compact ? 52 : 56;
  const pad = 5;
  const themeItem = compact ? 44 : 60;
  const themeW = themeItem * 2 + pad * 2;
  const navItem = Math.max(40, Math.min(96, Math.floor((vw - 24 - 8 - themeW - pad * 2) / SECTIONS.length)));
  const long = navItem >= 84;
  // Keep the surface translucent enough for the backdrop and refraction to read.
  const backing =
    theme === "light"
      ? {
          tint: 0.1,
          activeTint: 0.16,
          tintColor: "255,255,255",
          glassThickness: 90,
          refraction: 0.9,
          restRefraction: 0.72,
          blur: 0.4,
          specularOpacity: 0.65,
          specularSaturation: 8,
        }
      : {
          tint: 0.08,
          activeTint: 0.14,
          tintColor: "12,16,40",
          glassThickness: 90,
          refraction: 0.9,
          restRefraction: 0.72,
          blur: 0.4,
          specularOpacity: 0.65,
          specularSaturation: 8,
        };

  return (
    <div className="topbar">
      <LiquidNav
        label="Sections"
        height={height}
        padding={pad}
        itemWidth={navItem}
        items={SECTIONS.map((s) => ({ value: s.id, label: long ? s.long : s.short, href: "#" + s.id }))}
        value={active}
        onChange={onGo}
        {...backing}
      />
      <LiquidThemeSwitch theme={theme} onChange={setTheme} itemWidth={themeItem} height={height} padding={pad} {...backing} />
    </div>
  );
}

/* --------------------------------- building blocks --------------------------------- */

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
  const small = useViewportWidth() < 640;
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
        width={small ? 190 : 280}
        height={small ? 130 : 190}
        bezelWidth={small ? 22 : 32}
        style={{ position: "absolute", left: small ? "14%" : "36%", top: small ? 150 : 84 }}
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

const TABS = [
  { value: "home", label: "Home", icon: <HomeIcon /> },
  { value: "explore", label: "Explore", icon: <CompassIcon /> },
  { value: "saved", label: "Saved", icon: <HeartIcon /> },
];

function NavCard() {
  const [tab, setTab] = useState("explore");
  return (
    <Card
      title="Nav bar"
      text="A glass bar with a lens that slides to the selected item, stretching as it moves. Tap an item or drag the lens."
      code={`<LiquidNav items={tabs} value={tab} onChange={setTab} />`}
    >
      <Stage variant="aurora">
        <LiquidNav label="Demo tabs" items={TABS} value={tab} onChange={setTab} itemWidth={88} height={68} />
        <span className="readout">{tab}</span>
      </Stage>
    </Card>
  );
}

function ThemeCard({ theme, setTheme }) {
  return (
    <Card
      title="Theme switch"
      text="The same nav with sun and moon items. This one is wired to the whole page, try it."
      code={`<LiquidThemeSwitch theme={theme} onChange={setTheme} />`}
    >
      <Stage variant="grid">
        <LiquidThemeSwitch theme={theme} onChange={setTheme} itemWidth={72} height={64} padding={6} />
        <span className="readout">{theme}</span>
      </Stage>
    </Card>
  );
}

/* ------------------------------- any div ---------------------------------- */

function AnyDiv() {
  const stageRef = useRef(null);
  return (
    <section className="block" id="any">
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
    <section className="block" id="play">
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

/* ---------------------------------- usage ---------------------------------- */

function Usage() {
  return (
    <section className="block" id="usage">
      <div className="block-head">
        <h2>Use it in your app</h2>
        <p>
          Copy <code>src/liquid-glass/</code> into your project, add one dependency, and import. No build plugin, no
          config.
        </p>
      </div>
      <div className="usage">
        <Code>{`npm i motion react react-dom`}</Code>
        <Code>{`import { LiquidGlass, LiquidNav, LiquidSwitch } from "./liquid-glass";

<LiquidGlass draggable width={220} height={120}>
  …anything…
</LiquidGlass>`}</Code>
      </div>
      <p className="usage-note">
        Refraction uses <code>backdrop-filter: url(#svg)</code>, which only Chromium browsers implement. Everywhere else
        the components fall back to a frosted blur.
      </p>
    </section>
  );
}

/* ---------------------------------- app ----------------------------------- */

export default function App() {
  const supported = supportsSvgBackdrop();
  const [theme, setTheme] = useTheme();
  const lock = useRef(false);
  const [active, setActive] = useScrollSpy(SECTIONS.map((s) => s.id), lock);

  const go = (id) => {
    setActive(id);
    lock.current = true;
    const unlock = () => {
      lock.current = false;
    };
    window.addEventListener("scrollend", unlock, { once: true });
    setTimeout(unlock, 1600); // fallback where `scrollend` doesn't exist
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <TopBar theme={theme} setTheme={setTheme} active={active} onGo={go} />
      <main className="page">
        {!supported && (
          <p className="notice">
            Your browser doesn’t support SVG filters in <code>backdrop-filter</code> (Chromium only). You’re seeing the
            frosted-glass fallback — open this in Chrome, Edge or Arc for full refraction.
          </p>
        )}
        <Hero />

        <section className="block" id="kit">
          <div className="block-head">
            <h2>The kit</h2>
            <p>
              Each one is a thin preset over <code>LiquidGlass</code>.
            </p>
          </div>
          <div className="grid">
            <SwitchCard />
            <SliderCard />
            <SearchCard />
            <ButtonCard />
            <NavCard />
            <ThemeCard theme={theme} setTheme={setTheme} />
          </div>
        </section>

        <AnyDiv />
        <Playground />
        <Usage />

        <footer className="foot">
          <span>Based on Kube’s “Liquid Glass in the Browser: Refraction with CSS and SVG”. Ported to plain React + CSS.</span>
          <LiquidButton
            className="contact"
            width={126}
            height={42}
            onClick={() => window.open("https://github.com/SaurabhArt111/", "_blank", "noopener,noreferrer")}
          >
            GitHub <span aria-hidden="true" >↗</span>
          </LiquidButton>
        </footer>
      </main>
    </>
  );
}
