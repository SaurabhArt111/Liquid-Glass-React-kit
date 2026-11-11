import { useRef, useState } from "react";
import { LiquidGlass, LiquidNav, LiquidSwitch, setQuality, useQuality } from "./liquid-glass";

const TABS = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "about", label: "About" },
];

export default function App() {
  const stage = useRef(null);
  const [tab, setTab] = useState("home");
  const [on, setOn] = useState(true);
  const [tier] = useQuality();

  return (
    <div ref={stage} className="stage">
      {/* Glass refracts what is behind it, so give it something with detail. */}
      <h1>
        Glass that
        <br />
        bends the page.
      </h1>

      <LiquidGlass
        draggable
        dragConstraints={stage}
        width={260}
        height={150}
        radius={70}
        glassThickness={90}
        style={{ position: "absolute", left: "12%", top: "36%" }}
      >
        <span className="label">drag me</span>
      </LiquidGlass>

      <div className="bar">
        <LiquidNav items={TABS} value={tab} onChange={setTab} itemWidth={92} height={56} />
        <LiquidSwitch checked={on} onChange={setOn} />
      </div>

      <p className="tier">
        quality tier: <b>{tier}</b>{" "}
        <button onClick={() => setQuality("auto")}>auto</button>
        <button onClick={() => setQuality("balanced")}>balanced</button>
        <button onClick={() => setQuality("css")}>css</button>
      </p>
    </div>
  );
}
