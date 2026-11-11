import { CheckCircle, MinusCircle } from "./icons.jsx";

const MATRIX = [
  ["Chromium: Chrome, Edge, Arc, Brave, Opera, Android Chrome", true, "Full refraction through backdrop-filter: url(#svg)"],
  ["Safari and every browser on iPhone / iPad (WebKit)", false, "Frosted CSS glass: blur, rim light, sheen. All motion is identical."],
  ["Firefox", false, "Frosted CSS glass. All motion is identical."],
];

const FAQ = [
  ["It feels laggy. What should I check first?", "Glass is expensive because each refracting surface is a GPU filter over a moving backdrop. Version 2 limits how many surfaces refract (the tier's budget), skips off-screen glass entirely and drops a tier when frames get slow. If you still want more headroom, call setQuality(\"balanced\") or \"low\", or give less important surfaces priority={0} and the hero priority={5}."],
  ["Does optimizing lose the liquid feel?", "No. The bezel profile that bends light is the same in every tier; Diffing the same lens across tiers shows the refraction shape is unchanged. What the lower tiers drop are extras: the rainbow fringe, the in-filter rim and map density. css mode is the only tier without real refraction."],
  ["Why no refraction in Safari or Firefox?", "They don't implement SVG filters inside backdrop-filter. The components switch to a CSS glass look there, and everything else (drag, inflate, jelly, merging) is plain JavaScript and works the same."],
  ["How do I force a look for testing?", "Add ?glass=css or ?glass=svg to the URL to force the mode, and ?quality=ultra|high|balanced|low|css to pin a tier."],
  ["Is it accessible?", "Switches are role=switch, sliders role=slider (arrows, Home, End), nav bars are navigation / radiogroup / tablist with arrow keys. With prefers-reduced-motion springs stop bouncing, jelly turns off and autoplay stays still."],
  ["What about the license?", "The original project ships without a LICENSE file and is based on Kube's article “Liquid Glass in the Browser”. Check its terms before redistributing, and credit it. This is an independent recreation, not affiliated with Apple."],
];

export function Faq() {
  return (
    <section className="section" id="faq">
      <header className="section-head">
        <p className="kicker">Support</p>
        <h2>Browser support and FAQ.</h2>
      </header>
      <div className="matrix">
        {MATRIX.map(([name, full, note]) => (
          <div className="matrix-row" key={name}>
            <span className={full ? "yes" : "part"}>{full ? <CheckCircle size={20} /> : <MinusCircle size={20} />}</span>
            <div>
              <b>{name}</b>
              <small>{note}</small>
            </div>
            <em className={full ? "yes" : "part"}>{full ? "Refraction" : "CSS glass"}</em>
          </div>
        ))}
      </div>
      <div className="faq">
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
