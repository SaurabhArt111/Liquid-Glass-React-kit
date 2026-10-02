import { forwardRef } from "react";
import { LiquidGlass } from "../LiquidGlass.jsx";

/** Round glass icon button (back, share, search…). Inflates, glows and bounces on press. */
export const LiquidIconButton = forwardRef(function LiquidIconButton(
  { icon, label, size = 44, onClick, disabled, className = "", ...props },
  ref,
) {
  return (
    <LiquidGlass
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={`lg-button lg-iconbutton ${className}`}
      width={size}
      height={size}
      bezelWidth={Math.round(size * 0.4)}
      glassThickness={50}
      blur={0.3}
      tint={0.07}
      activeTint={0.02}
      refraction={0.9}
      restRefraction={0.6}
      specularOpacity={0.6}
      restScale={1}
      activeScale={1.14}
      jelly={0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      {...props}
    >
      {icon}
    </LiquidGlass>
  );
});
