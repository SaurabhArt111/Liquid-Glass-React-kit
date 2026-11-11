import { useState } from "react";
import { inline } from "../util.js";
import { CodeBlock } from "./CodeBlock.jsx";
import { ArrowIcon, DownloadIcon } from "./icons.jsx";
import { KIT_URL } from "./Navbar.jsx";

const LIB_URL = `${import.meta.env.BASE_URL}downloads/liquid-glass-lib.zip`;

const GUIDES = {
  vite: {
    label: "Vite + React",
    steps: [
      ["Download and unzip", "Get the kit (above) and copy the `liquid-glass/` folder into your project's `src/`.", "cp -r liquid-glass-kit/liquid-glass src/liquid-glass"],
      ["Install the one dependency", "React and React DOM you already have. The glass physics run on `motion`.", "npm i motion"],
      ["Use it", "The stylesheet is imported for you. Put glass over something with detail: it refracts what is behind it.", `import { LiquidGlass, LiquidSwitch, LiquidNav } from "./liquid-glass";\n\nexport default function App() {\n  return (\n    <div style={{ position: "relative", height: 320 }}>\n      <LiquidGlass draggable width={260} height={140} radius={70} style={{ position: "absolute", left: 40, top: 40 }}>\n        Hello, glass\n      </LiquidGlass>\n    </div>\n  );\n}`],
    ],
  },
  ts: {
    label: "TypeScript",
    steps: [
      ["Copy the folder", "`index.d.ts` ships inside `liquid-glass/`, so every prop is typed and autocompleted.", "cp -r liquid-glass-kit/liquid-glass src/liquid-glass"],
      ["Install motion", "No other types package is needed.", "npm i motion"],
      ["Import with types", "Components are plain function components; `LiquidGlassProps` is exported for wrappers.", `import { LiquidGlass, type LiquidGlassProps } from "./liquid-glass";\n\nconst card: LiquidGlassProps = { width: 260, height: 140, bezelType: "lip", glassThickness: 100 };\n\nexport const Card = () => <LiquidGlass draggable {...card} />;`],
    ],
  },
  next: {
    label: "Next.js / SSR",
    steps: [
      ["Copy and install", "Same folder, same dependency.", "cp -r liquid-glass-kit/liquid-glass src/liquid-glass\nnpm i motion"],
      ["Render on the client", "Glass measures the browser (backdrop support, devices), so mount it in a client component. It is hydration-safe: the server and first client render both show the CSS glass, then Chromium upgrades to refraction.", `"use client";\nimport { LiquidGlass } from "@/liquid-glass";\n\nexport function Hero() {\n  return <LiquidGlass width={260} height={140} />;\n}`],
      ["Optional: pin a tier", "Call once, before the first render, e.g. in a client layout module. Leave it off to let the governor adapt.", `import { configureLiquidGlass } from "@/liquid-glass";\n\nconfigureLiquidGlass({ quality: "auto" }); // or "high" | "balanced" | "low" | "css"`],
    ],
  },
};

const TREE = `liquid-glass-kit/
├─ README.md                 quick start + full guide
├─ CHANGELOG.md
├─ liquid-glass/             ← drop this into src/
│  ├─ index.js · index.d.ts  the only file you import from
│  ├─ package.json           peer deps + export map
│  ├─ README.md              API, tiers, theming
│  ├─ styles/ core/ components/ lib/
└─ examples/
   └─ vite-react-starter/    runnable: npm i && npm run dev`;

export function Install() {
  const [id, setId] = useState("vite");
  const g = GUIDES[id];
  return (
    <section className="section" id="install">
      <header className="section-head">
        <p className="kicker">Install</p>
        <h2>From download to glass in three minutes.</h2>
        <p>No build plugin, no provider, no config. One folder and one dependency.</p>
      </header>

      <div className="dl">
        <div className="dl-main">
          <h3>liquid-glass-kit.zip</h3>
          <p>The library, a runnable Vite starter, a README and a changelog.</p>
          <div className="dl-actions">
            <a className="btn btn--primary" href={KIT_URL} download>
              <DownloadIcon size={18} /> Download kit
            </a>
            <a className="btn btn--ghost" href={LIB_URL} download>
              Library only <ArrowIcon size={16} />
            </a>
          </div>
        </div>
        <CodeBlock code={TREE} label="kit contents" id="tree" />
      </div>

      <div className="tabs tabs--inline" role="tablist" aria-label="Framework">
        {Object.entries(GUIDES).map(([k, v]) => (
          <button key={k} role="tab" aria-selected={k === id} className={k === id ? "on" : ""} onClick={() => setId(k)}>
            {v.label}
          </button>
        ))}
      </div>

      <ol className="steps">
        {g.steps.map(([t, d, code], i) => (
          <li key={t}>
            <span className="step-n">{i + 1}</span>
            <div>
              <h3>{t}</h3>
              <p dangerouslySetInnerHTML={inline(d)} />
              <CodeBlock code={code} label={code.includes("import") || code.includes("<") ? "jsx" : "shell"} id={`${id}-${i}`} />
            </div>
          </li>
        ))}
      </ol>

      <div className="callout">
        <b>Tip.</b> Glass refracts whatever is behind it, so on a flat colour it just looks tinted. Give it text, an image or a gradient to bend.
        Refraction needs a Chromium browser; Safari and Firefox get the frosted CSS look automatically.
      </div>
    </section>
  );
}
