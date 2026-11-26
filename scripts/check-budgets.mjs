// Checks the built site in dist/ against DESIGN.md §11 JS budgets (gzip) and the §2 privacy
// rules. Run after `pnpm build`. Exits non-zero on any failure.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = "dist";
const KB = 1024;
const gz = (s) => gzipSync(s, { level: 9 }).length;
const read = (p) => readFileSync(p, "utf8");
const fails = [];
const warns = [];

// Per-piece budgets. A piece is matched by the chunk names it contains.
// `known` marks an overrun that is reported to Duc rather than silently re-budgeted.
const PIECES = [
  {
    name: "Theme init (inline head script)",
    limit: 0.4 * KB,
    page: "index.html",
    inline: /localStorage\.getItem\("theme"\)/,
  },
  { name: "Theme toggle, copy, toast (Base module)", limit: 1.5 * KB, files: [/^Base\.astro/, /^preload-helper/] },
  { name: "Command palette", limit: 3 * KB, files: [/^palette\.client/] },
  {
    name: "Hero demo",
    limit: 9 * KB,
    files: [/^HeroDemo\.astro/, /^hero\.client/],
    known: "spec budget is 9 KB; the full port of §6 is over it, see README",
  },
  { name: "Order-book demo", limit: 4 * KB, files: [/^OrderBook\.astro/, /^orderbook\.client/] },
  { name: "Writing tag filter (inline)", limit: 0.5 * KB, page: "writing.html", inline: /URLSearchParams/ },
];
const PAGES = [
  { match: (p) => p === "index.html", limit: 15 * KB },
  { match: (p) => p === "work/matching-engine.html", limit: 9 * KB },
  { match: () => true, limit: 5 * KB },
];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(DIST);
const html = files.filter((f) => f.endsWith(".html"));
const jsDir = join(DIST, "_astro");
const chunks = Object.fromEntries(
  readdirSync(jsDir)
    .filter((f) => f.endsWith(".js"))
    .map((f) => [f, read(join(jsDir, f))]),
);

// JS reachable from a chunk through static and dynamic imports.
function reach(file, seen = new Set()) {
  if (seen.has(file) || !chunks[file]) return seen;
  seen.add(file);
  for (const m of chunks[file].matchAll(/["'`]\.\/([\w.-]+\.js)["'`]/g)) reach(m[1], seen);
  return seen;
}

const pad = (s, n) => String(s).padEnd(n);
const fmt = (b) => `${(b / KB).toFixed(2)} KB`;

console.log("Pieces (gzip):");
for (const piece of PIECES) {
  let size = 0;
  if (piece.inline) {
    const page = read(join(DIST, piece.page));
    const m = [...page.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].find((x) => piece.inline.test(x[1]));
    size = m ? gz(m[1]) : 0;
  } else {
    for (const [f, code] of Object.entries(chunks)) if (piece.files.some((re) => re.test(f))) size += gz(code);
  }
  const over = size > piece.limit;
  const line = `  ${pad(piece.name, 42)} ${pad(fmt(size), 10)} / ${fmt(piece.limit)}`;
  console.log(`${line}${over ? (piece.known ? "  OVER (known)" : "  OVER") : ""}`);
  if (over)
    (piece.known ? warns : fails).push(
      `${piece.name}: ${fmt(size)} > ${fmt(piece.limit)}${piece.known ? ` (${piece.known})` : ""}`,
    );
}

console.log("\nPages (all JS a page can load, gzip):");
for (const file of html) {
  const rel = relative(DIST, file);
  const page = read(file);
  const entries = [...page.matchAll(/<script[^>]*src="\/_astro\/([^"]+\.js)"/g)].map((m) => m[1]);
  const all = new Set();
  for (const e of entries) reach(e, all);
  let size = [...all].reduce((n, f) => n + gz(chunks[f]), 0);
  for (const m of page.matchAll(/<script(?![^>]*src)(?![^>]*type="application)[^>]*>([\s\S]*?)<\/script>/g))
    size += gz(m[1]);
  const budget = PAGES.find((p) => p.match(rel)).limit;
  const over = size > budget;
  console.log(`  ${pad(rel, 32)} ${pad(fmt(size), 10)} / ${fmt(budget)}${over ? "  OVER" : ""}`);
  if (over) fails.push(`${rel}: ${fmt(size)} > ${fmt(budget)}`);

  // §2.7: never render the phone number or use tel:. §2.8: no link to the private Go repo.
  if (/href="tel:/i.test(page)) fails.push(`${rel}: contains a tel: link`);
  if (/\+?65\s?9774\s?7903|97747903/.test(page)) fails.push(`${rel}: contains the phone number`);
  if (/href="[^"]*matching-engine-go/.test(page)) fails.push(`${rel}: links the private Go repo`);
  // §4.6: no favicon files, an empty icon instead.
  if (!page.includes('<link rel="icon" href="data:,">')) fails.push(`${rel}: missing the empty icon link`);
}
if (files.some((f) => /favicon|apple-touch-icon|\.ico$|manifest\.webmanifest/.test(f)))
  fails.push("dist contains favicon or manifest files (§4.6)");

for (const w of warns) console.warn(`\nWARN ${w}`);
if (fails.length) {
  console.error(`\n${fails.length} failure(s):\n${fails.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(1);
}
console.log("\nBudgets and privacy checks passed.");
