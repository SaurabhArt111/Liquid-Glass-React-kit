import { memo, useMemo } from "react";
import { useCopy } from "../hooks.js";
import { CheckIcon, CopyIcon } from "./icons.jsx";

/* A tiny, dependency-free highlighter: enough for JSX / JS / shell snippets. */
const RULES = [
  ["c", /\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*/y],
  ["s", /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y],
  ["k", /\b(?:import|from|export|default|const|let|var|function|return|new|if|else|await|async|true|false|null|undefined|npm|npx|cd|mkdir|cp|unzip)\b/y],
  ["t", /<\/?[A-Z][A-Za-z0-9.]*|\/?>/y],
  ["n", /\b\d+(?:\.\d+)?\b/y],
  ["p", /\b[a-zA-Z_][\w]*(?==)/y],
];

function tokenize(code) {
  const out = [];
  let i = 0;
  let plain = "";
  const flush = () => plain && (out.push(plain), (plain = ""));
  while (i < code.length) {
    let hit = null;
    for (const [type, re] of RULES) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m) {
        hit = [type, m[0]];
        break;
      }
    }
    if (hit) {
      flush();
      out.push(<span key={i} className={`tk-${hit[0]}`}>{hit[1]}</span>);
      i += hit[1].length;
    } else plain += code[i++];
  }
  flush();
  return out;
}

export const CodeBlock = memo(function CodeBlock({ code, label, id, className = "" }) {
  const [copied, copy] = useCopy();
  const nodes = useMemo(() => tokenize(code), [code]);
  const key = id ?? code.slice(0, 24);
  return (
    <div className={`code ${className}`}>
      <div className="code-bar">
        <span>{label}</span>
        <button type="button" className="code-copy" onClick={() => copy(code, key)} aria-label={`Copy ${label ?? "code"}`}>
          {copied === key ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
          <span>{copied === key ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre tabIndex={0}>
        <code>{nodes}</code>
      </pre>
    </div>
  );
});
