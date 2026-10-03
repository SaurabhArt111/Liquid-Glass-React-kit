import { LiquidSwitch } from "./LiquidSwitch.jsx";
import { MoonIcon, SunIcon } from "./icons.jsx";

/**
 * Sun / moon theme switch: a real <LiquidSwitch> (role="switch"). Tap it or drag
 * the glass thumb; the thumb is see-through so the active icon shows through the lens.
 *
 *   <LiquidThemeSwitch theme={theme} onChange={setTheme} />   // theme: "light" | "dark"
 */
export function LiquidThemeSwitch({ theme, onChange, height = 56, ...props }) {
  const icon = Math.round(height * 0.46);
  return (
    <LiquidSwitch
      label="Dark theme"
      height={height}
      checked={theme === "dark"}
      onChange={(dark) => onChange?.(dark ? "dark" : "light")}
      offColor="#7fa6ff"
      onColor="#262b66"
      offAlpha="E6"
      onAlpha="F2"
      thumbTint={0.22}
      startIcon={<SunIcon width={icon} height={icon} />}
      endIcon={<MoonIcon width={icon} height={icon} />}
      {...props}
    />
  );
}
