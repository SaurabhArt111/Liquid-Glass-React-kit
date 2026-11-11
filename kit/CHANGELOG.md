# Changelog

## 2.0.0

**Performance (same liquid shape in every tier)**
- Quality tiers `ultra · high · balanced · low · css`, detected per device; `setQuality()`, `useQuality()`, `?quality=` URL override.
- Adaptive governor: steps tiers down on measured slow frames while scrolling/dragging, back up on recovery; zero idle cost.
- Refraction budget: only the N most important *visible* surfaces refract (`priority` prop to choose); the rest render CSS glass.
- SVG filter region is exactly the element (was the 120 % × 120 % default); no-op blur pass removed; dispersion is per tier.
- Displacement/specular maps computed on the bezel ring only (bit-identical output), encoded asynchronously to blob URLs
  at the tier's density (was: full-area loop + synchronous 3× data URLs on the main thread).
- Rim light drawn in CSS (vector-sharp, free) outside the `ultra` tier; the CSS fallback no longer generates a specular PNG.
- `LiquidMerge` filters only the blobs' region instead of its whole container (≈6× fewer pixels on a phone dock).
- Measured on the original demo page, library swapped only (headless Chrome, software GL, 4× CPU throttle, median of 3):
  desktop scroll 13.4 → 38.7 fps; phone emulation 19.2 → 33.4 fps.

**Fixes**
- Backwards/mirrored page text above merged bars when the container is wider than the viewport (phones).
- Hydration-safe feature detection (SSR / Next.js).
- Removed dead duplicate files (`LiquidGlass.jsx`, `LiquidFilter.jsx`, `LiquidMerge.jsx`, `liquid-glass.css` at the folder root).

**Added**
- TypeScript definitions (`index.d.ts`), `saturation` and `priority` props, `getGlassStats()`, `onGovernorSample()`.
- Runnable Vite starter, and this kit.

## 1.0.0
- Initial release (refractive glass, merge/split lenses, nav bars, switches, sliders, swipe view).
