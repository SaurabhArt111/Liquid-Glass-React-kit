import { forwardRef } from "react";
import { LiquidGlass } from "../core/LiquidGlass.jsx";

/** Glass pill button: inflates and bounces back when pressed. */
export const LiquidButton = forwardRef(function LiquidButton(
  { children, onClick, disabled, width = 168, height = 52, ...props },
  ref,
) {
  return (
    <LiquidGlass
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      className="lg-button"
      width={width}
      height={height}
      bezelWidth={height * 0.42}
      glassThickness={60}
      blur={0.4}
      tint={0.07}
      activeTint={0.02}
      refraction={0.95}
      restRefraction={0.6}
      specularOpacity={0.6}
      specularSaturation={6}
      restScale={0.94}
      activeScale={1.08}
      holdMs={320}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      {...props}
    >
      {children}
    </LiquidGlass>
  );
});
