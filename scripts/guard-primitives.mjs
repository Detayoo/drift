import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

// Raw HTML tags. Only primitives may own them (plus html/body in app/layout).
const RAW = new Set([
  "div", "p", "span", "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "button", "input", "select", "textarea", "label", "form",
  "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tr", "td", "th",
  "section", "main", "header", "footer", "article", "aside", "nav",
  "img", "video", "audio", "canvas", "iframe",
  "svg", "path", "circle", "rect", "line", "g",
  "hr", "br", "pre", "code", "blockquote", "strong", "em", "small",
  "details", "summary", "fieldset", "legend",
]);

const PRIMITIVE_RE = /src\/components\/primitives\//;
const LAYOUT_RE = /src\/app\/layout\.tsx$/;
const LAYOUT_ALLOW = new Set(["html", "body", "head"]);

function files(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

const offenders = [];
for (const file of files(SRC)) {
  if (!/\.(tsx?|mjs|js)$/.test(file)) continue;
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const m = line.match(/<([a-z][a-z0-9]*)(?=[\s/>])/);
    if (!m || !RAW.has(m[1])) return;
    if (PRIMITIVE_RE.test(rel)) return;
    if (LAYOUT_RE.test(rel) && LAYOUT_ALLOW.has(m[1])) return;
    offenders.push(`${rel}:${i + 1} <${m[1]}>`);
  });
}

if (offenders.length) {
  console.error("Raw HTML outside primitives:\n" + offenders.map((o) => `  ${o}`).join("\n"));
  console.error("\nRule: raw tags live only in src/components/primitives (Box owns <div>, AppText owns text, Fields owns inputs). Features compose primitives.");
  process.exit(1);
}
console.log("primitives guard: clean");
