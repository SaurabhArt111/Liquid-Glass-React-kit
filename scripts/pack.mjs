/**
 * Builds the downloadable packages from ONE source of truth (src/liquid-glass + kit/):
 *   public/downloads/liquid-glass-kit.zip   library + runnable Vite starter + README + CHANGELOG
 *   public/downloads/liquid-glass-lib.zip   just the library folder
 * Runs automatically before `npm run dev` and `npm run build`.
 */
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const lib = join(root, "src", "liquid-glass");
const kit = join(root, "kit");
const out = join(root, "public", "downloads");

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function add(files, base, dir, prefix) {
  for (const f of walk(dir)) {
    if (/(^|[\\/])(node_modules|dist|\.DS_Store)([\\/]|$)/.test(f)) continue;
    files[prefix + relative(dir, f).split(sep).join("/")] = new Uint8Array(readFileSync(f));
  }
}

const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;

// kit
const kitFiles = {};
add(kitFiles, kit, kit, "liquid-glass-kit/");
add(kitFiles, lib, lib, "liquid-glass-kit/liquid-glass/");
add(kitFiles, lib, lib, "liquid-glass-kit/examples/vite-react-starter/src/liquid-glass/");

// library only
const libFiles = {};
add(libFiles, lib, lib, "liquid-glass/");

mkdirSync(out, { recursive: true });
const opts = { level: 9, mtime: new Date("2026-01-01") }; // fixed mtime → reproducible zips
writeFileSync(join(out, "liquid-glass-kit.zip"), zipSync(kitFiles, opts));
writeFileSync(join(out, "liquid-glass-lib.zip"), zipSync(libFiles, opts));
console.log(`packed v${version}: ${Object.keys(kitFiles).length} files in the kit, ${Object.keys(libFiles).length} in the library zip`);
