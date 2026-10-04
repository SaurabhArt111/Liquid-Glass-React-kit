/**
 * A favicon that is itself liquid glass.
 *
 * Draws, on a tiny canvas, two lenses that melt together and split apart over a colourful tile:
 * the background really bends through the glass (Snell-style rim displacement), with rainbow
 * dispersion at the edge, rim light, inner shading and a drop shadow — the same ingredients as the
 * components, evaluated on the CPU for 64×64 pixels (well under a millisecond a frame).
 *
 *   startLiquidFavicon();            // animates <link rel="icon"> ~8 fps while the tab is visible
 *   startLiquidFavicon({ fps: 12 }); // returns a stop() function
 *   renderLiquidFavicon({ size: 180, phase: 0.5 })  // a single frame as a canvas (e.g. for PNG files)
 */

const smin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

function makeBackground(size) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d", { willReadFrequently: true });
  const lg = g.createLinearGradient(0, 0, size, size);
  lg.addColorStop(0, "#ff5f7e");
  lg.addColorStop(0.5, "#7a4dff");
  lg.addColorStop(1, "#14d6c9");
  g.fillStyle = lg;
  g.fillRect(0, 0, size, size);
  // bold diagonal stripes: something for the glass to bend
  g.save();
  g.translate(size / 2, size / 2);
  g.rotate(-0.5);
  g.translate(-size, -size);
  const step = size / 7;
  for (let i = 0; i < 18; i++) {
    g.fillStyle = i % 2 ? "rgba(255,255,255,0.17)" : "rgba(8,12,50,0.13)";
    g.fillRect(i * step, 0, step * 0.5, size * 2);
  }
  g.restore();
  return g.getImageData(0, 0, size, size);
}

function sample(bg, size, x, y, out, o) {
  // bilinear, clamped
  x = Math.min(size - 1.001, Math.max(0, x));
  y = Math.min(size - 1.001, Math.max(0, y));
  const x0 = x | 0;
  const y0 = y | 0;
  const fx = x - x0;
  const fy = y - y0;
  const d = bg.data;
  const i00 = (y0 * size + x0) * 4;
  const i10 = i00 + 4;
  const i01 = i00 + size * 4;
  const i11 = i01 + 4;
  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;
  return d[i00 + o] * w00 + d[i10 + o] * w10 + d[i01 + o] * w01 + d[i11 + o] * w11;
}

let bgCache = null;

/**
 * One frame. `phase` ∈ [0,1) is the animation cycle (0 = lenses merged, 0.5 = fully apart).
 * Returns a canvas (rounded-square tile with transparent corners).
 */
