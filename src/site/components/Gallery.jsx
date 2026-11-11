import { useRef, useState } from "react";
import {
  LiquidBottomNav,
  LiquidButton,
  LiquidGlass,
  LiquidNav,
  LiquidScrollEdge,
  LiquidSearchbox,
  LiquidSlider,
  LiquidSplitLens,
  LiquidSwitch,
  LiquidThemeSwitch,
  LiquidTopNav,
} from "../../liquid-glass";
import { useViewportWidth } from "../hooks.js";
import { CodeBlock } from "./CodeBlock.jsx";
import { Stage } from "./Stage.jsx";
import { SwipePhone } from "./SwipeDemo.jsx";
import { ChevronDownIcon, ChevronLeftIcon, ChevronUpIcon, CompassIcon, GridIcon, HeartIcon, HomeIcon, MusicIcon, RadioIcon, SearchIcon } from "./demoIcons.jsx";

const NAV_TABS = [
  { value: "home", label: "Home", icon: <HomeIcon /> },
  { value: "explore", label: "Explore", icon: <CompassIcon /> },
  { value: "saved", label: "Saved", icon: <HeartIcon /> },
];
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

function AnyDivDemo() {
  const ref = useRef(null);
  return (
    <Stage variant="stripes" className="stage--tall" stageRef={ref}>
      <LiquidGlass draggable dragConstraints={ref} width={290} height={168} radius={38} bezelWidth={30} glassThickness={90} tint={0.06} restScale={0.94} activeScale={1.03} jelly={1.2} style={{ position: "absolute", left: "10%", top: "16%" }}>
        <div className="panel">
          <strong>Now brewing</strong>
          <span>Ethiopia Guji · washed</span>
          <span className="panel-time">2:41 left</span>
        </div>
      </LiquidGlass>
      <LiquidGlass draggable dragConstraints={ref} width={128} height={128} radius={64} bezelWidth={34} glassThickness={100} bezelType="circle" tint={0.03} restScale={0.9} activeScale={1.05} style={{ position: "absolute", right: "12%", bottom: "14%" }}>
        <span className="orb-label">drag</span>
      </LiquidGlass>
    </Stage>
  );
}

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <Stage variant="grid">
      <LiquidSwitch checked={on} onChange={setOn} />
      <span className="readout">{on ? "on" : "off"}</span>
    </Stage>
  );
}

function SliderDemo() {
  const [v, setV] = useState(35);
  const vw = useViewportWidth();
  return (
    <Stage variant="grid">
      <LiquidSlider width={Math.min(340, vw - 96)} value={v} onChange={setV} />
      <span className="readout">{Math.round(v)}</span>
    </Stage>
  );
}

function SearchDemo() {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState("");
  const vw = useViewportWidth();
  return (
    <Stage variant={busy ? "stripes" : "grid"}>
      <LiquidSearchbox width={Math.min(420, vw - 88)} onSubmit={setLast} />
      <label className="check check--chip">
        <input type="checkbox" checked={busy} onChange={(e) => setBusy(e.target.checked)} />
        Busy background
      </label>
      {last && <span className="readout">↵ {last}</span>}
    </Stage>
  );
}

function ButtonDemo() {
  const [n, setN] = useState(0);
  return (
    <Stage variant="aurora">
      <LiquidButton onClick={() => setN(n + 1)}>Pressed {n}×</LiquidButton>
    </Stage>
  );
}

function NavDemo() {
  const [tab, setTab] = useState("explore");
  return (
    <Stage variant="aurora">
      <LiquidNav label="Demo tabs" items={NAV_TABS} value={tab} onChange={setTab} itemWidth={88} height={68} />
      <span className="readout">{tab}</span>
    </Stage>
  );
}

function ThemeDemo({ theme, setTheme }) {
  return (
    <Stage variant="grid">
      <LiquidThemeSwitch theme={theme} onChange={setTheme} height={72} />
      <span className="readout">{theme}: wired to the whole page</span>
    </Stage>
  );
}

function PhoneDemo() {
  const [tab, setTab] = useState("home");
  const [, setN] = useState(1);
  const vw = useViewportWidth();
  const pw = Math.max(260, Math.min(328, vw - 76));
  const tabW = Math.floor((pw - 24 - 12 - 10 - 62) / 4);
  return (
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
        <LiquidScrollEdge position="top" height={110} radius={42} />
        <LiquidScrollEdge position="bottom" height={130} radius={42} />
        <div className="phone-top">
          <LiquidTopNav
            width={pw - 24}
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
          <LiquidBottomNav items={PHONE_TABS} value={tab} onChange={setTab} itemWidth={tabW} height={62} gap={10} action={{ icon: <SearchIcon />, label: "Search", onClick: () => setTab("new") }} />
        </div>
      </div>
    </Stage>
  );
}

