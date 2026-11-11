import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getGlassStats, onGovernorSample, subscribeGlassStats } from "../liquid-glass";

/** viewport width, updated at most once per animation frame and only when it really changed */
export function useViewportWidth() {
  const [w, setW] = useState(typeof window === "undefined" ? 1280 : window.innerWidth);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setW((p) => (p === window.innerWidth ? p : window.innerWidth)));
    };
    window.addEventListener("resize", on, { passive: true });
    return () => {
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return w;
}

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("lg-theme", theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);
  return [theme, setTheme];
}

export function useCopy(timeout = 1600) {
  const [copied, setCopied] = useState(null);
  const timer = useRef(0);
  const copy = useCallback(
    async (text, id = "x") => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch {
          /* ignore */
        }
        ta.remove();
      }
      setCopied(id);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), timeout);
    },
    [timeout],
  );
  return [copied, copy];
}

/** Highlights the section under the middle of the viewport; `lock` pauses it during click-scrolls. */
export function useScrollSpy(ids, lock) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        if (lock.current) return;
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [active, setActive];
}

/** live counters of the refraction budget */
export function useGlassStatsLive() {
  return useSyncExternalStore(subscribeGlassStats, getGlassStats, getGlassStats);
}

/** latest governor fps sample (only produced while the page is being scrolled / dragged) */
export function useFps() {
  const [s, setS] = useState({ fps: null, p75: null });
  useEffect(() => onGovernorSample((x) => setS(x)), []);
  return s;
}

/** true once the element has been near the viewport (for lazy-mounting heavy demos) */
export function useInView(ref, margin = "200px") {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, seen]);
  return seen;
}

/** scrolls to a section, compensating for the fixed top bar */
export function scrollToId(id, lock) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lock) {
    lock.current = true;
    clearTimeout(lock.timer);
    lock.timer = setTimeout(() => (lock.current = false), 900);
  }
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
