import { LiquidBottomNav, LiquidNav, LiquidThemeSwitch } from "../../liquid-glass";
import { useViewportWidth } from "../hooks.js";
import { BookIcon, BoxIcon, DownloadIcon, GaugeIcon, HomeIcon, Logo, SlidersIcon } from "./icons.jsx";

export const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "components", label: "Components" },
  { id: "playground", label: "Playground" },
  { id: "install", label: "Install" },
  { id: "api", label: "API" },
  { id: "faq", label: "FAQ" },
];

const DOCK = [
  { value: "overview", label: "Home", icon: <HomeIcon /> },
  { value: "performance", label: "Speed", icon: <GaugeIcon /> },
  { value: "components", label: "Kit", icon: <BoxIcon /> },
  { value: "playground", label: "Play", icon: <SlidersIcon /> },
  { value: "install", label: "Docs", icon: <BookIcon /> },
];
const DOCK_OF = { overview: "overview", performance: "performance", components: "components", playground: "playground", install: "install", api: "install", faq: "install" };

export const KIT_URL = `${import.meta.env.BASE_URL}downloads/liquid-glass-kit.zip`;

export function Navbar({ theme, setTheme, active, onGo }) {
  const vw = useViewportWidth();

  if (vw < 860) {
    const gap = 10;
    const size = 60;
    const itemWidth = Math.max(44, Math.min(64, Math.floor((vw - 24 - gap - size - 12) / DOCK.length)));
    return (
      <>
        <header className="topbar topbar--mobile">
          <a className="brand" href="#overview" onClick={(e) => (e.preventDefault(), onGo("overview"))}>
            <Logo />
            <span>liquid-glass</span>
          </a>
          <LiquidThemeSwitch theme={theme} onChange={setTheme} height={36} />
        </header>
        <div className="dock">
          <LiquidBottomNav
            label="Sections"
            items={DOCK}
            value={DOCK_OF[active]}
            onChange={onGo}
            itemWidth={itemWidth}
            height={size + 4}
            gap={gap}
            actionSize={size + 4}
            action={{ label: "Download kit", icon: <DownloadIcon />, onClick: () => (window.location.href = KIT_URL) }}
          />
        </div>
      </>
    );
  }

  const pad = 5;
  const height = 52;
  const switchH = 40;
  const themeW = Math.round(switchH * 2.388);
  const reserved = 330 + themeW; // brand + download button + theme switch
  const itemWidth = Math.max(60, Math.min(124, Math.floor((vw - reserved - pad * 2) / SECTIONS.length)));
  const backing =
    theme === "light"
      ? { tint: 0.5, activeTint: 0.56, tintColor: "255,255,255" }
      : { tint: 0.1, activeTint: 0.16, tintColor: "14,18,40" };

  return (
    <header className="topbar">
      <a className="brand" href="#overview" onClick={(e) => (e.preventDefault(), onGo("overview"))}>
        <Logo />
        <span>liquid-glass</span>
        <em>v2</em>
      </a>
      <LiquidNav
        label="Sections"
        height={height}
        padding={pad}
        itemWidth={itemWidth}
        items={SECTIONS.map((s) => ({ value: s.id, label: s.label }))}
        value={active}
        onChange={onGo}
        glassThickness={80}
        refraction={0.75}
        restRefraction={0.6}
        blur={2}
        priority={10}
        {...backing}
      />
      <div className="topbar-right">
        <LiquidThemeSwitch theme={theme} onChange={setTheme} height={switchH} />
        <a className="btn btn--primary btn--sm" href={KIT_URL} download>
          <DownloadIcon size={16} />
          Download
        </a>
      </div>
    </header>
  );
}
