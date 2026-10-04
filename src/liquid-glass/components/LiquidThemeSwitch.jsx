import { motion, useTransform } from "motion/react";
import { LiquidSwitch } from "./LiquidSwitch.jsx";
import { MoonIcon, SunIcon } from "./icons.jsx";

const STARS = [
  [10, 22, 2.2],
  [24, 62, 1.6],
  [30, 18, 1.4],
  [42, 70, 2],
  [17, 44, 1.2],
  [50, 30, 1.5],
  [6, 74, 1.4],
];

const Day = () => (
  <span className="lg-theme-scene lg-theme-day">
    <i style={{ right: "10%", bottom: "16%", width: "34%", height: "30%" }} />
    <i style={{ right: "30%", bottom: "34%", width: "22%", height: "24%" }} />
    <i style={{ right: "4%", top: "22%", width: "20%", height: "20%", opacity: 0.75 }} />
    <i style={{ right: "34%", bottom: "10%", width: "20%", height: "20%", opacity: 0.85 }} />
  </span>
);

const Night = () => (
  <span className="lg-theme-scene lg-theme-night">
    {STARS.map(([x, y, s], i) => (
      <i key={i} style={{ left: `${x}%`, top: `${y}%`, width: s, height: s }} />
    ))}
  </span>
);

/** The sun turns into the moon inside the glass thumb as the switch moves (p: 0 = day → 1 = night). */
function ThemeThumb({ p, size }) {
  const sunOpacity = useTransform(p, (v) => 1 - v);
  const sunRotate = useTransform(p, (v) => -v * 100);
  const sunScale = useTransform(p, (v) => 1 - v * 0.4);
  const moonOpacity = useTransform(p, (v) => v);
  const moonRotate = useTransform(p, (v) => (1 - v) * 100);
  const moonScale = useTransform(p, (v) => 0.6 + v * 0.4);
  return (
    <span className="lg-theme-thumb" style={{ width: size, height: size }}>
      <motion.span className="sun" style={{ opacity: sunOpacity, rotate: sunRotate, scale: sunScale }}>
        <SunIcon />
      </motion.span>
      <motion.span className="moon" style={{ opacity: moonOpacity, rotate: moonRotate, scale: moonScale }}>
        <MoonIcon />
      </motion.span>
    </span>
  );
}

/**
 * Day / night theme switch: a real <LiquidSwitch> (role="switch").
 * The track cross-fades between a sky with clouds and a night sky with stars; the see-through glass
 * thumb refracts that scenery while a sun morphs into a moon inside it.
 * Tap it, drag the thumb, or press Space. Even the quickest tap plays the liquid-glass animation.
 *
 *   <LiquidThemeSwitch theme={theme} onChange={setTheme} />   // theme: "light" | "dark"
 */
export function LiquidThemeSwitch({ theme, onChange, height = 56, ...props }) {
  const icon = Math.round(height * 0.5);
  return (
    <LiquidSwitch
      className="lg-themeswitch"
      label="Dark theme"
      height={height}
      checked={theme === "dark"}
      onChange={(dark) => onChange?.(dark ? "dark" : "light")}
      offColor="#5aa2ff"
      onColor="#1b2060"
      offAlpha="FF"
      onAlpha="FF"
      thumbTint={0.1}
      thumbRest={0.7}
      trackOff={<Day />}
      trackOn={<Night />}
      thumb={(p) => <ThemeThumb p={p} size={icon} />}
      {...props}
    />
  );
}
