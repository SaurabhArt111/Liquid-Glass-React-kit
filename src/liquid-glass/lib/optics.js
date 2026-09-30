import { SURFACES } from "./surfaces.js";

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

// Shared rounded-rect geometry: for a pixel, returns the vector from the
// nearest corner-circle centre (or 0 on straight edges).
function makeGeometry(W, H, r) {
  const wBetween = W - r * 2;
  const hBetween = H - r * 2;
  return (x1, y1) => {
    const left = x1 < r;
    const right = x1 >= W - r;
    const top = y1 < r;
    const bottom = y1 >= H - r;
    const x = left ? x1 - r : right ? x1 - r - wBetween : 0;
    const y = top ? y1 - r : bottom ? y1 - r - hBetween : 0;
    return [x, y];
  };
}

/** RG-encoded displacement vectors: R = x shift, G = y shift, 128 = neutral. */
function drawDisplacementMap(width, height, radius, bezelWidth, maxDisp, profile, dpr) {
  const W = Math.round(width * dpr);
  const H = Math.round(height * dpr);
  const img = new ImageData(W, H);
  new Uint32Array(img.data.buffer).fill(0xff008080);

  const r = radius * dpr;
  const bezel = bezelWidth * dpr;
  const rSq = r * r;
  const rPlus1Sq = (r + 1) ** 2;
  const rMinusBezelSq = (r - bezel) ** 2;
  const at = makeGeometry(W, H, r);

  for (let y1 = 0; y1 < H; y1++) {
    for (let x1 = 0; x1 < W; x1++) {
      const [x, y] = at(x1, y1);
      const dSq = x * x + y * y;
      if (dSq > rPlus1Sq || dSq < rMinusBezelSq) continue;

      const d = Math.sqrt(dSq);
      const opacity = dSq < rSq ? 1 : 1 - (d - r);
      const fromSide = r - d;
      const cos = x / d;
      const sin = y / d;
      const idx = ((fromSide / bezel) * profile.length) | 0;
      const dist = profile[idx] ?? 0;
      const dX = (-cos * dist) / maxDisp;
      const dY = (-sin * dist) / maxDisp;

      const p = (y1 * W + x1) * 4;
      img.data[p] = 128 + dX * 127 * opacity;
      img.data[p + 1] = 128 + dY * 127 * opacity;
      img.data[p + 2] = 0;
      img.data[p + 3] = 255;
    }
  }
  return img;
}

/** A 2px light rim, brightest where the edge faces the light (default 60°). */
function drawSpecularMap(width, height, radius, dpr, angle = Math.PI / 3) {
  const W = Math.round(width * dpr);
  const H = Math.round(height * dpr);
  const img = new ImageData(W, H);
  const r = radius * dpr;
  const light = [Math.cos(angle), Math.sin(angle)];
  const rSq = r * r;
  const rPlus1Sq = (r + dpr) ** 2;
  const rMinusRimSq = Math.max(0, r - 2 * dpr) ** 2;
  const at = makeGeometry(W, H, r);

  for (let y1 = 0; y1 < H; y1++) {
    for (let x1 = 0; x1 < W; x1++) {
      const [x, y] = at(x1, y1);
      const dSq = x * x + y * y;
      if (dSq > rPlus1Sq || dSq < rMinusRimSq) continue;

      const d = Math.sqrt(dSq);
      const t = (r - d) / dpr; // 0 at the edge → 2 at rim end
      if (t < 0 || t > 2) continue;
      const opacity = dSq < rSq ? 1 : 1 - (d - r) / dpr;

      const dot = Math.abs((x / d) * light[0] + (-y / d) * light[1]);
      const coef = dot * Math.sqrt(1 - (1 - t) ** 2);
      const c = 255 * coef;

      const p = (y1 * W + x1) * 4;
      img.data[p] = c;
      img.data[p + 1] = c;
      img.data[p + 2] = c;
      img.data[p + 3] = c * coef * opacity;
    }
  }
  return img;
}

/** Radial map used for the "zoom" of the magnifier (centre → edges). */
function drawMagnifyMap(width, height, dpr) {
  const W = Math.round(width * dpr);
  const H = Math.round(height * dpr);
  const img = new ImageData(W, H);
  const ratio = Math.max(W / 2, H / 2);
  for (let y1 = 0; y1 < H; y1++) {
    for (let x1 = 0; x1 < W; x1++) {
      const p = (y1 * W + x1) * 4;
      img.data[p] = 128 - ((x1 - W / 2) / ratio) * 127;
      img.data[p + 1] = 128 - ((y1 - H / 2) / ratio) * 127;
      img.data[p + 2] = 0;
      img.data[p + 3] = 255;
    }
  }
  return img;
}

function toDataUrl(imageData) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext("2d").putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/* -------------------------------------------------------------------------- */
/* 3. Cached entry point                                                       */
/* -------------------------------------------------------------------------- */

const cache = new Map();

export function getDevicePixelRatio() {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  // Render maps at ≥2× so bezel edges stay crisp; cap at 3× for memory.
  return Math.max(2, Math.min(3, Math.ceil(dpr)));
}

/**
 * Returns `{ displacement, specular, magnify?, maxDisplacement }` where the
 * first three are PNG data URLs ready for <feImage>. Results are memoised.
 */
export function getGlassMaps({
  width,
  height,
  radius,
  bezelWidth,
  glassThickness,
  refractiveIndex,
  bezelType = "convex",
  magnify = false,
}) {
  const dpr = getDevicePixelRatio();
  const key = [width, height, radius, bezelWidth, glassThickness, refractiveIndex, bezelType, dpr].join("|");

  let entry = cache.get(key);
  if (!entry) {
    const heightFn = SURFACES[bezelType] ?? SURFACES.convex;
    const profile = computeBezelProfile(glassThickness, bezelWidth, heightFn, refractiveIndex);
    const maxDisplacement = Math.max(1, ...profile.map(Math.abs));
    entry = {
      maxDisplacement,
      displacement: toDataUrl(
        drawDisplacementMap(width, height, radius, bezelWidth, maxDisplacement, profile, dpr),
      ),
      specular: toDataUrl(drawSpecularMap(width, height, radius, dpr)),
      magnify: null,
    };
    cache.set(key, entry);
    // keep memory bounded when a playground is dragging sliders
    if (cache.size > 48) cache.delete(cache.keys().next().value);
  }
  if (magnify && !entry.magnify) {
    entry.magnify = toDataUrl(drawMagnifyMap(width, height, dpr));
  }
  return entry;
}
