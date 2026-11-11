import { SECTIONS, KIT_URL } from "./Navbar.jsx";
import { Logo } from "./icons.jsx";
import { FACTS } from "../data/facts.js";

export function Footer({ onGo }) {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <a className="brand" href="#overview" onClick={(e) => (e.preventDefault(), onGo("overview"))}>
            <Logo /> <span>liquid-glass</span>
          </a>
          <p>Liquid Glass components for React and Vite: real refraction, adaptive performance.</p>
        </div>
        <nav aria-label="Page sections">
          <h4>Explore</h4>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => (e.preventDefault(), onGo(s.id))}>
              {s.label}
            </a>
          ))}
        </nav>
        <nav aria-label="Downloads">
          <h4>Download</h4>
          <a href={KIT_URL} download>Kit (.zip)</a>
          <a href={`${import.meta.env.BASE_URL}downloads/liquid-glass-lib.zip`} download>Library only (.zip)</a>
        </nav>
        <nav aria-label="Credits">
          <h4>Credits</h4>
          <a href="https://kube.io/blog/liquid-glass-css-svg" target="_blank" rel="noreferrer">Kube: Liquid Glass in the Browser ↗</a>
          <a href="https://motion.dev" target="_blank" rel="noreferrer">Motion ↗</a>
        </nav>
      </div>
      <div className="footer-base">
        <span>v{FACTS.version} · An independent recreation of the Liquid Glass look, not affiliated with Apple.</span>
        <span>Check the original project's license before redistributing.</span>
      </div>
    </footer>
  );
}
