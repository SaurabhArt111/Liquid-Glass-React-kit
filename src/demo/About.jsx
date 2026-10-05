import { useEffect, useState } from "react";
import { LiquidButton, LiquidSplitLens } from "../liquid-glass";

const STEPS = [
  {
    n: "01",
    t: "Bend",
    d: "Glass bends light at its curved rim. We model a bezel profile and run Snell’s law on it to get, for every pixel near the edge, how far a ray is pushed sideways.",
  },
  {
    n: "02",
    t: "Draw",
    d: "Those vectors are painted into an image (red = x shift, green = y shift) right in the browser, then fed to an SVG feDisplacementMap used as a backdrop-filter. Whatever is behind the glass really bends.",
  },
  {
    n: "03",
    t: "Merge",
    d: "For several shapes we compute one signed-distance field with a smooth union. Nearby shapes grow a liquid neck, the refraction map comes from that single field, and the whole thing refracts as one piece of glass.",
  },
  {
    n: "04",
    t: "Move",
    d: "Springs, velocity-driven jelly, press-to-inflate and a glow from the touch point make it feel physical. All of it runs in JavaScript, so it behaves the same on every browser.",
  },
];

const INSIDE = [
  "LiquidGlass",
  "LiquidMerge",
  "LiquidSplitLens",
  "LiquidSwipeView",
  "LiquidSwipeTabs",
  "LiquidBottomNav",
  "LiquidTopNav",
  "LiquidNav",
  "LiquidSwitch",
  "LiquidThemeSwitch",
  "LiquidSlider",
  "LiquidSearchbox",
  "LiquidButton",
  "LiquidMagnifier",
  "LiquidIconButton",
  "LiquidScrollEdge",
];

function useWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

const ext = (url) => window.open(url, "_blank", "noopener,noreferrer");

export function About() {
  const vw = useWidth();
  const lensW = Math.min(620, vw - 96);
  return (
    <div className="about">
      <section className="stage stage--soft about-hero" id="about-top">
        <p className="eyebrow">About</p>
        <h1 className="about-title">
          Liquid Glass,
          <br />
          for React.
        </h1>
        <p className="about-lede">
          A small kit of glass components that actually refract what’s behind them: switches, sliders, nav bars, a
          swipeable tab bar, and lenses that melt into each other. Plain React, plain CSS.
        </p>
        <LiquidSplitLens auto width={lensW} height={230} />
      </section>

      <section className="block about-block">
        <div className="block-head">
          <h2>How it works</h2>
          <p>Four ideas, in the order the pixels see them.</p>
        </div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="block about-block">
        <div className="block-head">
          <h2>What’s inside</h2>
          <p>
            Everything lives in <code>src/liquid-glass/</code>. Copy the folder, add <code>motion</code>, import what you
            need.
          </p>
        </div>
        <ul className="chips">
          {INSIDE.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <section className="block about-block">
        <div className="block-head">
          <h2>Browser support</h2>
        </div>
        <dl className="facts">
          <div>
            <dt>Chrome, Edge, Arc, Brave, Android Chrome</dt>
            <dd>Full refraction, magnification, merging and dispersion.</dd>
          </div>
          <div>
            <dt>Safari and every browser on iPhone / iPad</dt>
            <dd>
              WebKit can’t run SVG filters in <code>backdrop-filter</code> yet, so you get a CSS glass look: light blur,
              rim light, sheen. Motion and merging still work.
            </dd>
          </div>
          <div>
            <dt>Firefox</dt>
            <dd>Same CSS glass look as WebKit.</dd>
          </div>
        </dl>
      </section>

      <section className="block about-block">
        <div className="block-head">
          <h2>Credits</h2>
        </div>
        <div className="credits">
          <p>
            The refraction maths and the SVG displacement approach come from Kube’s article{" "}
            <a href="https://kube.io/blog/liquid-glass-css-svg" target="_blank" rel="noopener noreferrer">
              Liquid Glass in the Browser: Refraction with CSS and SVG
            </a>
            . This project ports it to a plain React + CSS kit and builds the merging, mobile and motion layers on top.
          </p>
          <p>
            The design language (lensing, touch glow, dispersion, morphing tab bars) follows Apple’s WWDC25 session{" "}
            <em>Meet Liquid Glass</em>. This is an independent, unofficial recreation, not affiliated with Apple.
          </p>
          <p>
            Springs and drag come from <a href="https://motion.dev" target="_blank" rel="noopener noreferrer">Motion</a>.
            The original project ships without a licence file, so check its terms before redistributing.
          </p>
        </div>
      </section>

      <section className="stage stage--aurora about-links">
        <LiquidButton width={150} height={46} onClick={() => ext("https://github.com/SaurabhArt111/")}>
          GitHub <span aria-hidden="true">↗</span>
        </LiquidButton>
        <LiquidButton width={190} height={46} onClick={() => ext("https://kube.io/blog/liquid-glass-css-svg")}>
          Original article <span aria-hidden="true">↗</span>
        </LiquidButton>
      </section>
    </div>
  );
}
