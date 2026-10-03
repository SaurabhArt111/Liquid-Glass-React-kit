import { createContext, forwardRef, useCallback, useContext, useEffect, useId, useMemo, useRef } from "react";
import { isMotionValue, motion, useTransform } from "motion/react";
import { drawMerged, getProfile } from "../lib/sdf.js";
import { getDevicePixelRatio } from "../lib/optics.js";
import { useLiquidMotion } from "../lib/useLiquidMotion.js";
import { supportsSvgBackdrop, useMv } from "../lib/utils.js";

const MergeContext = createContext(null);

const MOVE_SCALE = 0.75; // map resolution while things are moving (cheap)
const IDLE_MS = 160; // …then re-render once at full resolution

const parseRGB = (s) => String(s).split(",").map((v) => parseFloat(v));

/**
 * <LiquidMerge> — several glass shapes that behave as ONE liquid body.
 *
 * Put <LiquidBlob>s inside. The refraction map, rim light, shading and drop
 * shadow are computed from the *smooth union* of the blobs, so when two of them
 * come close a liquid neck forms between them (and pinches off as they part),
 * exactly like Liquid Glass morphing. Blobs are real draggable / springy
 * shapes: their size, press-inflate and jelly feed straight into the geometry.
 *
 * The container is click-through; only blobs (and their children) take input.
 */
export const LiquidMerge = forwardRef(function LiquidMerge(
  {
    width = 480,
    height = 240,
    smoothing = 26, // px — how far the neck reaches (number | MotionValue). 0 = never merge
    bezelWidth = 30,
    glassThickness = 70,
    refractiveIndex = 1.5,
    bezelType = "convex",
    refraction = 1, // 0..1 (number | MotionValue)
    dispersion = 0.04,
    tint = 0.05,
    tintColor = "255,255,255",
    specularOpacity = 0.5,
    shadow = 1,
    fallbackBlur = 3,
    className = "",
    style,
    children,
    ...rest
  },
  ref,
) {
  const filterId = "lm" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const svgBackdrop = useMemo(supportsSvgBackdrop, []);
  const profile = useMemo(
    () => getProfile({ glassThickness, bezelWidth, refractiveIndex, bezelType }),
    [glassThickness, bezelWidth, refractiveIndex, bezelType],
  );

  const feImageRef = useRef(null);
  const glassRef = useRef(null);
  const shadeRef = useRef(null);
  const blobs = useRef(new Map());
  const st = useRef({ raf: 0, timer: 0, scratch: {} });
  const cfg = useRef();
  cfg.current = { width, height, bezelWidth, profile, tintColor, tint, specularOpacity, shadow, smoothing };

  const draw = useCallback(
    (scale, geoms) => {
      const c = cfg.current;
      if (!shadeRef.current) return;

      if (!geoms.length) {
        // no blobs (yet): draw nothing — never a rectangle
        shadeRef.current.style.backgroundImage = "none";
        if (glassRef.current) glassRef.current.style.webkitMaskImage = glassRef.current.style.maskImage = "none";
        return;
      }

      const out = drawMerged({
        width: c.width,
        height: c.height,
        blobs: geoms,
        smoothing: isMotionValue(c.smoothing) ? c.smoothing.get() : c.smoothing,
        bezelWidth: c.bezelWidth,
        profile: c.profile,
        scale,
        tintRGB: parseRGB(c.tintColor),
        tintAlpha: c.tint,
        specularOpacity: c.specularOpacity,
        shadow: c.shadow,
        wantDisplacement: svgBackdrop,
        wantMask: true, // clip the glass to the merged shape (also removes the container's rectangle)
        scratch: st.current.scratch,
      });
      if (out.displacement && feImageRef.current) feImageRef.current.setAttribute("href", out.displacement);
      shadeRef.current.style.backgroundImage = `url(${out.shade})`;
      if (out.mask && glassRef.current) {
        glassRef.current.style.webkitMaskImage = glassRef.current.style.maskImage = `url(${out.mask})`;
      }
    },
    [svgBackdrop],
  );

  // Redraw only when the geometry really changed (MotionValues emit lots of tiny/no-op
  // updates). Cheap map while moving, one full-resolution map once it settles.
  const schedule = useCallback(
    (force) => {
      const s = st.current;
      if (force === true) s.sig = null;
      if (s.raf) {
        if (force === true) {
          cancelAnimationFrame(s.raf);
          s.raf = 0;
        } else {
          return;
        }
      }
      s.raf = requestAnimationFrame(() => {
        s.raf = 0;
        const geoms = [...blobs.current.values()].map((b) => b.getGeom());
        const k = isMotionValue(cfg.current.smoothing) ? cfg.current.smoothing.get() : cfg.current.smoothing;
        const sig = geoms.map((g) => [g.x, g.y, g.w, g.h, g.r].map((v) => v.toFixed(1)).join(",")).join("|") + "|" + k.toFixed(1);
        if (sig === s.sig && !force) return;
        s.sig = sig;
        draw(MOVE_SCALE, geoms);
        clearTimeout(s.timer);
        s.timer = setTimeout(() => {
          draw(Math.min(2, getDevicePixelRatio()), [...blobs.current.values()].map((b) => b.getGeom()));
        }, IDLE_MS);
      });
    },
    [draw],
  );

  const ctx = useMemo(
    () => ({
      register(id, entry) {
        blobs.current.set(id, entry);
        const offs = entry.mvs.map((mv) => mv.on("change", () => schedule()));
        schedule(true);
        return () => {
          offs.forEach((off) => off());
          blobs.current.delete(id);
          schedule(true);
        };
      },
      schedule,
    }),
    [schedule],
  );

  // redraw when static props change
  useEffect(() => {
    schedule(true);
  }, [schedule, width, height, bezelWidth, glassThickness, refractiveIndex, bezelType, tint, tintColor, specularOpacity, shadow, svgBackdrop]);
  useEffect(() => {
    if (!isMotionValue(smoothing)) return;
    return smoothing.on("change", () => schedule());
  }, [smoothing, schedule]);
  useEffect(() => {
    const s = st.current;
    return () => {
      cancelAnimationFrame(s.raf);
      clearTimeout(s.timer);
    };
  }, []);

  /* SVG filter values */
  const ratioMv = useMv(refraction);
  const dispMv = useMv(dispersion);
  const hasDispersion = dispersion !== 0;
  const scaleG = useTransform(() => profile.maxDisplacement * ratioMv.get());
  const scaleR = useTransform(() => profile.maxDisplacement * ratioMv.get() * (1 - dispMv.get()));
  const scaleB = useTransform(() => profile.maxDisplacement * ratioMv.get() * (1 + dispMv.get()));

  const backdrop = svgBackdrop
    ? `url(#${filterId})`
    : `${fallbackBlur ? `blur(${fallbackBlur}px) ` : ""}saturate(1.8) brightness(1.08)`;

  return (
    <div ref={ref} className={`lg-merge ${className}`} style={{ width, height, ...style }} {...rest}>
      {svgBackdrop && (
        <svg className="lg-defs" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB">
              <feImage ref={feImageRef} x={0} y={0} width={width} height={height} result="map" />
              {hasDispersion ? (
                <>
                  <motion.feDisplacementMap in="SourceGraphic" in2="map" scale={scaleR} xChannelSelector="R" yChannelSelector="G" result="dr" />
                  <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cr" />
                  <motion.feDisplacementMap in="SourceGraphic" in2="map" scale={scaleG} xChannelSelector="R" yChannelSelector="G" result="dg" />
                  <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cg" />
                  <motion.feDisplacementMap in="SourceGraphic" in2="map" scale={scaleB} xChannelSelector="R" yChannelSelector="G" result="db" />
                  <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cb" />
                  <feBlend in="cr" in2="cg" mode="screen" result="crg" />
                  <feBlend in="crg" in2="cb" mode="screen" />
                </>
              ) : (
                <motion.feDisplacementMap in="SourceGraphic" in2="map" scale={scaleG} xChannelSelector="R" yChannelSelector="G" />
              )}
            </filter>
          </defs>
        </svg>
      )}
      <div ref={glassRef} className="lg-merge-glass" style={{ backdropFilter: backdrop, WebkitBackdropFilter: backdrop }} />
      <div ref={shadeRef} className="lg-merge-shade" />
      <MergeContext.Provider value={ctx}>{children}</MergeContext.Provider>
    </div>
  );
});

