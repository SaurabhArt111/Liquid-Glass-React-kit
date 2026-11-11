import { SURFACES } from "./surfaces.js";
import { getQuality, mapDprFor } from "./quality.js";

/* -------------------------------------------------------------------------- */
/* 1. Physics: how far does a vertical ray get pushed sideways by the bezel?   */
/* -------------------------------------------------------------------------- */

/**
 * Snell's law on a bezel profile. Returns `samples` horizontal displacements
 * (in px), indexed by distance from the glass edge (0 = edge, 1 = flat area).
 */
export function computeBezelProfile(
  glassThickness,
  bezelWidth,
  heightFn,
  refractiveIndex,
  samples = 128,
) {
  const eta = 1 / refractiveIndex;

  // Simplified refraction: the incident ray is always fully vertical.
  function refract(nx, ny) {
    const dot = ny;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null; // total internal reflection
    const kSqrt = Math.sqrt(k);
    return [-(eta * dot + kSqrt) * nx, eta - (eta * dot + kSqrt) * ny];
  }

  return Array.from({ length: samples }, (_, i) => {
    const x = i / samples;
    const y = heightFn(x);

    const dx = x < 1 ? 0.0001 : -0.0001;
    const derivative = (heightFn(x + dx) - y) / dx;
    const magnitude = Math.sqrt(derivative * derivative + 1);
    const refracted = refract(-derivative / magnitude, -1 / magnitude);
    if (!refracted) return 0;

    const remainingHeight = y * bezelWidth + glassThickness;
    return refracted[0] * (remainingHeight / refracted[1]);
  });
}

/* -------------------------------------------------------------------------- */
/* 2. Image generation (all in the browser, no node-canvas / build step)       */
/* -------------------------------------------------------------------------- */

/*
 * Performance notes
 *  • The glass only bends light in a thin ring (the bezel). Everything inside is neutral, so we
 *    fill the whole image with the neutral colour in one native call and only compute the ring:
 *    O(perimeter × bezel) instead of O(area).
 *  • Maps are encoded asynchronously (canvas.toBlob → blob: URL). The browser encodes off the main
 *    thread and nothing is base64-ed, so generating a map never blocks a frame.
 *  • The displacement field is smooth, so it does not need 3× density. Density follows the quality tier.
 */

/** Calls `fn(x, y, gx, gy)` for every pixel that can be inside the ring `[r - band, r + 1]` of a rounded rect. */
function forRing(W, H, r, band, fn) {
  const wBetween = W - r * 2;
  const hBetween = H - r * 2;
  const reach = Math.min(W, Math.ceil(band) + 2);
  const rows = (y1, a, b) => {
    const top = y1 < r;
    const bottom = y1 >= H - r;
    const gy = top ? y1 - r : bottom ? y1 - r - hBetween : 0;
    for (let x1 = a; x1 < b; x1++) {
      const left = x1 < r;
      const right = x1 >= W - r;
      const gx = left ? x1 - r : right ? x1 - r - wBetween : 0;
      fn(x1, y1, gx, gy);
    }
  };
  for (let y1 = 0; y1 < H; y1++) {
    const corner = y1 < r || y1 >= H - r;
    const nearEdge = y1 <= band + 1 || y1 >= H - band - 2;
    if (nearEdge) rows(y1, 0, W); // top / bottom bezel rows: the whole width
    else if (corner) {
      const cr = Math.min(W, Math.ceil(r) + 1);
      rows(y1, 0, cr);
      rows(y1, Math.max(cr, W - cr), W);
    } else {
      rows(y1, 0, reach);
      rows(y1, Math.max(reach, W - reach), W);
    }
  }
}

/** RG-encoded displacement vectors: R = x shift, G = y shift, 128 = neutral. Writes into `data` (RGBA). */
export function fillDisplacement(data, W, H, r, bezel, maxDisp, profile) {
  new Uint32Array(data.buffer, data.byteOffset, W * H).fill(0xff008080);
  const rSq = r * r;
  const rPlus1Sq = (r + 1) ** 2;
  const rMinusBezelSq = (r - bezel) ** 2;
  const pl = profile.length;
  forRing(W, H, r, bezel, (x1, y1, x, y) => {
    const dSq = x * x + y * y;
    if (dSq > rPlus1Sq || dSq < rMinusBezelSq) return;
    const d = Math.sqrt(dSq);
    const opacity = dSq < rSq ? 1 : 1 - (d - r);
    const idx = (((r - d) / bezel) * pl) | 0;
    const dist = profile[idx] ?? 0;
    const k = (-dist / maxDisp) * 127 * opacity;
    const p = (y1 * W + x1) * 4;
    data[p] = 128 + (x / d) * k;
    data[p + 1] = 128 + (y / d) * k;
    data[p + 2] = 0;
    data[p + 3] = 255;
  });
}

