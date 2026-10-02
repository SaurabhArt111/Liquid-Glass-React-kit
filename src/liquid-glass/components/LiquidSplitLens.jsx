import { useRef } from "react";
import { LiquidBlob, LiquidMerge } from "../LiquidMerge.jsx";

/**
 * Two draggable lenses that melt into one body when they touch and split apart
 * again when pulled away — refracted as a single piece of glass.
 */
export function LiquidSplitLens({ width = 520, height = 260, smoothing = 34, ...props }) {
  const box = useRef(null);
  const big = Math.min(height - 56, 150);
  const small = Math.round(big * 0.78);
  return (
    <LiquidMerge
      ref={box}
      width={width}
      height={height}
      smoothing={smoothing}
      bezelWidth={30}
      glassThickness={86}
      refraction={1}
      tint={0.16}
      specularOpacity={0.8}
      shadow={1.4}
      {...props}
    >
      <LiquidBlob
        left={Math.round(width * 0.12)}
        top={(height - big) / 2}
        width={Math.round(big * 1.35)}
        height={big}
        restScale={0.88}
        activeScale={1}
        jelly={1.2}
        draggable
        dragConstraints={box}
        aria-label="Lens one"
      />
      <LiquidBlob
        left={Math.round(width * 0.66)}
        top={(height - small) / 2}
        width={small}
        height={small}
        restScale={0.88}
        activeScale={1}
        jelly={1.2}
        draggable
        dragConstraints={box}
        aria-label="Lens two"
      />
    </LiquidMerge>
  );
}
