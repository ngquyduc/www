# quyduc.vercel.app

Duc Nguyen's personal site: Astro + Tailwind v4, built from the spec in [`design/DESIGN.md`](design/DESIGN.md).

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # static site in dist/
pnpm preview      # serve dist/ (Astro 7 backgrounds it; `pnpm astro preview stop` to stop)
```

Checks (all run in CI, `.github/workflows/ci.yml`):

```bash
pnpm lint         # Biome
pnpm typecheck    # astro check, TypeScript strict
pnpm test         # Vitest: hero simulator and order-book engine
pnpm budget       # after a build: JS gzip budgets (DESIGN.md §11) and privacy checks
pnpm test:e2e     # Playwright + axe, light/dark, desktop/mobile
pnpm lhci         # Lighthouse CI, 95+ in every category
```

`PUBLIC_STRICT=1 pnpm build` fails while any placeholder is left (striped `[bracketed]` text, `<Placeholder>`, or the placeholder `public/resume.pdf`). Use it before launch.

## Where things live

- `src/site.ts`: name, role, **the only copy of the email**, socials, nav. Never add a phone number.
- `src/content/work/*.mdx`: every work item; frontmatter schema in `src/content.config.ts`. Strings in `[brackets]` render as placeholders.
- `src/content/work/matching-engine/bench.json`: benchmark numbers. `null` renders "Run benchmarks, then fill in"; fill only from reproducible runs.
- `src/content/writing/*.mdx`: posts. `draft: true` shows in `pnpm dev` only (`post-template.mdx` is a draft that shows every post component).
- `src/components/hero/`: the "What users see vs what I see" demo. `sim.ts` (pure simulator), `view.ts` (HTML used by both SSR and client), `art.ts` (invented illustrations, server-only), `hero.client.ts`.
- `src/components/orderbook/`: the simulated order book for the matching-engine page.

## Known deviations from the spec

- **Hero JS budget:** the hero demo is about 11 KB gzip against the 9 KB budget in §11. Home stays under its 15 KB total. `pnpm budget` reports it as a known overrun instead of failing.
- **Card text contrast:** in the light phone skin, `p-sub` on `p-recv` is 4.43:1 (under AA). Card descriptions and domains use `--p-sub-recv: #65666D` (5.06:1) instead.
