import { SURFACES } from "./surfaces.js";
import { computeBezelProfile } from "./optics.js";

/* -------------------------------------------------------------------------- */
/* Merged ("split-lens") glass: one refraction + shading map for N blobs       */
/* -------------------------------------------------------------------------- */
/*
 * Each blob is a rounded rectangle. We evaluate the *smooth union* of their
 * signed distance fields on a grid:
 *
 *      d(p) = smin(d1(p), d2(p), …; k)         (d < 0 inside the glass)
 *
 * so when two blobs get within ~k px of each other a liquid neck forms between
 * them, and pinches off again as they separate. The bezel profile (Snell's law,
 * same as a single lens) is then looked up by depth `-d`, with the surface
 * normal taken from ∇d. Two images come out of one pass:
 *   • displacement map (RG-encoded vectors) → feDisplacementMap
 *   • shade layer (tint, rim light, inner shading, drop shadow) → CSS overlay
 */

const profileCache = new Map();
export function getProfile({ glassThickness, bezelWidth, refractiveIndex, bezelType = "convex" }) {
  const key = [glassThickness, bezelWidth, refractiveIndex, bezelType].join("|");
  let p = profileCache.get(key);
  if (!p) {
    const list = computeBezelProfile(glassThickness, bezelWidth, SURFACES[bezelType] ?? SURFACES.convex, refractiveIndex);
    p = { list, maxDisplacement: Math.max(1, ...list.map(Math.abs)) };
    profileCache.set(key, p);
  }
  return p;
}

// exp() lookup tables, 0.5 css-px steps
const lut = (k) => Float32Array.from({ length: 96 }, (_, i) => Math.exp(-(i * 0.5) / k));
const EXP7 = lut(7);
const EXP9 = lut(9);

function canvasFor(scratch, key, w, h) {
  let c = scratch[key];
  if (!c) c = scratch[key] = document.createElement("canvas");
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}

/** Reusable ImageData of exactly w×h (allocating per frame is what makes things janky). */
function imageDataFor(scratch, key, w, h) {
  let img = scratch[key];
  if (!img || img.width !== w || img.height !== h) img = scratch[key] = new ImageData(w, h);
  return img;
}

/**
 * Draws the merged maps for the *region of interest only* — the bounding box of the blobs plus the
 * room their bezel, neck and shadow need — never the whole container. Cost scales with what is
 * visibly glass, not with how big the stage is.
 *
 * @param blobs [{ x, y, w, h, r }]  centre + size in css px, relative to the container
 * @returns null (nothing to draw) or
 *   { roi: { x, y, w, h }  css px rect the images cover (relative to the container),
 *     displacement?: PNG data URL   (RG vectors, neutral 128 outside shapes),
 *     mask?: PNG data URL           (shape coverage — only for the CSS fallback) }
 *   The shade layer is painted straight onto `shadeCanvas` (no image encoding).
 */
