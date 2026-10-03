import { useEffect, useRef, useState } from "react";
import {
  LiquidBottomNav,
  LiquidButton,
  LiquidGlass,
  LiquidMagnifier,
  LiquidNav,
  LiquidScrollEdge,
  LiquidSearchbox,
  LiquidSlider,
  LiquidSplitLens,
  LiquidSwitch,
  LiquidThemeSwitch,
  LiquidTopNav,
  MoonIcon,
  SunIcon,
  isIOS,
  supportsSvgBackdrop,
} from "../liquid-glass";
import {
  BookIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  CompassIcon,
  GridIcon,
  HeartIcon,
  HomeIcon,
  InfoIcon,
  LayersIcon,
  MusicIcon,
  RadioIcon,
  SearchIcon,
  SlidersIcon,
} from "./icons.jsx";
import { About } from "./About.jsx";
import { SwipePhone } from "./SwipeDemo.jsx";

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

/** Inner width of the phone mocks: 328px, or less on narrow screens. */
function usePhoneWidth() {
  const vw = useViewportWidth();
  return Math.max(260, Math.min(328, vw - 76));
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
  { id: "home", long: "Home", short: "Home" },
  { id: "kit", long: "Kit", short: "Kit" },
  { id: "split", long: "Split lens", short: "Split" },
  { id: "swipe", long: "Swipe", short: "Swipe" },
  { id: "any", long: "Any div", short: "Div" },
  { id: "play", long: "Playground", short: "Play" },
  { id: "usage", long: "Usage", short: "Docs" },
];
const NAV_ITEMS = [...SECTIONS, { id: "about", long: "About", short: "About" }];

/** Tiny hash router: "#/" is the home page, "#/about" the About page. */
function useRoute() {
  const read = () => (window.location.hash.startsWith("#/about") ? "about" : "home");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const navigate = (to) => {
    const hash = to === "about" ? "#/about" : "#/";
    if (window.location.hash === hash) setRoute(to);
    else window.location.hash = hash;
  };
  return [route, navigate];
}

/** Highlights the section under the middle of the viewport; `lock` pauses it during click-scrolls. */
function useScrollSpy(ids, lock, enabled) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);
  return [active, setActive];
}

/* ---------------------------------- top bar --------------------------------- */

function TopBar({ theme, setTheme, value, onGo }) {
  const vw = useViewportWidth();
  const pad = 5;
  const height = 56;
  const switchH = 44;
  const themeW = Math.round(switchH * 2.388);
  const navItem = Math.max(40, Math.min(92, Math.floor((vw - 24 - 8 - themeW - pad * 2) / NAV_ITEMS.length)));
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
        label="Pages"
        height={height}
        padding={pad}
        itemWidth={navItem}
        items={NAV_ITEMS.map((s) => ({ value: s.id, label: long ? s.long : s.short, href: s.id === "about" ? "#/about" : "#/" }))}
        value={value}
        onChange={onGo}
        {...backing}
      />
      <LiquidThemeSwitch theme={theme} onChange={setTheme} height={switchH} />
    </div>
  );
}

const DOCK_ITEMS = [
  { value: "home", label: "Home", icon: <HomeIcon /> },
  { value: "kit", label: "Kit", icon: <GridIcon /> },
  { value: "split", label: "Split", icon: <LayersIcon /> },
  { value: "lab", label: "Lab", icon: <SlidersIcon /> },
  { value: "usage", label: "Docs", icon: <BookIcon /> },
];
const DOCK_OF = { home: "home", kit: "kit", split: "split", swipe: "split", any: "lab", play: "lab", usage: "usage" };