/**
 * One shape of a <LiquidMerge>. Positioned by `left`/`top` (css px inside the
 * container); `x`/`y` (MotionValues) move it from there — drag it, spring it,
 * animate it. Children render on top of the glass and move with the blob.
 */
export const LiquidBlob = forwardRef(function LiquidBlob(
  {
    left = 0,
    top = 0,
    width = 100,
    height = 60,
    radius,
    restScale = 1,
    activeScale = 1.08,
    jelly = 1,
    active = false,
    onPressChange,
    draggable = false, // false | true | 'x' | 'y'
    dragConstraints,
    dragElastic = 0.13,
    dragSnapToOrigin = false,
    x: xProp,
    y: yProp,
    className = "",
    style,
    children,
    onPointerDown,
    onDragStart,
    onDragEnd,
    ...rest
  },
  ref,
) {
  const ctx = useContext(MergeContext);
  const id = useId();
  const r = Math.min(radius ?? height / 2, width / 2, height / 2);
  const { setPressed, x, y, scaleX, scaleY } = useLiquidMotion({
    restScale,
    activeScale,
    jelly,
    active,
    onPressChange,
    x: xProp,
    y: yProp,
  });

  useEffect(
    () =>
      ctx?.register(id, {
        mvs: [x, y, scaleX, scaleY],
        getGeom: () => {
          const sx = scaleX.get();
          const sy = scaleY.get();
          return {
            x: left + width / 2 + x.get(),
            y: top + height / 2 + y.get(),
            w: width * sx,
            h: height * sy,
            r: r * Math.min(sx, sy),
          };
        },
      }),
    [ctx, id, left, top, width, height, r, x, y, scaleX, scaleY],
  );

  const dragProp = draggable === true ? true : draggable || false;
  const touchAction = dragProp === "x" ? "pan-y" : dragProp === "y" ? "pan-x" : dragProp ? "none" : undefined;

  return (
    <motion.div
      ref={ref}
      className={`lg-blob ${dragProp ? "lg-draggable" : ""} ${className}`}
      style={{ left, top, width, height, borderRadius: r, x, y, scaleX, scaleY, touchAction, ...style }}
      drag={dragProp}
      dragConstraints={dragConstraints}
      dragElastic={dragElastic}
      dragMomentum={false}
      dragSnapToOrigin={dragSnapToOrigin}
      onPointerDown={(e) => {
        setPressed(1);
        onPointerDown?.(e);
      }}
      onDragStart={(...a) => {
        setPressed(1);
        onDragStart?.(...a);
      }}
      onDragEnd={(...a) => {
        setPressed(0);
        onDragEnd?.(...a);
      }}
      {...rest}
    >
      {children != null && <div className="lg-content lg-blob-content">{children}</div>}
    </motion.div>
  );
});