export function drawMerged({
  width,
  height,
  blobs,
  smoothing = 24,
  bezelWidth,
  profile, // from getProfile()
  scale = 1, // canvas px per css px
  maxPixels = 120000, // budget: the scale is reduced if the region would need more
  tintRGB = [255, 255, 255],
  tintAlpha = 0.05,
  specularOpacity = 0.5,
  shadow = 1,
  wantDisplacement = true,
  wantMask = false,
  shadeCanvas,
  scratch,
}) {
  const K = smoothing;
  const nb = blobs.length;
  const list = profile.list;
  const pl = list.length;
  const dispGain = 127 / profile.maxDisplacement;
  const shadowReach = 34;

  /* region of interest (css px, integers) */
  const m = bezelWidth + K + 30;
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const b of blobs) {
    x0 = Math.min(x0, b.x - b.w / 2 - m);
    x1 = Math.max(x1, b.x + b.w / 2 + m);
    y0 = Math.min(y0, b.y - b.h / 2 - m);
    y1 = Math.max(y1, b.y + b.h / 2 + m);
  }
  const rx0 = Math.max(0, Math.floor(x0));
  const ry0 = Math.max(0, Math.floor(y0));
  const rw = Math.min(width, Math.ceil(x1)) - rx0;
  const rh = Math.min(height, Math.ceil(y1)) - ry0;
  if (rw < 4 || rh < 4) return null;

  let s = scale;
  if (rw * rh * s * s > maxPixels) s *= Math.sqrt(maxPixels / (rw * rh * s * s));
  const cw = Math.max(4, Math.round(rw * s));
  const ch = Math.max(4, Math.round(rh * s));
  const inv = 1 / s;
  const bs = bezelWidth * s;

  const dImg = wantDisplacement ? imageDataFor(scratch, "dImg", cw, ch) : null;
  if (dImg) new Uint32Array(dImg.data.buffer).fill(0xff008080); // neutral = no displacement
  const sImg = imageDataFor(scratch, "sImg", cw, ch);
  sImg.data.fill(0);
  const mImg = wantMask ? imageDataFor(scratch, "mImg", cw, ch) : null;
  if (mImg) mImg.data.fill(0);

  const n = cw * ch;
  if (!scratch.sd || scratch.sd.length < n) scratch.sd = new Float32Array(n);
  const sd = scratch.sd;

  /* 1 ─ smooth-union signed distance (css px) on the region's grid */
  const reach = K + shadowReach;
  for (let y = 0; y < ch; y++) {
    const py = ry0 + y * inv;
    for (let x = 0; x < cw; x++) {
      const px = rx0 + x * inv;
      let d = 0;
      let first = true;
      for (let k = 0; k < nb; k++) {
        const c = blobs[k];
        // far from this blob: leave it out (its distance can't matter for shading or the neck)
        if (Math.abs(px - c.x) > c.w * 0.5 + reach || Math.abs(py - c.y) > c.h * 0.5 + reach) continue;
        const qx = Math.abs(px - c.x) - (c.w * 0.5 - c.r);
        const qy = Math.abs(py - c.y) - (c.h * 0.5 - c.r);
        const ax = qx > 0 ? qx : 0;
        const ay = qy > 0 ? qy : 0;
        const inner = qx > qy ? qx : qy;
        const e = Math.sqrt(ax * ax + ay * ay) + (inner < 0 ? inner : 0) - c.r;
        if (first) {
          d = e;
          first = false;
        } else if (K <= 0.5) d = d < e ? d : e;
        else {
          const hh = Math.max(K - Math.abs(d - e), 0) / K;
          d = (d < e ? d : e) - hh * hh * K * 0.25;
        }
      }
      sd[y * cw + x] = first ? 1000 : d;
    }
  }

  /* 2 ─ normals from ∇d, then displacement + shading per pixel */
  const dd = dImg?.data;
  const sdata = sImg.data;
  const mdata = mImg?.data;
  const [tr, tg, tb] = tintRGB;
  const sh = shadow;
  const spec = specularOpacity;

  for (let y = 1; y < ch - 1; y++) {
    for (let x = 1; x < cw - 1; x++) {
      const i = y * cw + x;
      const dcss = sd[i];
      if (dcss > 32) continue; // nothing is drawn out here
      const gx = sd[i + 1] - sd[i - 1];
      const gy = sd[i + cw] - sd[i - cw];
      const mg = Math.sqrt(gx * gx + gy * gy) || 1;
      const nx = gx / mg; // outward normal, screen coords (+y is down)
      const ny = gy / mg;
      const dpx = dcss * s;
      const p = i * 4;
      const inside = dpx <= -0.5 ? 1 : dpx >= 0.5 ? 0 : 0.5 - dpx; // anti-aliased coverage

      if (dd && dpx <= 0.5 && dpx >= -bs) {
        let idx = ((-dpx / bs) * pl) | 0;
        if (idx < 0) idx = 0;
        else if (idx >= pl) idx = pl - 1;
        const v = list[idx] * dispGain * (dpx > 0 ? 1 - dpx / 0.5 : 1);
        dd[p] = 128 - nx * v;
        dd[p + 1] = 128 - ny * v;
      }
      if (mdata) {
        mdata[p] = mdata[p + 1] = mdata[p + 2] = 255;
        mdata[p + 3] = inside * 255;
      }

      /* shading layers: fill → highlight → shadow */
      const fillA = inside * tintAlpha;
      let hiA = 0;
      let shA = 0;
      const t = -dcss; // depth into the glass (css px)

      if (t >= -0.3 && t <= 2) {
        const tt = t < 0 ? 0 : t;
        const dot = Math.abs(nx * 0.5 - ny * 0.866);
        const coef = dot * Math.sqrt(Math.max(0, 1 - (1 - tt) * (1 - tt)));
        hiA = coef * coef * spec * inside;
      }
      if (t > 0 && t < 47) {
        const f = EXP7[(t * 2) | 0];
        const l = -0.6 * nx - 0.8 * ny;
        if (l > 0) {
          const a = 0.2 * l * f * sh;
          hiA = hiA + a - hiA * a;
        } else {
          const a = -0.16 * l * f * sh;
          shA = shA + a - shA * a;
        }
      }
      if (dcss > 0 && dcss < 47) {
        const a = 0.22 * EXP9[(dcss * 2) | 0] * (0.55 + 0.45 * ny) * sh * (1 - inside);
        shA = shA + a - shA * a;
      }

      let A = fillA;
      let R = tr * fillA;
      let G = tg * fillA;
      let B = tb * fillA;
      if (hiA > 0) {
        R = 255 * hiA + R * (1 - hiA);
        G = 255 * hiA + G * (1 - hiA);
        B = 255 * hiA + B * (1 - hiA);
        A = hiA + A * (1 - hiA);
      }
      if (shA > 0) {
        R *= 1 - shA;
        G *= 1 - shA;
        B *= 1 - shA;
        A = shA + A * (1 - shA);
      }
      if (A > 0.002) {
        sdata[p] = R / A;
        sdata[p + 1] = G / A;
        sdata[p + 2] = B / A;
        sdata[p + 3] = A * 255;
      }
    }
  }

  /* 3 ─ output */
  const roi = { x: rx0, y: ry0, w: cw / s, h: ch / s };
  const out = { roi };
  if (dImg) {
    const c = canvasFor(scratch, "disp", cw, ch);
    c.getContext("2d").putImageData(dImg, 0, 0);
    out.displacement = c.toDataURL();
  }
  if (shadeCanvas) {
    if (shadeCanvas.width !== cw || shadeCanvas.height !== ch) {
      shadeCanvas.width = cw;
      shadeCanvas.height = ch;
    }
    shadeCanvas.getContext("2d").putImageData(sImg, 0, 0);
  }
  if (mImg) {
    const c = canvasFor(scratch, "mask", cw, ch);
    c.getContext("2d").putImageData(mImg, 0, 0);
    out.mask = c.toDataURL();
  }
  return out;
}
