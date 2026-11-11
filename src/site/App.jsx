import { useEffect, useRef } from "react";
import { ApiRef } from "./components/ApiRef.jsx";
import { Faq } from "./components/Faq.jsx";
import { Footer } from "./components/Footer.jsx";
import { Gallery } from "./components/Gallery.jsx";
import { Hero } from "./components/Hero.jsx";
import { Install } from "./components/Install.jsx";
import { SECTIONS, Navbar } from "./components/Navbar.jsx";
import { PerfLab } from "./components/PerfLab.jsx";
import { Playground } from "./components/Playground.jsx";
import { scrollToId, useScrollSpy, useTheme } from "./hooks.js";

export default function App() {
  const [theme, setTheme] = useTheme();
  const lock = useRef(false);
  const [active, setActive] = useScrollSpy(SECTIONS.map((s) => s.id), lock);

  const go = (id) => {
    setActive(id);
    scrollToId(id, lock);
    history.replaceState(null, "", `#${id}`);
  };

  // deep links (#install) work on load
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && document.getElementById(id)) requestAnimationFrame(() => scrollToId(id, lock));
  }, []);

  return (
    <>
      <a className="skip" href="#overview">Skip to content</a>
      <Navbar theme={theme} setTheme={setTheme} active={active} onGo={go} />
      <main className="page">
        <Hero onGo={go} />
        <PerfLab />
        <Gallery theme={theme} setTheme={setTheme} />
        <Playground />
        <Install />
        <ApiRef />
        <Faq />
      </main>
      <Footer onGo={go} />
    </>
  );
}