/** A 2px light rim, brightest where the edge faces the light (default 60°). Only used by the "ultra" tier. */
export function fillSpecular(data, W, H, r, dpr, angle = Math.PI / 3) {
  const lx = Math.cos(angle);
  const ly = Math.sin(angle);
  const rSq = r * r;
  const rPlus1Sq = (r + dpr) ** 2;
  const rMinusRimSq = Math.max(0, r - 2 * dpr) ** 2;
  forRing(W, H, r, 2 * dpr, (x1, y1, x, y) => {
    const dSq = x * x + y * y;
    if (dSq > rPlus1Sq || dSq < rMinusRimSq) return;
    const d = Math.sqrt(dSq);
    const t = (r - d) / dpr;
    if (t < 0 || t > 2) return;
    const opacity = dSq < rSq ? 1 : 1 - (d - r) / dpr;
    const dot = Math.abs((x / d) * lx + (-y / d) * ly);
    const coef = dot * Math.sqrt(1 - (1 - t) ** 2);
    const c = 255 * coef;
    const p = (y1 * W + x1) * 4;
    data[p] = c;
    data[p + 1] = c;
    data[p + 2] = c;
    data[p + 3] = c * coef * opacity;
  });
}

/** Radial map used for the "zoom" of the magnifier (centre → edges). */
function fillMagnify(data, W, H) {
  const ratio = Math.max(W / 2, H / 2);
  for (let y1 = 0; y1 < H; y1++) {
    for (let x1 = 0; x1 < W; x1++) {
      const p = (y1 * W + x1) * 4;
      data[p] = 128 - ((x1 - W / 2) / ratio) * 127;
      data[p + 1] = 128 - ((y1 - H / 2) / ratio) * 127;
      data[p + 2] = 0;
      data[p + 3] = 255;
    }
  }
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** ImageData → blob: URL, encoded off the main thread. */
function encode(img) {
  const c = makeCanvas(img.width, img.height);
  c.getContext("2d").putImageData(img, 0, 0);
  return new Promise((resolve) => {
    if (!c.toBlob) return resolve(c.toDataURL());
    c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : c.toDataURL()), "image/png");
  });
}

/* -------------------------------------------------------------------------- */
/* 3. Cached entry points                                                      */
/* -------------------------------------------------------------------------- */

const cache = new Map(); // key -> { ready, promise, maxDisplacement, displacement, specular, magnify }
const MAX_CACHE = 64;

/** kept for backwards compatibility: density used for the displacement map in the current tier */
export function getDevicePixelRatio() {
  return mapDprFor();
}

function keyOf(o, dpr, wantSpec) {
  return [o.width, o.height, o.radius, o.bezelWidth, o.glassThickness, o.refractiveIndex, o.bezelType ?? "convex", dpr, wantSpec ? 1 : 0].join("|");
}

/**
 * Synchronous cache lookup. Returns the maps if they are already generated, otherwise `null`
 * (and starts generating them: call `loadGlassMaps` to await, or just re-render when `onReady` fires).
 *
 * @param o  { width, height, radius, bezelWidth, glassThickness, refractiveIndex, bezelType, magnify?, specular? }
 */
export function peekGlassMaps(o) {
  const dpr = mapDprFor();
  const e = cache.get(keyOf(o, dpr, o.specular));
  return e?.ready && (!o.magnify || e.magnify) ? e : null;
}

export function loadGlassMaps(o) {
  const dpr = mapDprFor();
  const key = keyOf(o, dpr, o.specular);
  let e = cache.get(key);
  if (!e) {
    e = { ready: false, magnify: null, specular: null };
    const heightFn = SURFACES[o.bezelType] ?? SURFACES.convex;
    const profile = computeBezelProfile(o.glassThickness, o.bezelWidth, heightFn, o.refractiveIndex);
    e.maxDisplacement = Math.max(1, ...profile.map(Math.abs));
    const W = Math.round(o.width * dpr);
    const H = Math.round(o.height * dpr);
    const r = o.radius * dpr;
    const bezel = o.bezelWidth * dpr;
    const disp = new ImageData(W, H);
    fillDisplacement(disp.data, W, H, r, bezel, e.maxDisplacement, profile);
    const jobs = [encode(disp).then((u) => (e.displacement = u))];
    if (o.specular) {
      const spec = new ImageData(W, H);
      fillSpecular(spec.data, W, H, r, dpr);
      jobs.push(encode(spec).then((u) => (e.specular = u)));
    }
    e.promise = Promise.all(jobs).then(() => ((e.ready = true), e));
    cache.set(key, e);
    if (cache.size > MAX_CACHE) {
      const oldKey = cache.keys().next().value;
      const old = cache.get(oldKey);
      cache.delete(oldKey);
      [old.displacement, old.specular, old.magnify].forEach((u) => u?.startsWith("blob:") && URL.revokeObjectURL(u));
    }
  }
  if (o.magnify && !e.magnify && !e.magnifyPromise) {
    const W = Math.round(o.width * dpr);
    const H = Math.round(o.height * dpr);
    const m = new ImageData(W, H);
    fillMagnify(m.data, W, H);
    e.magnifyPromise = encode(m).then((u) => (e.magnify = u));
  }
  return Promise.all([e.promise, e.magnifyPromise]).then(() => e);
}
