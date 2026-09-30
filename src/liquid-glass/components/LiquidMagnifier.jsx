import { forwardRef } from "react";
import { LiquidGlass } from "../LiquidGlass.jsx";

/**
 * A draggable magnifying lens. Zooms what's under it in the centre and
 * refracts the rim. Pass `dragConstraints={ref}` to keep it inside a stage.
 */
export const LiquidMagnifier = forwardRef(function LiquidMagnifier(props, ref) {
  return (
    <LiquidGlass
      ref={ref}
      width={210}
      height={150}
      bezelWidth={25}
      glassThickness={110}
      refractiveIndex={1.5}
      bezelType="convex"
      blur={0}
      specularOpacity={0.5}
      specularSaturation={9}
      magnify={48}
      refraction={1}
      tint={0}
      restScale={0.8}
      activeScale={1}
      draggable
      {...props}
    />
  );
});
