import { readFileSync } from "node:fs";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import type { Plugin } from "vite";
import { codeTheme, titleTransformer } from "./src/lib/code-theme.mjs";

// Self-hosted Fontsource WOFF2, Latin subset (§4.2). Astro generates metric-matched fallbacks.
const variants = (pkg: "sans" | "mono", weights: [string, ...string[]]) => {
  const v = (w: string) => ({
    src: [`@fontsource/ibm-plex-${pkg}/files/ibm-plex-${pkg}-latin-${w}-normal.woff2`] as [string],
    weight: w,
    style: "normal" as const,
    display: "swap" as const,
  });
  const [first, ...rest] = weights;
  return [v(first), ...rest.map(v)] as [ReturnType<typeof v>, ...ReturnType<typeof v>[]];
};

// Vite routes every client dynamic import through a ~0.9 KB preload helper, even when there is
// nothing to preload. Our lazy chunks (palette, hero, order book) have no JS or CSS deps, so with
// modulePreload off the helper is always called with an empty list: replace it with a one-liner.
const slimPreloadHelper: Plugin = {
  name: "slim-preload-helper",
  configEnvironment(name, config) {
    if (name === "client") {
      config.build ??= {};
      config.build.modulePreload = false;
    }
  },
  generateBundle(_, bundle) {
    if (this.environment?.name !== "client") return;
    const chunks = Object.values(bundle).filter((c) => c.type === "chunk");
    if (chunks.some((c) => c.viteMetadata?.importedCss?.size)) return;
    for (const c of chunks) {
      if (c.fileName.includes("preload-helper") && c.exports.length === 1) {
        c.code = `const p=f=>f();export{p as ${c.exports[0]}};`;
      }
    }
  },
};

// PUBLIC_STRICT=1 builds fail while any placeholder remains (§5.9): Placeholder.astro covers
// page content; this covers the placeholder résumé in public/.
const strictAssets = {
  name: "strict-assets",
  hooks: {
    "astro:build:start": () => {
      if (process.env.PUBLIC_STRICT !== "1") return;
      if (readFileSync("public/resume.pdf", "latin1").includes("PLACEHOLDER RESUME"))
        throw new Error(
          "public/resume.pdf is still the placeholder. Add the real résumé, or build without PUBLIC_STRICT=1.",
        );
    },
  },
};

export default defineConfig({
  site: "https://quyduc.vercel.app",
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "always" },
  integrations: [strictAssets, mdx(), sitemap({ filter: (page) => !page.includes("/404") })],
  markdown: {
    shikiConfig: { theme: codeTheme, transformers: [titleTransformer] },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: "IBM Plex Sans",
      cssVariable: "--font-plex-sans",
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
      options: { variants: variants("sans", ["400", "500", "600", "700"]) },
    },
    {
      provider: fontProviders.local(),
      name: "IBM Plex Mono",
      cssVariable: "--font-plex-mono",
      fallbacks: ["ui-monospace", "monospace"],
      options: { variants: variants("mono", ["400", "500", "600"]) },
    },
  ],
  vite: { plugins: [tailwindcss(), slimPreloadHelper] },
});
