import { createContext, forwardRef, useCallback, useContext, useEffect, useId, useMemo, useRef, useSyncExternalStore } from "react";
import { isMotionValue, motion, useTransform } from "motion/react";
import { drawMerged, getProfile } from "../lib/sdf.js";
import { getQuality, idleScaleFor, moveFloorFor, moveScaleFor } from "../lib/quality.js";
import { useLiquidMotion } from "../lib/useLiquidMotion.js";
import { supportsSvgBackdrop, useForwardedRef, useGlassSlot, useMv, useQuality } from "../lib/utils.js";

const noopSub = () => () => {};

const MergeContext = createContext(null);

const IDLE_MS = 90; // …then re-render once at the device's full pixel density after things have been still this long
const OVERSCAN = 6; // px the glass layer extends past the container (clipped away again, see below)

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
 * It may be as large as you like (e.g. a whole stage): work is limited to the
 * area the blobs cover, and nothing is drawn while it is off-screen.
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
    dispersion, // chromatic fringe (default: on for "high" quality, off otherwise)
    tint = 0.05,
    tintColor = "255,255,255",
    specularOpacity = 0.5,
    shadow = 1,
    fallbackBlur = 3,
    priority = 1, // merged glass is usually the hero: it keeps refracting first when the budget is exceeded
    className = "",
    style,
    children,
    ...rest
  },
  ref,
) {
  const filterId = "lm" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const canRefract = useSyncExternalStore(noopSub, supportsSvgBackdrop, () => false);
  const [, quality] = useQuality();
  const disp = dispersion ?? (quality.dispersion ? 0.04 : 0);
  const profile = useMemo(
    () => getProfile({ glassThickness, bezelWidth, refractiveIndex, bezelType }),
    [glassThickness, bezelWidth, refractiveIndex, bezelType],
  );

  const [rootRef, setRootRef] = useForwardedRef(ref);
  const { near, refract } = useGlassSlot(rootRef, { area: width * height, priority });
  const svgBackdrop = canRefract && refract && quality.budget > 0;
  const feImageRef = useRef(null);
  const filterRef = useRef(null);
  const glassRef = useRef(null);
  const shadeRef = useRef(null);
  const blobs = useRef(new Map());
  const st = useRef({ raf: 0, timer: 0, scratch: {}, ema: 0, moveScale: moveScaleFor(quality) });
  const cfg = useRef();
  cfg.current = { width, height, bezelWidth, profile, tintColor, tint, specularOpacity, shadow, smoothing, near, kValue: isMotionValue(smoothing) ? smoothing.get() : smoothing };

  const draw = useCallback(
    (hi, geoms) => {
      const c = cfg.current;
      const s = st.current;
      if (!shadeRef.current) return;
      const clear = () => {
        const cv = shadeRef.current;
        cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
        if (glassRef.current) {
          glassRef.current.style.webkitMaskImage = glassRef.current.style.maskImage = "none";
          if (svgBackdrop) glassRef.current.style.width = glassRef.current.style.height = "0px";
        }
      };
      if (!geoms.length || !c.near) return clear();

      const t0 = performance.now();
      const q = getQuality();
      const out = drawMerged({
        width: c.width,
        height: c.height,
        blobs: geoms,
        smoothing: isMotionValue(c.smoothing) ? c.smoothing.get() : c.smoothing,
        bezelWidth: c.bezelWidth,
        profile: c.profile,
        scale: hi ? idleScaleFor(q) : s.moveScale,
        maxPixels: hi ? q.idleMaxPx : q.moveMaxPx,
        tintRGB: parseRGB(c.tintColor),
        tintAlpha: c.tint,
        specularOpacity: c.specularOpacity,
        shadow: c.shadow,
        wantDisplacement: svgBackdrop,
        wantMask: !svgBackdrop, // only the CSS fallback needs a clip mask
        shadeCanvas: shadeRef.current,
        scratch: s.scratch,
      });
      if (!out) return clear();

      const { roi } = out;
      const cv = shadeRef.current;
      cv.style.left = roi.x + "px";
      cv.style.top = roi.y + "px";
      cv.style.width = roi.w + "px";
      cv.style.height = roi.h + "px";

      if (out.displacement && feImageRef.current && glassRef.current) {
        /*
         * The backdrop-filter layer covers only the blobs (plus the neck's reach), not the whole container.
         * Filtering the container's full rectangle wasted pixels, and where the container is wider than the
         * screen (phones) Chromium mirrors page content at the viewport edge: backwards text above a dock.
         */
        const pad = Math.ceil(c.kValue * 0.3) + 3;
        let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
        for (const g of geoms) {
          bx0 = Math.min(bx0, g.x - g.w / 2);
          bx1 = Math.max(bx1, g.x + g.w / 2);
          by0 = Math.min(by0, g.y - g.h / 2);
          by1 = Math.max(by1, g.y + g.h / 2);
        }
        const gx = Math.max(0, Math.floor(bx0 - pad));
        const gy = Math.max(0, Math.floor(by0 - pad));
        const gw = Math.max(1, Math.min(c.width, Math.ceil(bx1 + pad)) - gx);
        const gh = Math.max(1, Math.min(c.height, Math.ceil(by1 + pad)) - gy);
        const gs = glassRef.current.style;
        gs.left = gx - OVERSCAN + "px";
        gs.top = gy - OVERSCAN + "px";
        gs.width = gw + OVERSCAN * 2 + "px";
        gs.height = gh + OVERSCAN * 2 + "px";
        const f = filterRef.current;
        if (f) {
          f.setAttribute("width", gw + OVERSCAN * 2);
          f.setAttribute("height", gh + OVERSCAN * 2);
        }
        const im = feImageRef.current;
        im.setAttribute("x", roi.x - gx + OVERSCAN);
        im.setAttribute("y", roi.y - gy + OVERSCAN);
        im.setAttribute("width", roi.w);
        im.setAttribute("height", roi.h);
        im.setAttribute("href", out.displacement);
      }
      if (out.mask && glassRef.current) {
        const g = glassRef.current.style;
        g.webkitMaskImage = g.maskImage = `url(${out.mask})`;
        g.webkitMaskSize = g.maskSize = `${roi.w}px ${roi.h}px`;
        g.webkitMaskPosition = g.maskPosition = `${roi.x}px ${roi.y}px`;
      }

      // adapt: if drawing is eating the frame budget, drop the resolution used while moving
      if (!hi) {
        s.ema = s.ema ? s.ema * 0.8 + (performance.now() - t0) * 0.2 : performance.now() - t0;
        // only when frames are clearly slow: step the resolution down (never below ~half the display density,
        // so motion never turns blocky), and back up when it recovers
        if (s.ema > 15) s.moveScale = Math.max(moveFloorFor(), s.moveScale * 0.92);
        else if (s.ema < 8) s.moveScale = Math.min(moveScaleFor(q), s.moveScale * 1.08);
      }
    },
    [svgBackdrop],
  );

  // Redraw only when the geometry really changed (MotionValues emit lots of tiny/no-op updates).
  const schedule = useCallback(
    (force) => {
      const s = st.current;
      if (force === true) s.sig = null;
      if (s.raf) {
        if (force !== true) return;
        cancelAnimationFrame(s.raf);
        s.raf = 0;
      }
      s.raf = requestAnimationFrame(() => {
        s.raf = 0;
        const geoms = [...blobs.current.values()].map((b) => b.getGeom());
        const k = isMotionValue(cfg.current.smoothing) ? cfg.current.smoothing.get() : cfg.current.smoothing;
        const sig = geoms.map((g) => [g.x, g.y, g.w, g.h, g.r].map((v) => v.toFixed(1)).join(",")).join("|") + "|" + k.toFixed(1);
        if (sig === s.sig && force !== true) return;
        s.sig = sig;
        draw(false, geoms);
        clearTimeout(s.timer);
        s.timer = setTimeout(() => {
          const sharp = () => draw(true, [...blobs.current.values()].map((b) => b.getGeom()));
          // do the one-off sharp pass when the browser is idle, so it can never hitch an interaction
          if (typeof requestIdleCallback === "function") requestIdleCallback(sharp, { timeout: 400 });
          else sharp();
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

  // redraw when static props change, or when the body scrolls into / out of view
  useEffect(() => {
    schedule(true);
  }, [schedule, width, height, bezelWidth, glassThickness, refractiveIndex, bezelType, tint, tintColor, specularOpacity, shadow, svgBackdrop, near]);
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
  const dispMv = useMv(disp);
  const hasDispersion = disp !== 0;
  const scaleG = useTransform(() => profile.maxDisplacement * ratioMv.get());
  const scaleR = useTransform(() => profile.maxDisplacement * ratioMv.get() * (1 - dispMv.get()));
  const scaleB = useTransform(() => profile.maxDisplacement * ratioMv.get() * (1 + dispMv.get()));

  const backdrop = !near
    ? "none"
    : svgBackdrop
      ? `url(#${filterId})`
      : `${fallbackBlur ? `blur(${fallbackBlur}px) ` : ""}saturate(1.8) brightness(1.08)`;

  return (
    <div ref={setRootRef} className={`lg-merge ${className}`} style={{ width, height, ...style }} {...rest}>
      {svgBackdrop && near && (
        <svg className="lg-defs" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <filter ref={filterRef} id={filterId} x={0} y={0} width={width} height={height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              {/* neutral (no displacement) everywhere; the generated map covers only the blobs' region */}
              <feFlood floodColor="rgb(128,128,0)" result="neutral" />
              <feImage ref={feImageRef} x={0} y={0} width={1} height={1} result="img" />
              <feBlend in="img" in2="neutral" mode="normal" result="map" />
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
      <div
        ref={glassRef}
        className={`lg-merge-glass${svgBackdrop ? " lg-merge-glass--svg" : ""}`}
        style={{ backdropFilter: backdrop, WebkitBackdropFilter: backdrop }}
      />
      <canvas ref={shadeRef} className="lg-merge-shade" />
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