/** On phones the page navigation becomes a real bottom tab bar; About is its detached action button. */
function MobileDock({ active, route, onGo }) {
  const vw = useViewportWidth();
  const gap = 10;
  const size = 60;
  const itemWidth = Math.max(44, Math.min(64, Math.floor((vw - 24 - gap - size - 12) / DOCK_ITEMS.length)));
  return (
    <div className="dock">
      <LiquidBottomNav
        label="Sections"
        items={DOCK_ITEMS}
        value={route === "about" ? null : DOCK_OF[active]}
        onChange={(v) => onGo(v === "lab" ? "any" : v)}
        itemWidth={itemWidth}
        height={size + 4}
        gap={gap}
        actionSize={size + 4}
        action={{
          label: "About",
          icon: <InfoIcon />,
          active: route === "about",
          onClick: () => onGo("about"),
        }}
      />
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

function Card({ title, text, code, children, wide }) {
  return (
    <article className={`card${wide ? " card--wide" : ""}`}>
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
      text="A real switch that works like the nav bar: a see-through glass thumb that slides, stretches and bounces. Tap it or drag it. It's wired to the whole page."
      code={`<LiquidThemeSwitch theme={theme} onChange={setTheme} />`}
    >
      <Stage variant="grid">
        <LiquidThemeSwitch theme={theme} onChange={setTheme} height={72} />
        <span className="readout">{theme}</span>
      </Stage>
    </Card>
  );
}

const TILES = [
  { t: "Summer Vibes", s: "Apple Music Summertime", bg: "linear-gradient(135deg,#ff5f7e,#ffb347)" },
  { t: "Viral Rewind", s: "Trending now", bg: "conic-gradient(from 200deg at 30% 60%,#3f6bff,#8d4dff,#18d6c9,#3f6bff)" },
  { t: "Night Drive", s: "Synthwave essentials", bg: "linear-gradient(160deg,#0f1330,#6a2cff 55%,#ff4fa3)" },
  { t: "Green Room", s: "Focus & flow", bg: "linear-gradient(135deg,#0b8f4d,#b6f24b)" },
  { t: "Golden Hour", s: "Sunset sessions", bg: "linear-gradient(200deg,#ffd166,#ff6a5c 60%,#7a1fa2)" },
];

const PHONE_TABS = [
  { value: "home", label: "Home", icon: <HomeIcon /> },
  { value: "new", label: "New", icon: <GridIcon /> },
  { value: "radio", label: "Radio", icon: <RadioIcon /> },
  { value: "library", label: "Library", icon: <MusicIcon /> },
];

function PhoneCard() {
  const [tab, setTab] = useState("home");
  const [n, setN] = useState(1);
  const pw = usePhoneWidth();
  const tabW = Math.floor((pw - 24 - 12 - 10 - 62) / 4);
  return (
    <Card
      wide
      title="Mobile bars"
      text="A top bar, a tab bar with a detached action button, and the scroll-edge fade, all floating over scrolling content. Scroll the phone; press or pull the search button and a liquid neck joins it to the tab bar."
      code={`<LiquidTopNav title="Thailand Trip" leading={back} trailing={[up, down]} />
<LiquidBottomNav items={tabs} value={tab} onChange={setTab} action={search} />
<LiquidScrollEdge position="top" />`}
    >
      <Stage variant="grid" className="phone-stage">
        <div className="phone">
          <div className="phone-scroll" tabIndex={0} aria-label="Scrollable demo content">
            {TILES.concat(TILES).map((t, i) => (
              <div className="tile" key={i} style={{ background: t.bg }}>
                <strong>{t.t}</strong>
                <span>{t.s}</span>
              </div>
            ))}
          </div>
          <LiquidScrollEdge position="top" height={110} />
          <LiquidScrollEdge position="bottom" height={130} />
          <div className="phone-top">
            <LiquidTopNav
              width={pw - 12}
              height={44}
              title={tab === "home" ? "Home" : tab[0].toUpperCase() + tab.slice(1)}
              leading={{ icon: <ChevronLeftIcon />, label: "Back", onClick: () => setN(1) }}
              trailing={[
                { icon: <ChevronDownIcon />, label: "Next", onClick: () => setN((v) => v + 1) },
                { icon: <ChevronUpIcon />, label: "Previous", onClick: () => setN((v) => Math.max(1, v - 1)) },
              ]}
            />
          </div>
          <div className="phone-bottom">
            <LiquidBottomNav
              items={PHONE_TABS}
              value={tab}
              onChange={setTab}
              itemWidth={tabW}
              height={62}
              gap={10}
              action={{ icon: <SearchIcon />, label: "Search", onClick: () => setTab("new") }}
            />
          </div>
        </div>
      </Stage>
    </Card>
  );
}

/* --------------------------- split lens + swipe sections --------------------------- */

function SplitSection() {
  const vw = useViewportWidth();
  const width = Math.max(300, Math.min(760, vw - 64));
  return (
    <section className="block" id="split">
      <div className="block-head">
        <h2>Split lens</h2>
        <p>
          Two lenses refracted as one piece of glass. When they get close a liquid neck forms; when they part it pinches
          off. This is the morph behind Liquid Glass tab bars.
        </p>
      </div>
      <div className="grid grid--wide">
        <Card
          wide
          title="Drag"
          text="Pull the lenses together and apart."
          code={`<LiquidSplitLens width={760} height={300} />`}
        >
          <Stage variant="stripes" className="tall">
            <LiquidSplitLens width={width} height={300} />
          </Stage>
        </Card>
        <Card
          wide
          title="Auto"
          text="Plays on its own when this area scrolls into view: the lenses drift together, melt into one body, then pinch apart. Grab one to take over; it resumes when you let go."
          code={`<LiquidSplitLens auto width={760} height={300} />`}
        >
          <Stage variant="aurora" className="tall">
            <LiquidSplitLens auto width={width} height={300} />
          </Stage>
        </Card>
      </div>
    </section>
  );
}

function SwipeSection() {
  const [page, setPage] = useState(0);
  const names = ["Photos", "Map", "Chat"];
  return (
    <section className="block" id="swipe">
      <div className="block-head">
        <h2>Mobile split lens</h2>
        <p>
          Swipe the pages left and right. The tab bar’s selection lens is two glass blobs in one body: as you swipe, it
          stretches and splits in two, then melts back into a single lens on the new page. You can also tap a tab, or
          slide along the bar.
        </p>
      </div>
      <Card
        wide
        title="Swipe pages"
        text="Drag the page sideways (or use a touch screen)."
        code={`<LiquidSwipeView
  width={328} height={588}
  pages={[{ key: "photos", label: "Photos", icon: <PhotoIcon />, content: <Photos /> }, …]}
/>`}
      >
        <Stage variant="grid" className="phone-stage">
          <SwipePhone onIndexChange={setPage} />
        </Stage>
        <span className="readout readout--center">page: {names[page]}</span>
      </Card>
    </section>
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
  dispersion: 0.04,
  glow: 0.5,
  dim: 0,
  bezelType: "convex",
  variant: "regular",
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
  ["dispersion", 0, 0.15, 0.005],
  ["glow", 0, 1, 0.05],
  ["dim", 0, 0.6, 0.02],
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
          <label className="ctl">
            <span>variant</span>
            <select value={p.variant} onChange={(e) => set("variant", e.target.value)}>
              <option value="regular">regular</option>
              <option value="clear">clear</option>
            </select>
          </label>
          {CONTROLS.map(([k, lo, hi, st]) => (
            <label className="ctl" key={k}>
              <span>{k}</span>
              <input type="range" min={lo} max={hi} step={st} value={p[k]} onChange={(e) => set(k, parseFloat(e.target.value))} />
              <output>{Number.isInteger(st) ? p[k] : p[k].toFixed(st < 0.01 ? 3 : 2)}</output>
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
        <Code>{`import { LiquidGlass, LiquidSwipeView, LiquidSplitLens } from "./liquid-glass";

<LiquidGlass draggable width={220} height={120}>
  …anything…
</LiquidGlass>

<LiquidSplitLens auto width={560} height={260} />`}</Code>
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
  const vw = useViewportWidth();
  const [theme, setTheme] = useTheme();
  const [route, navigate] = useRoute();
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const lock = useRef(false);
  const pending = useRef(null);
  const [active, setActive] = useScrollSpy(SECTIONS.map((s) => s.id), lock, route === "home");

  const scrollToSection = (id, instant) => {
    setActive(id);
    lock.current = true;
    const unlock = () => {
      lock.current = false;
    };
    window.addEventListener("scrollend", unlock, { once: true });
    setTimeout(unlock, 1600); // fallback where `scrollend` doesn't exist
    const behavior = instant ? "auto" : "smooth";
    if (id === "home") window.scrollTo({ top: 0, behavior });
    else document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
  };

  const go = (id) => {
    if (id === "about") {
      navigate("about");
      return;
    }
    if (route !== "home") {
      pending.current = id; // scroll once the home page is back on screen
      navigate("home");
      return;
    }
    scrollToSection(id);
  };

  useEffect(() => {
    if (route === "about") {
      window.scrollTo({ top: 0 });
      return;
    }
    if (pending.current) {
      const id = pending.current;
      pending.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(id, true)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  const navValue = route === "about" ? "about" : active;

  return (
    <>
      {vw < 640 ? (
        <>
          <MobileDock active={active} route={route} onGo={go} />
          <div className="mobile-theme">
            <LiquidThemeSwitch theme={theme} onChange={setTheme} height={38} />
          </div>
        </>
      ) : (
        <TopBar theme={theme} setTheme={setTheme} value={navValue} onGo={go} />
      )}
      <main className="page">
        {!supported && !noticeDismissed && (
          <p className="notice" role="status">
            <span>
              {isIOS() ? (
                <>
                  On iPhone and iPad every browser uses Apple’s WebKit, which can’t run SVG refraction in{" "}
                  <code>backdrop-filter</code> yet. You’re seeing the CSS glass look (rim light, sheen, light blur).
                  Open this on desktop Chrome, Edge or Arc, or Android Chrome, for full refraction.
                </>
              ) : (
                <>
                  Your browser can’t run SVG refraction in <code>backdrop-filter</code> (Chromium only). You’re seeing
                  the CSS glass look instead. Open this in Chrome, Edge or Arc for full refraction.
                </>
              )}
            </span>
            <button type="button" className="notice-close" aria-label="Dismiss" onClick={() => setNoticeDismissed(true)}>
              ×
            </button>
          </p>
        )}

        {route === "about" ? (
          <About />
        ) : (
          <>
            <section id="home">
              <Hero />
            </section>

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
                <PhoneCard />
              </div>
            </section>

            <SplitSection />
            <SwipeSection />
            <AnyDiv />
            <Playground />
            <Usage />
          </>
        )}

        <footer className="foot">
          <span>Based on Kube’s “Liquid Glass in the Browser: Refraction with CSS and SVG”. Ported to plain React + CSS.</span>
          <LiquidButton
            className="contact"
            width={126}
            height={42}
            onClick={() => window.open("https://github.com/SaurabhArt111/", "_blank", "noopener,noreferrer")}
          >
            GitHub <span aria-hidden="true">↗</span>
          </LiquidButton>
        </footer>
      </main>
    </>
  );
}
