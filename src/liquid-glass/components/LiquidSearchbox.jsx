import { forwardRef, useRef } from "react";
import { useMotionValue } from "motion/react";
import { LiquidGlass } from "../core/LiquidGlass.jsx";

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/** Search field on glass. Shrinks at rest, inflates & brightens on focus. */
export const LiquidSearchbox = forwardRef(function LiquidSearchbox(
  { width = 420, height = 56, placeholder = "Search", onSubmit, inputProps, ...props },
  ref,
) {
  const inputRef = useRef(null);
  const focused = useMotionValue(0);

  return (
    <LiquidGlass
      ref={ref}
      className="lg-searchbox"
      width={width}
      height={height}
      bezelWidth={Math.round(height * 0.48)}
      glassThickness={70}
      blur={1}
      refraction={0.7}
      restRefraction={0.7}
      specularOpacity={0.2}
      specularSaturation={4}
      tint={0.05}
      activeTint={0.2}
      restScale={0.8}
      activeScale={1}
      jelly={0}
      active={focused}
      onClick={() => inputRef.current?.focus()}
      {...props}
    >
      <SearchIcon />
      <input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        onFocus={() => focused.set(1)}
        onBlur={() => focused.set(0)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit?.(e.currentTarget.value)}
        {...inputProps}
      />
    </LiquidGlass>
  );
});