export function renderLiquidFavicon({ size = 64, phase = 0 } = {}) {
  if (!bgCache || bgCache.size !== size) bgCache = { size, data: makeBackground(size) };
  const bg = bgCache.data;
  const u = size / 64;

  // two blobs; `sep` 0 = overlapping, 1 = clearly apart
  const sep = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
  const dist = size * (0.27 + 0.2 * sep);
  const bob = Math.sin(phase * Math.PI * 4);
  const ax = size * 0.5 - dist * 0.46;
  const ay = size * (0.5 + 0.025 * bob);
  const bx = ax + dist;
  const by = size * (0.49 - 0.035 * bob);
  const ra = size * 0.215;
  const rb = size * 0.16;
  const K = size * 0.15;

  const n = size * size;
  const sd = new Float32Array(n);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const da = Math.hypot(x + 0.5 - ax, y + 0.5 - ay) - ra;
      const db = Math.hypot(x + 0.5 - bx, y + 0.5 - by) - rb;
      sd[y * size + x] = smin(da, db, K);
    }
  }

  const out = new ImageData(size, size);
  const o = out.data;
  const bezel = 11 * u;
  const bend = 6.5 * u;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      const d = sd[i];
      const p = i * 4;
      let r = bg.data[p];
      let g = bg.data[p + 1];
      let b = bg.data[p + 2];

      const gx = sd[i + 1] - sd[i - 1];
      const gy = sd[i + size] - sd[i - size];
      const mg = Math.hypot(gx, gy) || 1;
      const nx = gx / mg;
      const ny = gy / mg;

      if (d < 0.5) {
        const t = Math.max(0, -d);
        // refraction: near the rim the tile is sampled from further inside; red bends least, blue most
        const k = t < bezel ? Math.pow(1 - t / bezel, 2) * bend : 0;
        r = sample(bg, size, x - nx * k * 0.88, y - ny * k * 0.88, o, 0);
        g = sample(bg, size, x - nx * k, y - ny * k, o, 1);
        b = sample(bg, size, x - nx * k * 1.14, y - ny * k * 1.14, o, 2);
        // glass tint, brighter in the middle like a lens
        const lift = 0.2 + 0.1 * Math.min(1, t / (8 * u));
        r += (255 - r) * lift;
        g += (255 - g) * lift;
        b += (255 - b) * lift;
        // inner edge shading: light from the top-left
        const l = -0.6 * nx - 0.8 * ny;
        const f = Math.exp(-t / (5 * u));
        if (l > 0) {
          const a = 0.42 * l * f;
          r += (255 - r) * a;
          g += (255 - g) * a;
          b += (255 - b) * a;
        } else {
          const a = -0.38 * l * f;
          r *= 1 - a;
          g *= 1 - a;
          b *= 1 - a;
        }
        // specular rim, ~1.2 css px wide
        if (t < 2.6 * u) {
          const dot = Math.abs(nx * 0.5 - ny * 0.866);
          const rim = Math.min(1, dot * 0.7 + 0.5) * (1 - t / (2.6 * u));
          r += (255 - r) * rim;
          g += (255 - g) * rim;
          b += (255 - b) * rim;
        }
        // anti-aliased edge into the backdrop
        if (d > -0.5) {
          const cov = 0.5 - d;
          r = bg.data[p] * (1 - cov) + r * cov;
          g = bg.data[p + 1] * (1 - cov) + g * cov;
          b = bg.data[p + 2] * (1 - cov) + b * cov;
        }
      } else if (d < 9 * u) {
        // soft drop shadow, biased downward
        const a = 0.42 * Math.exp(-d / (3.2 * u)) * (0.55 + 0.45 * ny);
        r *= 1 - a;
        g *= 1 - a;
        b *= 1 - a;
      }
      o[p] = r;
      o[p + 1] = g;
      o[p + 2] = b;
      o[p + 3] = 255;
    }
  }
  // border pixels keep the plain tile
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
        const p = (y * size + x) * 4;
        o[p] = bg.data[p];
        o[p + 1] = bg.data[p + 1];
        o[p + 2] = bg.data[p + 2];
        o[p + 3] = 255;
      }
    }
  }

  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.putImageData(out, 0, 0);
  // rounded-square tile
  ctx.globalCompositeOperation = "destination-in";
  const rad = size * 0.23;
  ctx.beginPath();
  ctx.moveTo(rad, 0);
  ctx.arcTo(size, 0, size, size, rad);
  ctx.arcTo(size, size, 0, size, rad);
  ctx.arcTo(0, size, 0, 0, rad);
  ctx.arcTo(0, 0, size, 0, rad);
  ctx.closePath();
  ctx.fill();
  return c;
}

/**
 * Animate the page's favicon. Pauses while the tab is hidden; shows a single still frame for users
 * who prefer reduced motion. Returns stop().
 */
export function startLiquidFavicon({ fps = 8, size = 64, cycleSeconds = 7 } = {}) {
  if (typeof document === "undefined") return () => {};
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  const original = link.href;

  const paint = (phase) => {
    link.href = renderLiquidFavicon({ size, phase }).toDataURL("image/png");
  };

  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    paint(0.02);
    return () => {
      link.href = original;
    };
  }

  let timer = 0;
  const t0 = performance.now();
  const tick = () => {
    paint((((performance.now() - t0) / 1000) % cycleSeconds) / cycleSeconds);
  };
  const run = () => {
    clearInterval(timer);
    tick();
    timer = setInterval(tick, 1000 / fps);
  };
  const onVis = () => (document.visibilityState === "visible" ? run() : clearInterval(timer));
  document.addEventListener("visibilitychange", onVis);
  if (document.visibilityState === "visible") run();

  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onVis);
    link.href = original;
  };
}
