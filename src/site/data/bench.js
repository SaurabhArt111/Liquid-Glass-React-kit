/* Measured with scripts/bench/perf.py: the ORIGINAL demo page, only the library swapped (v1 → v2). Median of 3 runs. */
export const BENCH = {
  rows: [
    ["Desktop scroll: frame rate", "13.4 fps", "38.7 fps", "2.9× faster"],
    ["Desktop scroll: slowest 5 % of frames", "133 ms", "50 ms", "−62 %"],
    ["Phone (emulated) scroll: frame rate", "19.2 fps", "33.4 fps", "1.7× faster"],
    ["Phone (emulated) scroll: slowest 5 % of frames", "100 ms", "67 ms", "−33 %"],
    ["Main-thread blocking while the page loads (desktop)", "258 ms", "107 ms", "−59 %"],
    ["Dock glass area filtered per frame (390 px phone)", "506 × 204 px", "384 × 82 px", "6.1× fewer pixels"],
  ],
  note: "Headless Chrome 153, software GL (SwiftShader), 6 s scripted scroll, 4× CPU throttle. Relative numbers, not absolute: a real GPU is far faster. Reproduce with scripts/bench/perf.py.",
};
