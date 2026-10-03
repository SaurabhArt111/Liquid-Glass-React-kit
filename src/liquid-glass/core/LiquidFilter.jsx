import { memo, useMemo } from "react";
import { motion, useTransform } from "motion/react";
import { getGlassMaps } from "../lib/optics.js";
import { useMv } from "../lib/utils.js";

/**
 * The SVG filter pipeline (refraction → saturation → specular rim).
 * Every dynamic value accepts a number OR a MotionValue, so springs can drive
 * the filter attributes directly without re-rendering React.
 */
export const LiquidFilter = memo(function LiquidFilter({
  id,
  width,
  height,
  radius,
  bezelWidth,
  glassThickness,
  refractiveIndex,
  bezelType,
  blur = 0.2,
  dispersion = 0,
  scaleRatio = 1,
  specularOpacity = 0.5,
  specularSaturation = 6,
  magnifyingScale, // undefined → no magnification stage
}) {
  const hasMagnify = magnifyingScale !== undefined;

  const maps = useMemo(
    () =>
      getGlassMaps({ width, height, radius, bezelWidth, glassThickness, refractiveIndex, bezelType, magnify: hasMagnify }),
    [width, height, radius, bezelWidth, glassThickness, refractiveIndex, bezelType, hasMagnify],
  );

  const blurMv = useMv(blur);
  const ratioMv = useMv(scaleRatio);
  const opacityMv = useMv(specularOpacity);
  const satMv = useMv(specularSaturation);
  const magnifyMv = useMv(magnifyingScale ?? 0);

  const dispMv = useMv(dispersion);
  const hasDispersion = dispersion !== 0;
  const displacementScale = useTransform(() => maps.maxDisplacement * ratioMv.get());
  // red bends least, blue most — like real glass
  const scaleR = useTransform(() => maps.maxDisplacement * ratioMv.get() * (1 - dispMv.get()));
  const scaleB = useTransform(() => maps.maxDisplacement * ratioMv.get() * (1 + dispMv.get()));
  const saturateValues = useTransform(() => String(satMv.get()));

  return (
    <svg className="lg-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB">
          {hasMagnify && (
            <>
              <feImage href={maps.magnify} x={0} y={0} width={width} height={height} result="magnify_map" />
              <motion.feDisplacementMap
                in="SourceGraphic"
                in2="magnify_map"
                scale={magnifyMv}
                xChannelSelector="R"
                yChannelSelector="G"
                result="magnified"
              />
            </>
          )}

          <motion.feGaussianBlur
            in={hasMagnify ? "magnified" : "SourceGraphic"}
            stdDeviation={blurMv}
            result="blurred"
          />

          <feImage href={maps.displacement} x={0} y={0} width={width} height={height} result="displacement_map" />
          {hasDispersion ? (
            <>
              <motion.feDisplacementMap in="blurred" in2="displacement_map" scale={scaleR} xChannelSelector="R" yChannelSelector="G" result="dr" />
              <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cr" />
              <motion.feDisplacementMap in="blurred" in2="displacement_map" scale={displacementScale} xChannelSelector="R" yChannelSelector="G" result="dg" />
              <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cg" />
              <motion.feDisplacementMap in="blurred" in2="displacement_map" scale={scaleB} xChannelSelector="R" yChannelSelector="G" result="db" />
              <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cb" />
              <feBlend in="cr" in2="cg" mode="screen" result="crg" />
              <feBlend in="crg" in2="cb" mode="screen" result="displaced" />
            </>
          ) : (
            <motion.feDisplacementMap
              in="blurred"
              in2="displacement_map"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
          )}

          <motion.feColorMatrix in="displaced" type="saturate" values={saturateValues} result="displaced_saturated" />

          <feImage href={maps.specular} x={0} y={0} width={width} height={height} result="specular_layer" />
          <feComposite in="displaced_saturated" in2="specular_layer" operator="in" result="specular_saturated" />

          <feComponentTransfer in="specular_layer" result="specular_faded">
            <motion.feFuncA type="linear" slope={opacityMv} />
          </feComponentTransfer>

          <feBlend in="specular_saturated" in2="displaced" mode="normal" result="with_saturation" />
          <feBlend in="specular_faded" in2="with_saturation" mode="normal" />
        </filter>
      </defs>
    </svg>
  );
});