function SplitDemo() {
  return (
    <Stage variant="stripes" className="stage--tall split-stage">
      <LiquidSplitLens auto />
    </Stage>
  );
}

function SwipeDemo() {
  return (
    <Stage variant="grid" className="phone-stage">
      <SwipePhone />
    </Stage>
  );
}

const ITEMS = [
  { id: "div", label: "Any div", text: "LiquidGlass is a regular div. Children sit on top of the glass; add draggable and it gets inflate, refraction and jelly for free.", code: `<LiquidGlass draggable dragConstraints={stageRef} width={290} height={168} radius={38}>\n  <div className="panel">…any JSX…</div>\n</LiquidGlass>`, Demo: AnyDivDemo },
  { id: "switch", label: "Switch", text: "A lip bezel: convex outside, concave in the middle. Tap it, or drag the thumb past the ends.", code: `<LiquidSwitch checked={on} onChange={setOn} />`, Demo: SwitchDemo },
  { id: "slider", label: "Slider", text: "The fill reads through the middle of the lens while the edges refract the track.", code: `<LiquidSlider value={v} onChange={setV} min={0} max={100} />`, Demo: SliderDemo },
  { id: "search", label: "Searchbox", text: "Shrinks at rest, inflates and brightens on focus. Switch the backdrop to see how it refracts.", code: `<LiquidSearchbox width={420} onSubmit={(q) => search(q)} />`, Demo: SearchDemo },
  { id: "button", label: "Button", text: "Presses inflate the glass and it springs back with a bounce.", code: `<LiquidButton onClick={inc}>Pressed {n}×</LiquidButton>`, Demo: ButtonDemo },
  { id: "nav", label: "Nav bar", text: "A glass bar with a lens that slides to the selected item, stretching as it moves. Tap an item or drag the lens.", code: `<LiquidNav items={tabs} value={tab} onChange={setTab} />`, Demo: NavDemo },
  { id: "theme", label: "Theme switch", text: "A real switch with a see-through glass thumb. Tap it or drag it.", code: `<LiquidThemeSwitch theme={theme} onChange={setTheme} />`, Demo: ThemeDemo },
  { id: "phone", label: "Mobile bars", text: "Top bar, tab bar with a detached action button, and the scroll-edge fade, floating over scrolling content. Press the search button and a liquid neck joins it to the tab bar.", code: `<LiquidTopNav title="Home" leading={back} trailing={[next, prev]} />\n<LiquidBottomNav items={tabs} value={tab} onChange={setTab} action={search} />\n<LiquidScrollEdge position="top" />`, Demo: PhoneDemo },
  { id: "split", label: "Split lens", text: "Two lenses refracted as one piece of glass. Close together they grow a liquid neck; apart it pinches off. It plays when scrolled into view; grab a lens to take over.", code: `<LiquidSplitLens auto />   {/* fills its position:relative parent */}`, Demo: SplitDemo },
  { id: "swipe", label: "Swipe pages", text: "Swipe the pages: the tab bar's selection lens splits in two while the page moves and melts back when it settles.", code: `<LiquidSwipeView\n  width={328} height={588}\n  pages={[{ key: "photos", label: "Photos", icon: <PhotoIcon />, content: <Photos /> }, …]}\n/>`, Demo: SwipeDemo },
];

/** Only the selected demo is mounted, so an idle gallery costs nothing (the old page mounted all of them at once). */
export function Gallery({ theme, setTheme }) {
  const [id, setId] = useState("div");
  const item = ITEMS.find((i) => i.id === id);
  const { Demo } = item;
  return (
    <section className="section" id="components">
      <header className="section-head">
        <p className="kicker">Components</p>
        <h2>One primitive, ten ready-made pieces.</h2>
        <p>Each one is a thin preset over <code>LiquidGlass</code>. Pick one, try it, copy the snippet.</p>
      </header>
      <div className="gallery">
        <div className="tabs" role="tablist" aria-label="Components">
          {ITEMS.map((i) => (
            <button key={i.id} role="tab" aria-selected={i.id === id} className={i.id === id ? "on" : ""} onClick={() => setId(i.id)}>
              {i.label}
            </button>
          ))}
        </div>
        <div className="gallery-body" role="tabpanel">
          <div className="gallery-demo">
            <Demo theme={theme} setTheme={setTheme} key={id} />
          </div>
          <div className="gallery-info">
            <h3>{item.label}</h3>
            <p>{item.text}</p>
            <CodeBlock code={item.code} label="jsx" id={`g-${id}`} />
          </div>
        </div>
      </div>
    </section>
  );
}
