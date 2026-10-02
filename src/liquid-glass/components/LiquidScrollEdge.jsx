/**
 * Soft blur + fade where scrolling content slides under a floating bar (iOS
 * "scroll edge effect"). Place inside a `position: relative` frame, above the
 * scroller and below the bar.
 */
export function LiquidScrollEdge({ position = "top", height = 96, blur = 8, className = "", style }) {
  return (
    <div
      aria-hidden="true"
      className={`lg-edge lg-edge--${position} ${className}`}
      style={{ height, "--lg-edge-blur": `${blur}px`, ...style }}
    />
  );
}
