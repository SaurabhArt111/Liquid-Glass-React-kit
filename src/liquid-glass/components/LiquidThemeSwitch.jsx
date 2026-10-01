import { LiquidNav } from "./LiquidNav.jsx";
import { MoonIcon, SunIcon } from "./icons.jsx";

const ITEMS = [
  { value: "light", icon: <SunIcon width={26} height={26} />, ariaLabel: "Light theme" },
  { value: "dark", icon: <MoonIcon width={26} height={26} />, ariaLabel: "Dark theme" },
];

/** Sun / moon glass pill. Controlled: `theme` = "light" | "dark". */
export function LiquidThemeSwitch({ theme, onChange, itemWidth = 60, height = 56, padding = 5, ...props }) {
  return (
    <LiquidNav
      label="Theme"
      items={ITEMS}
      value={theme}
      onChange={onChange}
      itemWidth={itemWidth}
      height={height}
      padding={padding}
      {...props}
    />
  );
}
