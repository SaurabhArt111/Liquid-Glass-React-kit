import { useRef, useState } from "react";
import { LiquidGlass, LiquidMagnifier, getQualityName, supportsSvgBackdrop } from "../../liquid-glass";
import { useCopy, useViewportWidth } from "../hooks.js";
import { ArrowIcon, CheckIcon, CopyIcon, DownloadIcon } from "./icons.jsx";
import { KIT_URL } from "./Navbar.jsx";
import { FACTS } from "../data/facts.js";

export function Hero({ onGo }) {
  const stageRef = useRef(null);
  const vw = useViewportWidth();
  const small = vw < 640;
  const [copied, copy] = useCopy();
  const cmd = "npm i motion react react-dom";
  const refracts = supportsSvgBackdrop();

  return (
    <section className="hero" id="overview">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="dot" /> React · Vite · v{FACTS.version}
        </p>
        <h1>
          Liquid Glass for React,
          <br />
          <span className="grad">smooth on every device.</span>
        </h1>
        <p className="lede">
          Real refraction, springy physics and merging lenses, now with an adaptive quality governor, a refraction budget
          and map generation that never blocks a frame. Drop one folder into your Vite app.
        </p>
        <div className="hero-cta">
          <a className="btn btn--primary" href={KIT_URL} download>
            <DownloadIcon size={18} /> Download kit (.zip)
          </a>
          <button type="button" className="btn btn--ghost" onClick={() => onGo("playground")}>
            Open playground <ArrowIcon size={16} />
          </button>
        </div>
        <button type="button" className="cmd" onClick={() => copy(cmd, "cmd")} aria-label="Copy install command">
          <span className="cmd-prompt">$</span>
          <code>{cmd}</code>
          {copied === "cmd" ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        </button>
        <ul className="facts">
          <li><b>{FACTS.gzipKb} kB</b> gzip (excl. motion)</li>
          <li><b>1</b> runtime dependency</li>
          <li><b>TS</b> types included</li>
          <li><b>SSR</b>-safe, a11y roles</li>
        </ul>
      </div>

      <div className="hero-stage-wrap">
        <div ref={stageRef} className="stage stage--aurora hero-stage">
          <div className="stage-words" aria-hidden="true">
            <span>Glass that</span>
            <span>bends the</span>
            <span>page.</span>
          </div>
          <LiquidMagnifier
            dragConstraints={stageRef}
            width={small ? 180 : 250}
            height={small ? 124 : 170}
            bezelWidth={small ? 22 : 32}
            priority={5}
            style={{ position: "absolute", left: small ? "12%" : "20%", top: small ? "34%" : "30%" }}
          />
          <LiquidGlass
            draggable
            dragConstraints={stageRef}
            width={small ? 92 : 120}
            height={small ? 92 : 120}
            radius={60}
            bezelWidth={34}
            bezelType="circle"
            glassThickness={110}
            tint={0.03}
            restScale={0.92}
            activeScale={1.04}
            style={{ position: "absolute", right: small ? "8%" : "12%", bottom: small ? "10%" : "14%" }}
          >
            <span className="orb-label">drag</span>
          </LiquidGlass>
          <div className="stage-chip">
            <i className={refracts ? "ok" : "warn"} />
            {refracts ? "Refraction · SVG backdrop" : "CSS glass · WebKit / Firefox"}
            <b>{getQualityName()}</b>
          </div>
        </div>
      </div>
    </section>
  );
}
