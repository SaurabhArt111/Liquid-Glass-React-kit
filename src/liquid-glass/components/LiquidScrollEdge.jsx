/**
 * Soft blur + fade where scrolling content slides under a floating bar (iOS
 * "scroll edge effect"). Place inside a `position: relative` frame, above the
 * scroller and below the bar.
 *
 * `radius`: if the frame has rounded corners, pass the same radius so the blur doesn't
 * spill square patches into them (backdrop blur ignores an ancestor's rounded clip).
 */
export function LiquidScrollEdge({ position = "top", height = 96, blur = 8, radius = 0, className = "", style }) {
  return (
    <div
      aria-hidden="true"
      className={`lg-edge lg-edge--${position} ${className}`}
      style={{ height, "--lg-edge-blur": `${blur}px`, "--lg-edge-radius": `${radius}px`, ...style }}
    />
  );
}
