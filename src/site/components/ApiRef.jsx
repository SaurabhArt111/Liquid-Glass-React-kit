import { useMemo, useState } from "react";
import { COMPONENTS, CSS_VARS, GLASS_PROPS, TIER_TABLE, UTILS } from "../data/api.js";
import { inline } from "../util.js";
import { SearchIcon } from "./icons.jsx";

const GROUPS = ["All", "Geometry", "Optics", "Surface", "Motion", "Performance"];

export function ApiRef() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return GLASS_PROPS.filter((r) => (group === "All" || r[3] === group) && (!n || r.join(" ").toLowerCase().includes(n)));
  }, [q, group]);

  return (
    <section className="section" id="api">
      <header className="section-head">
        <p className="kicker">API reference</p>
        <h2>Everything is a prop or a CSS variable.</h2>
      </header>

      <div className="api-tools">
        <label className="search">
          <SearchIcon size={16} />
          <input type="search" placeholder="Filter props…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter props" />
        </label>
        <div className="seg seg--sm" role="radiogroup" aria-label="Group">
          {GROUPS.map((g) => (
            <button key={g} role="radio" aria-checked={group === g} className={group === g ? "on" : ""} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="api">
          <caption className="sr">LiquidGlass props</caption>
          <thead>
            <tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
          </thead>
          <tbody>
            {rows.map(([name, type, def, , desc]) => (
              <tr key={name}>
                <td><code className="name">{name}</code></td>
                <td><code>{type}</code></td>
                <td><code>{def}</code></td>
                <td dangerouslySetInnerHTML={inline(desc)} />
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={4} className="empty">No props match “{q}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="api-grid">
        <div>
          <h3>Components</h3>
          <ul className="list">
            {COMPONENTS.map(([n, d]) => (
              <li key={n}><code className="name">{n}</code><span>{d}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Utilities</h3>
          <ul className="list">
            {UTILS.map(([n, d]) => (
              <li key={n}><code className="name">{n}</code><span dangerouslySetInnerHTML={inline(d)} /></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Quality tiers</h3>
          <ul className="list">
            {TIER_TABLE.map(([n, d, who]) => (
              <li key={n}><code className="name">{n}</code><span>{d}<em>{who}</em></span></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>CSS variables</h3>
          <ul className="list">
            {CSS_VARS.map(([n, d, f]) => (
              <li key={n}><code className="name">{n}</code><span>{d}<em>fallback {f}</em></span></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
