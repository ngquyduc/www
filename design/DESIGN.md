# quyduc.vercel.app: Phase 1 design spec

**Status:** ready to build (rev 4, 2026-11-22) · **Owner:** Duc · **Build:** Astro + Tailwind v4 (pnpm), `redesign` branch, Vercel
**Design canvas (private artifact):** https://claude.ai/artifact/QhWE7j5PMhmw7cLqKSoqdS
**Canvas source:** `design/canvas/project/*.dc.html`. The hero demo (`DmDemo.dc.html`, states in `DmStates.dc.html`), order-book demo (`OrderBook.dc.html`) and palette (`Palette.dc.html`) are working references whose logic ports directly to TypeScript.

**Rev 2 changes.** Duc is no longer a student. He's a **Mobile Software Engineer at TikTok** on the instant-messaging SDK (iOS, increasingly cross-platform). The hero signature changed from an order book (it read as "HFT developer") to a messaging demo drawn from his actual domain. The order book is kept as a demo on the matching-engine depth page only. The headline stays "Systems-minded engineer who ships."

**Rev 3 changes.** At Duc's request, the abstract message trace became a two-pane **"What users see vs what I see"** demo: a generic phone-style DM screen that follows the light or dark theme, beside the engineer panel that reacts live to the same taps (send state machine, local DB writes, outbox, retry with backoff, pin sync). Long press pins a message. The demo is DM-app *style* only: no brand, logo, names or employer specifics.

**Rev 4 changes.** All content that came from reference screenshots is gone. The thread is now an invented, PG conversation with "Remy" about a cat that pushed to main. The demo gained message types: text with reply-quote and reactions, invented stickers, photo, 3-photo album, voice, shared video, link preview, system lines. Each type has its own pipeline in the engineer pane.

> `design/prototype/`, `design/build_prototype.py` and `design/screenshots/` are an **earlier exploration and are superseded**.

---

## 1. Direction: "Ledger and instrument"

Positioning: **a systems-minded engineer who ships.** The proof today is the messaging SDK behind TikTok chat. Earlier proof: Kovalee, dConstruct Robotics, Vebits, and systems side projects.

- **The ledger.** The base is a quiet editorial page: one sans, one mono, hairline rules, numbered sections (`01`, `02`), generous whitespace, and one amber accent used sparingly. Numbers are always set in mono.
- **The instrument.** It is the signature moment, once, on Home: **"What users see vs what I see"**.
  - Left: a phone-style DM screen. Type and send, or press and hold a bubble to pin it. Its skin follows the theme.
  - Right: the dark engineer panel, the same in both themes, which reacts live to those actions. It shows the send state machine (composing → local insert → sending → sent → delivered → seen), DB writes, an ordered outbox, retries with backoff, dedupe by client message id, and pin sync.
  - It shows the kind of problems Duc works on (the gap between a calm UI and what happens underneath) without exposing anything about any employer's systems.
- **Avoided on purpose:** gradients, glassmorphism, emoji or icon-font feature grids, boxed card grids for everything, scroll-reveal animation, 3D, purple, and anything that implies a trading background.

## 2. Principles and honesty rules

1. **Evidence before adjectives.** Every claim sits next to a number, a link or a date.
2. **One loud thing per page.** On Home that is the hero demo. Elsewhere it is the content.
3. **Label the tier.** Work is ordered by strength of evidence. Coursework is always tagged **Coursework** and credits module and co-authors. It is never presented as production work. Side projects are labelled as side projects.
4. **No invented numbers.** Allowed numbers (from the résumé): 2 apps/month · −20% latency · −50% training time · −50% runtime · <100 ms camera control · 6 junior TAs · 100+ students. Everything else (TikTok impact, start and end dates, benchmarks, team sizes) renders as a **placeholder** (§5.9) until Duc supplies it. Benchmark slots read **"Run benchmarks, then fill in"**.
5. **Simulations are labelled.** The hero demo's engineer panel carries a `SIMULATED` badge, labels every timing and size as simulated, and ends with "Simulated: a toy model of a chat client running in your browser, with a made-up conversation. Times and sizes are simulated and played back slowly. Not production code, not real data, and not any company's implementation." The order-book demo carries `SIMULATED` and "Not market data, and not a benchmark of the engine." Its timings and logic are generic textbook messaging concepts. The DM screen is DM-app *style* with an invented contact ("Remy") and an invented, PG conversation (no content from any screenshot, not even paraphrased): **no TikTok (or any) logo, name, brand asset, code, protocol, internal number, unreleased feature or architecture appears anywhere on the site.**
6. **Employer naming.** TikTok is named. The TikTok work entry (Work, About) also says TikTok Shop and Lemon8 use the SDK. *If Duc's NDA or comms policy prefers otherwise, delete that clause; nothing else depends on it.*
7. **Privacy.** Never render the phone number. The email comes from one constant (`src/site.ts`). No third-party form, map or analytics script in Phase 1.
8. **Private code.** The Go matching-engine repo is private. Show the text "Go port: private repo" with no link.

## 3. Information architecture

| Route | Template | Notes |
|---|---|---|
| `/` | Home | Pitch, "What users see vs what I see" hero demo, 4 featured items, latest writing (hidden if none), contact line |
| `/work` | Work index | Three tiers, anchors `#experience`, `#depth`, `#foundations` |
| `/work/tiktok`, `/work/kovalee`, `/work/dconstruct`, `/work/vebits` | Case study | dConstruct is drawn. The TikTok study must stay at the level of public facts and Duc's own role (see §12) |
| `/work/matching-engine` | Depth page | Architecture slot, **"Try it" order-book demo**, benchmark slots, method, findings |
| `/work/tcp-server-rust`, `/work/distributed-chat` | Depth page | Same template; until written, the Work card links to GitHub only |
| `/writing`, `/writing/[slug]` | Writing index, Post | Year groups, tag filter, empty state; code, figures, callouts, reading time |
| `/about` | About + résumé | Bio, experience, education, tools, **Download résumé (PDF)** |
| `/contact` | Contact | `mailto:` link + copy, GitHub, LinkedIn, Instagram. No form, no map |
| `/404` | Not found | "This page was never delivered." |
| `/resume.pdf`, `/rss.xml` | Static, feed | |

Primary nav: **Work · Writing · About · Contact**. The wordmark links Home. ⌘K reaches everything.

## 4. Design tokens

### 4.1 Colour

Light is `:root`. Dark is `[data-theme="dark"]`. Names map 1:1 to Tailwind v4 `--color-*`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F6F6F3` | `#0E1013` | Page |
| `raised` | `#FFFFFF` | `#15181D` | Palette, inputs, depth cards, outcome tiles, callouts |
| `sunken` | `#ECECE7` | `#0A0B0D` | Inline code, photo/thumbnail backing |
| `ink` | `#121417` | `#E8E8E3` | Text, primary button fill |
| `muted` | `#50555E` | `#A3A8B1` | Secondary text, ledes, meta |
| `subtle` | `#63686F` | `#8A9099` | Tertiary labels. Never on `sunken` |
| `line` | `#DCDCD5` | `#262A31` | Decorative hairlines only |
| `line-strong` | `#8A8D93` | `#646A74` | Borders that must be seen |
| `accent` | `#A04A00` | `#F0A848` | Section numbers, active nav underline, hover, one hero word |
| `accent-soft` | `#F5E6D3` | `#2B2114` | Filled tags, active palette row, placeholder stripes |
| `on-accent` | `#FFFFFF` | `#1A1203` | Text on accent fill |
| `focus` | `#1D5BD6` | `#8AB4FF` | Focus ring |

**Instrument (both themes):** `term-bg #0B0D10` · `term-raised #12151A` · `term-line #242932` · `term-ink #E6E8EB` · `term-muted #98A1AE` · `term-ok #3DDC84` (acked, read; bids in the demo) · `term-err #FF7A7A` (failed; asks in the demo) · `term-amber #F5B041` (in flight, retry, SIMULATED, selection). Extra values: own-bubble `#1B2029`, bubble border `#2A303B`, inner control border `#3A414D`, dashed rule `#2E3440`, pressed-toggle fill `#2B2114`. Send button: `term-ink` fill with `term-bg` label. Demo-only: Buy `#3DDC84`/`#04210F`, Sell `#FF6B6B`/`#2B0606`, depth bars at 13% alpha, fill flash `rgb(245 176 65 / .22)`.

**Contrast (computed, WCAG 2.x):**
- Text on `bg`, light / dark: ink 17.0 / 15.5, muted 6.9 / 8.0, subtle 5.2 / 5.9, accent 5.6 / 9.4, focus 5.5 / 9.1.
- Accent on accent-soft: 4.9 / 7.8. On-accent on accent: 6.0 / 9.2. `line-strong` vs bg: 3.1 / 3.5 (meets 3:1 non-text).
- Instrument on `#0B0D10`: ink 15.9, muted 7.5, err 7.7, ok 10.9, amber 10.4. Send label 15.9. Demo Buy label 9.6, Sell 6.7.
- State is never colour alone: every message status is a word (`Sending…`, `Waiting for network`, `Sent`, `Delivered`, `Seen`, `Not sent`), state-machine chips differ in outline, fill and `aria-current`, and log lanes are named (UI, DB, NET, SYNC).

**Hero phone skin** (only inside the demo's phone; it follows the site theme):

| Token | Light | Dark | Use |
|---|---|---|---|
| `p-bg` | `#FFFFFF` | `#000000` | Screen |
| `p-ink` | `#161823` | `#FFFFFF` | Text, icons |
| `p-sub` | `#6E6F76` | `#9A9BA1` | Status, timestamps, "Pinned" |
| `p-recv` | `#F1F1F2` | `#262628` | Received bubble |
| `p-sent` | `#3A55F5` | `#3A55F5` | Sent bubble, Send button (white text 5.5:1) |
| `p-banner` | `#F4F4F5` | `#161618` | Pinned banner |
| `p-input` | `#F1F1F2` | `#1C1C1E` | Composer pill |
| `p-photo` | `#D9DCE3` | `#2F3136` | Photo placeholder |
| `p-link` | `#2F4BE0` | `#7C93FF` | Tap to retry, menu ring, reply-quote bar, voice progress (theirs) |
| `p-err` | `#D92D20` | `#FF6B6B` | Not sent |
| `p-line` / `p-menu` | `#E6E6E8` / `#FFFFFF` | `#2A2A2D` / `#2A2A2D` | Menu, tray and reaction borders; menu fill |
| `p-chip` | `#FFFFFF` | `#1C1C1E` | Reaction pill, tray pills |
| `p-frame` | `#C9C9CE` | `#3A3A3F` | Phone frame |
| `p-focus` | `#1D5BD6` | `#8AB4FF` | Focus ring inside the phone |

Engineer log lane colours: UI `#E6E8EB`, DB `#8AB4FF` (9.3:1 on term-bg), NET `term-amber`, SYNC `term-ok`.

### 4.2 Type

- **IBM Plex Sans** (400, 500, 600, 700) and **IBM Plex Mono** (400, 500, 600), OFL. Self-host WOFF2, Latin subset, via `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono`. Preload Sans 400 and Mono 500. `font-display: swap`. Use metric-matched fallback faces to keep CLS near 0.
- Mono always sets `font-feature-settings: "tnum" 1, "zero" 1`.

| Token | Size / line-height | Weight · tracking | Use |
|---|---|---|---|
| `text-display` | 60 / 1.04 | 700 · −0.03em | Home h1 only |
| `text-3xl` | 44 / 1.1 | 700 · −0.025em | Page h1 |
| `text-2xl` | 32 / 1.2 (28 side-headed) | 600 · −0.02em | Section h2 |
| `text-xl` | 24 / 1.3 | 600 · −0.01em | Row titles, h3 |
| `text-lg` | 20 / 1.5 | 400 | Ledes |
| `text-base` | 17 / 1.6 | 400 | Body |
| `text-sm` | 14–15 / 1.5 | 400 | Meta, card body, nav |
| `mono-sm` | 13 / 1.4 | 500 | Numbers, dates, stack lines |
| `mono-xs` | 12 (11 in tags and state chips, 10 in record labels) | 500 · +0.08em · UPPERCASE | Kickers, labels |

Under 760 px container width: display → 38, 3xl → 30, 2xl → 24. Reading measure is 40 rem.

### 4.3 Space, layout, radius, border, elevation

- Spacing: Tailwind's default 4 px scale. Sections are 96 px apart on desktop, 64 px on mobile.
- Container: 72 rem (1152 px). Gutter 24 px, or 16 px under 760 px. Breakpoints `sm 40rem`, `md 48rem`, `lg 64rem`. The layout switch is at **760 px** (container query on the page wrapper, or `md`).
- Radius: `sm 4` (tags, inline code), `md 8` (buttons, inputs, cards, figures), `lg 14` (instrument panels, palette, code blocks), `full` (filter chips). Chat bubbles use 12 px with a 4 px "tail" corner (bottom-right for own messages, bottom-left for theirs).
- Borders are 1 px. `line` for hairlines, `line-strong` for controls and cards. A 1 px **ink** rule opens each list. Dashed accent is for placeholders only.
- Elevation: none, except the palette: `0 24px 64px rgb(0 0 0 / .28)`.
- Focus: 2 px `focus`, 2 px offset; 2 px `term-amber` inside instrument panels.

### 4.4 Motion

| Token | Value | Use |
|---|---|---|
| `fast` | 120 ms | Hover colour, button press (`translateY(1px)`) |
| `base` | 180 ms | Palette open/close, row arrow nudge (3 px), toast fade |
| `playback` | ×3 | Hero demo: simulated ms × 3 = real ms |
| `longpress` | 450 ms | Press-and-hold to open message actions. The pressed bubble shrinks to 0.96 and grows a 3 px `p-link` ring over the same 450 ms, linear, so the hold shows its own progress |
| `ping` | 1.6 s loop | The red dot in the "Live · try it" label: a ring that scales to 2.6× and fades |
| `flash` | 600 ms | Order-book demo fill highlight |
| `roll` | 320 ms | Order-book rolling digits, `ease` |
| `tick` | 700 ms | Order-book demo interval |
| `ease` | `cubic-bezier(.2,.7,.2,1)` | Everything |

The hero demo plays one message once (under 5 s, so WCAG 2.2.2 does not require a pause control), then moves only in response to the visitor. There are no scroll reveals, parallax or page transitions. Reduced motion: §6.6.

**Borrowed from Motion UI (motion.dev/ui).** Its components were reviewed for ideas, and these were taken, all built in CSS and a little JS (no Motion+ dependency):
- **"● LIVE · NAME" eyebrows.** Every interactive demo gets a `Live · try it` label: mono 11 px uppercase, `muted`, after a 7 px `#D92D20` dot with a ping ring. It sits before the Home hero kicker and under the "Try it" heading on the matching-engine page. Under reduced motion the dot stays and the ring is removed.
- **Suggestion chips** (like its Typewriter demo's suggested prompts). These are the quick replies in the hero phone (§6.1).
- **A cursor that morphs into feedback.** This became the hold-progress ring on a pressed message (`longpress` above) instead of a custom cursor.
- **AnimateNumber → rolling digits** in the order-book demo (§7.5).

Rejected, because they clash with §1 or §10: the Gallery, Carousel and Ticker (boxed media showcases and marquees), a custom Cursor (hides the system cursor and breaks with assistive tech), Curtains page transitions (there are none on purpose), and ScrambleText or splitText headlines (decorative motion on text people need to read).

### 4.5 Tailwind v4 mapping (`src/styles/global.css`)

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme {
  --color-bg: #F6F6F3; --color-raised: #FFFFFF; --color-sunken: #ECECE7;
  --color-ink: #121417; --color-muted: #50555E; --color-subtle: #63686F;
  --color-line: #DCDCD5; --color-line-strong: #8A8D93;
  --color-accent: #A04A00; --color-accent-soft: #F5E6D3; --color-on-accent: #FFFFFF; --color-focus: #1D5BD6;
  --color-term-bg: #0B0D10; --color-term-raised: #12151A; --color-term-line: #242932; --color-term-ink: #E6E8EB;
  --color-term-muted: #98A1AE; --color-term-ok: #3DDC84; --color-term-err: #FF7A7A; --color-term-amber: #F5B041;
  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --text-base: 1.0625rem; --text-base--line-height: 1.6;
  --text-lg: 1.25rem; --text-lg--line-height: 1.5;
  --text-xl: 1.5rem; --text-xl--line-height: 1.3;
  --text-2xl: 2rem; --text-2xl--line-height: 1.2;
  --text-3xl: 2.75rem; --text-3xl--line-height: 1.1;
  --text-display: 3.75rem; --text-display--line-height: 1.04;
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 14px;
  --ease-out: cubic-bezier(.2,.7,.2,1);
  --container-page: 72rem; --container-prose: 40rem;
}
[data-theme="dark"] {
  --color-bg: #0E1013; --color-raised: #15181D; --color-sunken: #0A0B0D; --color-ink: #E8E8E3;
  --color-muted: #A3A8B1; --color-subtle: #8A9099; --color-line: #262A31; --color-line-strong: #646A74;
  --color-accent: #F0A848; --color-accent-soft: #2B2114; --color-on-accent: #1A1203; --color-focus: #8AB4FF;
  color-scheme: dark;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; scroll-behavior: auto !important; }
}
```

### 4.6 Site icon: none

The site ships **without a favicon**. The template's yellow sheep-and-moon `logo.ico` is dropped and nothing replaces it, so do not copy `assets/logo.ico` or add any icon files to `public/`.

Browsers request `/favicon.ico` on their own when no icon is declared, which shows up as a 404 in logs. To stop that request and keep the tab's default blank icon, `Base.astro` declares an empty one:
```html
<link rel="icon" href="data:,">
<meta name="theme-color" content="#F6F6F3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1013" media="(prefers-color-scheme: dark)">
```
No web manifest and no Apple touch icon. If an icon is wanted later, it is a separate design pass.

## 5. Components (with states)

All of these are on the "Components and states" board. Its theme switch shows dark.

1. **Header.** Not sticky. Contents: wordmark (`QD` 30 px ink tile + "Duc Nguyen") · nav centred · "Jump to ⌘K" · theme toggle (40×40). Nav link states: default `muted`; hover `accent` + underline; current `ink` + 2 px accent underline (`aria-current="page"`); focus ring. **Mobile:** the nav wraps to a second row with all four links; no hamburger, no JS. "Jump to" hides. On `(hover: none)` devices the label is "Search". Use `Ctrl K` on non-Apple platforms.
2. **Theme toggle.** The icon shows the target theme (moon in light, sun in dark). `aria-label` is "Switch to dark theme" or "Switch to light theme".
3. **Buttons.** Primary: ink fill, bg text; hover accent fill, on-accent text. Secondary: `line-strong` outline; hover ink border on `raised`. Text link: underline in `line-strong`, accent on hover. Min height 44 (40 for header icons). Pressed: `translateY(1px)`.
4. **Tags.** Mono 11 uppercase. Filled (accent-soft): Experience, Depth. Outlined: Coursework, Built for fun, Write-up in progress, Case study. Dashed muted: Private repo. SIMULATED: amber on term-bg. Placeholder: striped.
5. **Featured row** and **post row**. The whole row is one `<a>`. Hover: arrow slides 3 px and turns accent. Rows are separated by hairlines.
6. **Experience row** (Work tier A). Date (mono 150 px) · company + role · summary · metric chips · stack line · "Case study →" or "No case study".
7. **Depth card** (Work tier B). `raised` + `line-strong`, md radius. Tags · title · description · stack · links (unlinked text for private code).
8. **Coursework ledger** (Work tier C). Table semantics. Columns: Project · Stack · Module · with · Code. Rows stack under 760.
9. **Placeholder** (`<Placeholder>`). 135° stripes in accent-soft + dashed accent outline; inline and block variants. **Fails the build when `PUBLIC_STRICT=1`.**
10. **Case-study blocks.** Facts `<dl>`, sticky TOC (hidden on mobile), numbered h2s (Outcome · Context · What I built · Decisions · In hindsight), outcome tiles (each with a method footnote), figure + caption, "Next case study".
11. **Callout.** Note / Decision / Caveat (Caveat is required next to any benchmark).
12. **Code block.** Instrument colours in both themes; header bar with filename, language and Copy ("Copied" for 1.6 s). Shiki theme: keyword amber, string `term-ok`, comment muted. Bleeds full width on mobile. Inline code on `sunken`.
13. **Hero demo (what users see vs what I see).** §6. **Order-book demo:** §7.
14. **Command palette.** §8.
15. **Toast.** Bottom centre, ink background, `role="status"`, 2.6 s.
16. **Empty state.** Dashed box, one bold and one muted sentence.
17. **Footer.** © 2026 Nguyen Quy Duc · Built with Astro | GitHub · LinkedIn · Instagram · Résumé (PDF) | "Press ⌘K to jump anywhere".
18. **404 terminal.** Decorative (`aria-hidden`): `> GET /path`, `attempt 1 … no route · attempt 2 … no route`, `404 not found · gave up, no retry will help`, nearest routes.

## 6. Home hero: "What users see vs what I see"

Reference implementation: `design/canvas/project/DmDemo.dc.html`. The states board is `DmStates.dc.html` (13 panels plus 2 mobile tabs).

There is also a local, no-sign-in preview: `design/canvas/preview/build.py` generates `dm-light.html`, `dm-dark.html` and `dm-mobile.html`. It runs the same template and logic through a ~60-line interpreter.

Port to:
- `src/components/hero/sim.ts`: a pure discrete-event simulator with no DOM. Unit-test it: order preserved; dedupe on lost ack; fail after 5 attempts; pin and reaction rollback; upload pause and resume offline; ordered flush.
- `HeroDemo.astro`: SSR markup of the boot frame.
- `hero.client.ts`: long press, menu, tray, voice playback, tabs and the loop.

**Content rule.** The conversation, names, captions, stickers and illustrations are **invented**, PG and clearly fictional:
- The contact is **Remy**. Remy's cat **Biscuit** walked across a keyboard and pushed to main.
- Only the *layout and interaction pattern* of a typical DM app is borrowed: pinned banner, bubble styles, "Seen", composer bar, press-and-hold to pin.
- No text, name, caption or image from any reference screenshot appears, and none is paraphrased.
- No brand, logo, employer detail, real user data or real domain is used. Link and video sources use `.example` domains.

### 6.1 Layout

There are two panes, side by side from 720 px of container width. On Home the demo sits below the pitch, under an ink rule with the kicker "What users see vs what I see" and the hint "Send a text, photo, voice note or video, or press and hold any message to pin it. The right side shows what the client does underneath. Simulated, with an invented conversation; not production code."

**What users see**: a phone, 360×720, 1 px frame, radius 32, no fake status bar. Its skin follows the site theme.
1. **Header** (56 px): back chevron · 32 px avatar "R" (`#BFD9C9` on `#1F3A2B`) · **Remy** (600, 16 px) over a presence line (`Active now` / `typing…` / `Waiting for network`, 11 px `p-sub`) · call and more icons (decorative).
2. **Pinned banner** (44 px, `p-banner`): pin glyph · "Remy: {text}" or "You: [Photo]" (ellipsis) · "syncing…" while unconfirmed · chevron. It shows the most recent pin and is hidden when nothing is pinned.
3. **Thread**: scrollable, newest at the bottom (`flex-direction: column-reverse`), with 24 items kept. Received bubbles have a 26 px avatar on the last bubble of each run. Pinned messages get a "Pinned" tag above them. A status line sits under the latest sent message, and under any message still in flight or failed. A typing bubble (`•••`) appears while Remy types.
4. **Hint pill** (1.8 s, `role="status"`): "Press and hold to pin, reply or react" after a short tap. On video and link cards it reads "The video would open in a player. Press and hold to pin." or "The link would open. Press and hold to pin."
5. **Reply bar** (when replying): "Replying to **Remy** · {snippet}" + ✕ (`aria-label="Cancel reply"`).
6. **Try chips** (quick replies, before the visitor has done anything): a scrolling row of 32 px pills, **Send a photo · Voice · Video · Hold to pin**, in `p-link` text with a `p-link` border on `p-chip` (hover `p-banner`, press scale 0.97). The first three send that type. **Hold to pin** opens the actions menu on the pinned message and logs "actions opened on #seq (on a phone: press and hold 450 ms)". The row is a labelled group ("Try the demo"). It hides while the tray, reply bar, menu or a draft is open, and for good after two visitor actions (sends, chips or long presses). Scripted state panels start with it hidden.
7. **Tray** (when + is open): pill buttons **Sticker · Photo · 3 photos · Voice · Video · Link**.
8. **Composer** (60 px):
   - **Send a photo** (camera)
   - input "Message Remy" (`p-input`, 40 px pill)
   - **Send a voice message** (mic)
   - **Send a sticker**
   - **More message types** (+, `aria-expanded`)
   - **Send** (34 px round, `p-sent`)

   Enter sends text. An empty input sends the next canned line.

**What I see**: the engineer panel, dark in both themes, min-height 720.
1. **Title bar:** `client` · `chat with Remy` · **SIMULATED** · `PLAYBACK ×3` or `INSTANT` · connection dot + word · **Flaky network** and **Offline** toggles (`aria-pressed`).
2. **Pipeline** for the focused message (the latest sent, or a retried one), or for the draft while typing:
   - Chips for that message type's stages (§6.3). Done = green outline; current = amber on `#2B2114` with `aria-current="step"`, or red when failed; pending = grey.
   - One exception chip when relevant: `UPLOADING n% (simulated)`, `UPLOAD PAUSED at n% · waiting for network`, `QUEUED · waiting for network`, `RETRY n in X ms (simulated)`, `FAILED after n attempts · user can retry`.
   - **Record grid:** TYPE · CLIENT ID · SERVER SEQ · STATUS · PAYLOAD (what actually travels: text length, sticker id, media ref, "video ref + thumbnail URL only", "URL + preview card") · ATTEMPTS · OUTBOX · PINS.
   - While composing the grid shows: TYPE (text, draft) · PERSISTED (no, memory only) · REPLY TO · TYPING INDICATOR (≤ 1 per 3 s) · OUTBOX · PINS.
3. **Event log:** the last 10 entries, `+N ms` (simulated, since the action began) · lane (**UI** `#E6E8EB`, **DB** `#8AB4FF`, **NET** `term-amber`, **SYNC** `term-ok`) · text. Warnings are amber, errors `term-err`. Server-side events are prefixed `(server)`.
4. **Status line** (`role="status"`), then the honesty note: "Simulated: a toy model of a chat client running in your browser, with a made-up conversation. Times and sizes are simulated and played back slowly. Not production code, not real data, and not any company's implementation."

**Under 720 px:** a pill tablist (**What users see** / **What I see**) shows one pane at a time with shared state. The phone fills the width up to 420 px, with `min-width: 0` so long banner text can't force overflow.

### 6.2 Message-type catalogue

Every type has a light and a dark skin through the `p-*` tokens, can be long-pressed (pin, reply, react), and is drawn on the states board.

| Type | Bubble design | Sendable from | Screen-reader text (bubble `aria-label`) |
|---|---|---|---|
| **Text** | `p-sent` with white text (mine) or `p-recv` with `p-ink` (theirs); radius 18; padding 9/14; max 250 px | Input + Enter or Send | "You: {text}…" / "Remy: {text}…" |
| **Text with reply-quote** | Quote block inside the bubble: 2 px inset bar (white 75% on mine, `p-link` on theirs), sender name 12 px bold, snippet 13 px | Long press → Reply, then send | "…, replying to {snippet}" |
| **Reaction row** | Pill under the bubble overlapping 6 px: `p-chip` background, `p-line` border, "😂 2" at 12 px | Long press → 😂 (toggles yours) | Pill `role="img"`: "Reactions: laughing 2, including you" |
| **Sticker** | No bubble; 96–104 px invented SVG art: a rubber duck in a hard hat holding a "SHIP IT" sign; a cat-paw stamp "LGTM" | Sticker button, or tray | SVG `role="img"`, e.g. "Sticker: a cat paw stamp that says LGTM" |
| **Photo** | No bubble; 210×148, radius 14; placeholder illustration (orange cat asleep on a laptop; the sent one wears a tiny hard hat); upload overlay is black 45% with "40%" or "Waiting for network" | Camera button, or tray | `role="img"` with alt, e.g. "Illustration: an orange cat asleep across a laptop keyboard" |
| **3-photo album** | 210 px grid, 2 columns × 2 rows, first tile spans 2 rows, 2 px gaps; tiles: mug, plant, cat-shaped cushion dent; same overlay | Tray → 3 photos | Group `role="img"`: "3 photos: a coffee mug, a desk plant and a cat-shaped dent in a cushion" |
| **Voice** | Bubble with a 32 px round play/pause button (white on mine, ink on theirs), 20-bar waveform (3 px bars, heights 6–24 px) that fills left to right during playback, `0:07` or `0:02 / 0:07` mono 12 | Mic button, or tray | §6.6 |
| **Shared video** | Card 220 px, `p-recv`, radius 16: 128 px dark thumbnail illustration, 44 px white play disc, duration badge, caption 14/600, "Shared video · video.example" | Tray → Video | "…Video, {caption}" |
| **Link preview** | Card 220 px, `p-recv`, radius 16: 84 px illustration strip, title 14/600, description 13 `p-sub`, domain 12 `p-sub` | Tray → Link | "…{title}" |
| **System line** | Centred 12 px `p-sub` with a pin glyph: "Remy pinned a message", "You pinned a message", "You unpinned a message" | Created by pin and unpin | Plain text |
| **Date divider** | Centred 12 px `p-sub`, e.g. "Saturday 9:41 PM" | Seed only | Plain text |
| **Status** (under a sent message) | 12 px: `Sending…` · `Uploading n%` · `Waiting for network` · `Sent` · `Delivered` · `Seen` · `Not sent ·` + **Tap to retry** (link button) | Automatic | Plain text |

Seed thread, top to bottom (the server seqs follow from it):
1. Date divider "Saturday 9:41 PM"
2. Remy: "update: biscuit walked across my keyboard"
3. Remy: "and pushed to main"
4. Remy: photo (cat asleep on a keyboard)
5. You, quoting 3: "did the tests at least pass"
6. Remy, pinned, 😂 2: "all green. she's now our most reliable engineer"
7. System line "Remy pinned a message"
8. Remy: voice, 0:07
9. You: duck sticker
10. Remy: link card "Commit history: 14 commits, all titled “mrrp”" (catsofgit.example)
11. Remy: video card "How to cat-proof a keyboard (part 1 of 47)", 0:15
12. You, Seen: "i'm adding her to the on-call rotation"

Canned lines and sends:
- Canned texts: "can she review my PR next", "please tell me you reverted it", "is she taking interns", "who gave the cat sudo".
- Remy's replies: "she says thanks for the review", "she is asking for equity", "new rule: no cats in prod", "lgtm (she sat on the trackpad)", or a paw sticker, or a short voice note.
- Canned media sends: photo "the same cat, now wearing a tiny hard hat"; video "Cat attends standup, says nothing, leaves" (0:12); link "On-call rotation: Biscuit (primary)" (oncall.example).

### 6.3 Pipelines (state machine per type)

Common states: `local → (uploading | queued)* → sending ⇄ retrying → sent → delivered → seen`, with `failed` reachable from sending or retrying after 5 attempts. `msg.stage` is the index of the step **in progress**. Stage 0 is complete at insert, so new messages start at `stage = 1`.

| Type | Stages (chips) | Local work before the outbox |
|---|---|---|
| text | LOCAL INSERT → SEND → ACK → DELIVERED → SEEN | none |
| sticker | LOCAL INSERT → SEND STICKER ID → ACK → DELIVERED → SEEN | none; the art comes from the local pack, so nothing is uploaded |
| image | LOCAL PREVIEW → COMPRESS → UPLOAD → SEND MEDIA REF → ACK → DELIVERED → SEEN | compress `U[120,220]` ms; upload `U[600,1000]` ms in 10% chunks |
| album | LOCAL PREVIEWS → COMPRESS ×3 → UPLOAD ×3 → SEND MEDIA REFS → ACK → DELIVERED → SEEN | compress; upload `U[1000,1600]` ms |
| voice | RECORD → ENCODE → UPLOAD → SEND MEDIA REF → ACK → DELIVERED → SEEN | encode `U[80,160]` ms; upload `U[300,500]` ms |
| video (share) | PICK VIDEO → RESOLVE REFERENCE → SEND REF ONLY → ACK → DELIVERED → SEEN | resolve `U[20,60]` ms; **no bytes uploaded**, only id + thumbnail URL |
| link | DETECT URL → UNFURL PREVIEW → SEND URL + CARD → ACK → DELIVERED → SEEN | unfurl `U[120,260]` ms (title + image fetched for the card) |

Stage bookkeeping:
- **Network stages** (the last four of every type): `transmit` sets `stage = len − 4`; `ack` sets `len − 2` (waiting for delivery); `delivered` sets `len − 1` (waiting for seen); `seen` marks everything done.
- **Uploads are resumable:** each 10% tick checks the connection. When offline the upload pauses (`state = queued`, log "upload paused at n%: waiting for network") and re-checks every 300 ms. A media message enters the outbox only after its upload finishes, so a later text can overtake an uploading photo. That's realistic, and the log makes it visible.
- **Pin, unpin and react** are outbox ops on an existing message: optimistic local change → outbox → ack (pins bump `pinV`) → SYNC fan-out. After 5 failures the optimistic change rolls back.

### 6.4 Data model (TypeScript)

```ts
type Ms = number;
type Kind = "text" | "sticker" | "image" | "album" | "voice" | "video" | "link" | "system" | "date";
type MsgState = "local" | "uploading" | "queued" | "sending" | "retrying" | "sent" | "delivered" | "seen" | "failed" | "recv";
interface Reaction { e: "😂"; n: number; me: boolean }
interface Msg {
  id: number; cid: string;                  // client id (8 hex), stable across retries → idempotent send
  mine: boolean; kind: Kind; state: MsgState;
  seq: number | null;                       // server sequence after ack
  stages: string[]; stage: number;          // per-type pipeline (§6.3)
  attempt: number; retryIn: Ms; upload: number | null;   // 0–100 while uploading
  replyTo: number | null; reactions: Reaction[];
  pinned: boolean; pinPending: boolean;
  // kind payloads
  text?: string; sticker?: "duck" | "paw"; alt?: string;            // image/album alt is required
  dur?: number | string; caption?: string;                          // voice seconds; video "0:15"
  url?: string; title?: string; desc?: string;                      // link card
}
type OpType = "send" | "pin" | "unpin" | "react";
interface Op { id: number; type: OpType; msgId: number; state: "queued" | "inflight" | "retrying" | "done" | "failed";
  attempt: number; retryIn: Ms; applied: boolean; serverVal: number | null; waitLogged: boolean }
type Lane = "UI" | "DB" | "NET" | "SYNC";
interface LogEntry { t: Ms; lane: Lane; text: string; kind: "" | "ok" | "warn" | "err" }
interface Sim {
  now: Ms; q: { at: Ms; fn: () => void }[];
  msgs: Msg[]; pinOrder: number[]; outbox: Op[]; inflight: Op | null;   // window 1
  seq: number; pinV: number; conn: "online" | "connecting" | "offline"; epoch: number; flaky: boolean;
  focusId: number | null; menuFor: number | null; replyTo: number | null; tray: boolean;
  playId: number | null; playPos: number;                               // voice playback (real time)
  logs: LogEntry[]; actT0: Ms; status: string; hint: string; peerTyping: boolean;
  script: ("ok" | "reqlost" | "acklost")[];
}
```

Constants:

| Name | Value | Meaning |
|---|---|---|
| `SLOW` | 3 | Real ms per simulated ms |
| `ACK_TIMEOUT` | 800 | Simulated ms before a request counts as lost |
| `MAX_ATTEMPTS` | 5 | Attempts before a send or op fails |
| `LONG_PRESS` | 450 ms (real) | Press-and-hold threshold |
| RTT | `U[50,140]`; flaky `U[160,420]` | Round trip |
| Flaky loss | `P = .4` | Half lose the request, half lose the ack |
| Backoff | `200·2^(n−1) + U[0,100]` | n = attempts so far |
| Delivered after ack | `U[40,120]` | |
| Seen after delivered | `U[500,1000]` | |
| Reply | `P = .5` after seen | Typing shown after `U[300,600]`, message after a further `U[700,1200]`; 65% text / 20% sticker / 15% voice |

Random numbers come from **mulberry32(seed)** (default 9), so the SSR boot frame is deterministic.

### 6.5 Engine (port line for line)

```
send(kind, data):
  startAction(); m = {cid: rand8hex, mine, kind, state: local, stage: 1, stages: PIPES[kind].stages, replyTo: sim.replyTo, …data}
  replyTo = null; tray = false; push; focusId = m.id
  log first event by kind:
    text    DB  "insert text, client id {4}, status=pending" [+ " reply_to=#seq"]
    sticker DB  'insert sticker "{id}" from the local pack (no upload needed)'
    image   DB  "insert photo row with a local file path; preview drawn from disk"
    album   DB  "insert 1 row with 3 local file paths; previews drawn from disk"
    voice   UI  "recorded a {n} s voice note (simulated)"
    video   UI  "picked a video to share; it is already hosted elsewhere"
    link    UI  "detected a URL in the draft"
  log UI "bubble shown at once (optimistic)"
  run PIPES[kind].pre in order; after each step stage++; then enqueue({type: send, msgId})
pre.compress: after U[120,220]: log UI "compressed photo, 4.1 MB → 0.4 MB (simulated)" (album: "3 photos, 11.8 MB → 1.1 MB")
pre.encode:   after U[80,160]:  log UI "encoded voice note to compressed audio, {3·dur} KB (simulated)"
pre.resolve:  after U[20,60]:   log NET "resolved the video to a reference (id + thumbnail URL)"; log NET "no video bytes leave the device"
pre.unfurl:   after U[120,260]: log NET "fetched page title and image for the preview card"
pre.upload:   tick every total/10: if offline → state=queued, log once "upload paused at n%…", retry in 300
              else first tick log NET "upload started in chunks, resumable"; state=uploading; upload += 10
              at 100: log NET ok "upload done: storage returned a media reference"; state=local; continue
pin(m) / react(m): startAction(); menuFor=null; apply optimistically (pin also appends system line "You pinned|unpinned a message")
                   log UI + DB "(optimistic)"; enqueue({type: pin|unpin|react, msgId})
enqueue / pump / transmit / timeout / goOffline / goOnline: as in rev 2 (window 1, epoch guards, acklost → server applies,
                   ACK_TIMEOUT, backoff, dedupe on retry by client id, fail after 5 with rollback for non-send ops)
ack(send):  seq = serverVal ?? ++seq; state=sent; stage=len−2; log NET ok "ack seq #s, rtt ms" (+": duplicate dropped by client id")
            log DB "update {4} status=sent seq=s"; after U[40,120] whenOnline: delivered, stage=len−1, log SYNC 'delivery receipt: "Delivered"'
            after U[500,1000] whenOnline: seen, log SYNC 'read receipt: "Seen"'; maybe peerReply()
ack(react): log NET ok "reaction ack"; log SYNC "reaction event sent to Remy"
ack(pin):   pinV = serverVal ?? ++pinV; pinPending=false; log NET ok "{pin|unpin} ack, pins vN"; log SYNC "… fanned out: Remy's banner updates too"
UI events:  pointerdown (primary) → holdId = id (bubble gets the dm-hold ring animation) → 450 ms timer → menu (log UI "long press 450 ms on a {kind} message: actions open")
            pointerup before 450 ms → clear holdId, hint; pointerleave → clear holdId, cancel; contextmenu → preventDefault
            userActs++ on every send, chip and long press; try chips render while userActs < 2
            click with event.detail === 0 (Enter/Space) → same menu; Esc in menu → close
            menu: Pin/Unpin · Reply (sets replyTo, log UI "Reply tapped: the next message will quote #seq") · 😂 (react) · Cancel
            voice play: toggles playId; playPos += 0.25 s every 250 ms real time until dur, then resets
            composing: first char → log UI "composing: draft held in memory"; typing indicator ≤ 1 per 3 s (real)
```

Every concept is public, textbook messaging behaviour:
- optimistic local writes
- local previews
- client-side compression and encoding
- resumable chunked upload returning a media reference
- sending references instead of bytes for shared videos
- link unfurling for previews
- an ordered outbox
- ack timeouts, backoff with jitter
- idempotent retry by client id
- server sequence numbers
- delivery and read receipts
- optimistic pins and reactions with fan-out and rollback
- throttled typing indicators

**Nothing refers to any employer's services, protocols, classes, metrics, features or architecture.** All sizes and timings are labelled simulated.

### 6.6 Accessibility

- Panes are labelled `section`s, which become `tabpanel`s for the mobile `tablist`. The thread is a labelled group, deliberately not `role="log"`.
- Every message is a `<button aria-haspopup="menu" aria-expanded>` whose label names the sender, type, text or alt, caption, reply target and pinned state, then says "Press and hold, or press Enter, for actions." Long press always has a keyboard equivalent. The menu is `role="menu"` with `menuitem`s; Esc and Cancel close it and return focus to the bubble. The 😂 item has an `aria-label` ("React with laughing" or "Remove laughing reaction").
- **Images:** `alt` is required by the data model and the content schema. Photos use `role="img"` with an alt that describes the illustration; an album gets one label listing all three tiles; stickers describe the art and any words on it. Purely decorative SVG (icons, video thumbnail art, link strip) is `aria-hidden`.
- **Voice player:**
  - The play/pause control is a separate `<button>`, not nested in the bubble. Its label is "Play voice message, 7 seconds" or "Pause voice message, 7 seconds".
  - The waveform is `aria-hidden`. The time is `role="timer"` with an `aria-label` of "Duration 0:07" or "0:02 of 0:07", so screen readers aren't flooded during playback.
  - Playback runs only when the visitor presses Play, including under reduced motion, which only removes autoplay and the slow playback.
  - Space or Enter toggles playback.
- **Cards** (video, link) are single buttons. A short tap explains that the player or link would open.
- **Reactions** are a pill with `role="img"` and a full label ("Reactions: laughing 2, including you").
- **Live regions:** only the engineer status line (polite) and the hint pill. Autoplay announcements are suppressed until the first user action.
- **Targets:** composer icon buttons are 28–34 px wide with spacing, above the 24 px minimum; menu items and tray pills are 32–36 px; tabs are 40 px. Focus rings are `p-focus` in the phone and `term-amber` in the panel.
- **Contrast (phone skins):**
  - Light: ink 17.7, sub 5.0, link 6.6, error 4.8, sub on banner 4.6.
  - Dark: ink 21, sub 7.6, link 7.5, error 7.6, sub on banner 6.5.
  - White on `p-sent` 5.5; bubble text 15.7 (light) and 15.1 (dark).
  - Upload overlay text is white on 45% black over the light illustration, at least 4.6:1.

### 6.7 States (on the states board)

| | State | Mode |
|---|---|---|
| A | Idle → autoplay one text (light) | `live` |
| B | Photo sent and seen (dark) | `photo` |
| C | Album uploading at 60% | `album` |
| D | Voice sent (dark) | `voice` |
| E | Shared video, reference only | `video` |
| F | Link preview, waiting for Seen (dark) | `link` |
| G | Sticker | `sticker` |
| H | Long-press menu + tray open (dark) | `menu` |
| I | Replying, composing | `reply` |
| J | Pinned + system line (dark) | `pinned` |
| K | Flaky network: retry + dedupe | `retry` |
| L | Offline: upload paused + text queued (dark) | `offline` |
| M | Reduced motion | `reduced` |
| N | Mobile "What users see" tab | |
| O | Mobile "What I see" tab (voice pipeline, dark) | |

On the site, only `live` is used (and `reduced` under the media query). `still` is for static previews.

## 7. Order-book demo (matching-engine depth page only)

Reference: `design/canvas/project/OrderBook.dc.html`. It appears in the depth page's **"Try it"** section, below Architecture, with the copy: "A small simulated book running in your browser, with the same price-time rules as the engine… a toy for intuition, not the engine and not market data." It is no longer on Home.

### 7.1 Model
`Level {p: Cents (integer, tick 0.01), q: 1..99}`; asks ascending and bids descending, 8 kept and 5 shown; tape newest first, 12 kept and 8 shown (4 on mobile); `last`, `dir`; `flash: Set<Cents>`; `paused`; `msg`. `TICK_MS = 700`, `USER_QTY = 10`, `MID0 = 10000`.

### 7.2 Random source
```ts
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
```

### 7.3 Logic
- **Init:** levels `10001+i` / `9999−i` with `q = ri(6,24)+4i`, then warm the tape with 8 simulated takers.
- **`fill(side, qty, who)`:** walk the opposite side best-first, consuming `min(left, level.q)` per level and removing empty levels; record `last`, `dir`, and a tape entry with VWAP; then `refill()`.
- **`refill()`:** top both sides up to 8 contiguous levels (`q = ri(10,40)`). If the spread is greater than 2 ticks, with p = .6 a maker improves one side by 1 tick (`q = ri(3,12)`). Truncate to 8. Invariant: `asks[0].p > bids[0].p`.
- **`tick()`** every 700 ms:
  - p = .50: maker add (60%, `+ri(1,10)`, cap 99) or cancel (40%, `−ri(1,8)`) at index `floor(rnd·rnd·6)`.
  - p = .35: simulated taker of `ri(1,8)`.
  - p = .15: pull the best quote on a random side.
  - Then `refill()`.
- **`market(side)`** (Buy 10 / Sell 10): `fill(side, 10, "you")`. Flash the traded levels that still exist (else the new best). Status: "Bought 10 @ 100.01, filled at the best ask." or "Bought 10 across 2 levels: 6 @ 100.01, 4 @ 100.02 (avg 100.014). The best ask only had 6."
- **Render:** asks reversed (highest at top); cumulative depth bars as % of max(cumAsk5, cumBid5); mid to 3 dp; spread and last to 2 dp with ▲/▼; tape price to 2 dp if VWAP is whole cents, else 3; sim clock `mm:ss.s` = ticks × 0.7 s; buttons show `@ best price`.

### 7.4 States and accessibility
Live · after fill (600 ms amber flash, YOU row) · paused (Play + Step) · reduced motion (starts paused, "PAUSED · REDUCED MOTION") · off-screen (stops silently) · mobile (tape below, 4 rows). `role="region"`; book and tape as labelled tables; only the status line is live; Pause/Play visible (WCAG 2.2.2); native buttons.

### 7.5 Rolling digits
Numbers that change in place roll like an odometer, after Motion UI's AnimateNumber: **LAST**, **MID** and **SPREAD** in the stats bar, the **SIZE** column of the book, and the prices on **Buy 10 @** and **Sell 10 @**. Row prices, the TOTAL column, the mid-book spread line and the trade tape stay plain. Levels shift and tape rows are inserted, so rolling those would just be noise.
- **Markup:** every digit is a 1.4 em-tall clipped column (`.ob-col`) holding a strip of 11 glyphs (blank, 0–9). The digit sets the strip's `translateY(-(d + 1) × 1.4em)`. Separators (`.`) are plain text. The transform transitions over `roll` (320 ms, `ease`), so 99.99 → 100.00 rolls each column on its own.
- **Width is fixed per value**, so columns keep their identity: prices always have 2 decimals, MID 3, and SIZE pads to 2 columns with a blank (leading-zero) glyph. Never key columns from the left for a value whose length changes.
- **Accessibility:** the roller is `aria-hidden`. The real value sits beside it in a visually hidden span, so table cells and buttons read as "100.00", not as eleven digits.
- **Reduced motion:** `transition: none`. Digits swap instantly.
- **Astro:** a `RollingNumber` helper in `orderbook.client.ts` diffs the old and new strings and only touches columns that changed. Keep the elements across ticks: re-creating them would cancel the roll.

## 8. Command palette (⌘K / Ctrl+K)

Reference: `design/canvas/project/Palette.dc.html`.
- **Open:** ⌘K / Ctrl+K (toggle), the header button, or `/` outside text fields. Native `<dialog>` + `showModal()`.
- **Layout:** 600 px wide (full width minus 32 px on mobile), top 14vh, `raised` + `line-strong`, lg radius, the one shadow; scrim `rgb(18 20 23 / .42)` in light, `rgb(0 0 0 / .62)` in dark. Input row 56 px; list max 360 px; footer "↑ ↓ move · ↵ run · esc close" + count.
- **Commands:**

| Group | Label | Keywords | Action |
|---|---|---|---|
| Go to | Go to work | work projects experience case studies | `/work` |
| Go to | Go to writing | writing blog posts articles notes | `/writing` |
| Actions | Copy email address | copy email mail contact hire | clipboard → toast "Email address copied" (fallback `mailto:`) |
| Actions | Download résumé (PDF) | download resume résumé cv pdf | `/resume.pdf` download → toast |
| Actions | Toggle theme | toggle theme dark light mode appearance | flip + persist → toast "Theme: dark" |

  Optional: Go to home / about / contact, Open GitHub / LinkedIn.
- **Filter:** every whitespace-separated term must be a substring of `label + keywords`; keep the order; groups collapse to "Results"; empty state "No command matches “q”. Try “work”, “email” or “theme”."
- **Keys:** ↑/↓ wrap · Home/End · Enter · Esc · hover sets the active item · click runs it.
- **ARIA:** combobox input (`aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`), `listbox` / `option[aria-selected]`, group headers `presentation`, polite count. Active row: accent-soft + `↵`.

## 9. Page layouts

Desktop is drawn at 1440 (container 1152); mobile at 390 (16 px gutters). All pages share the header and footer.

**Home.**
1. Hero, stacked: the pitch block (max 46 rem), then 48 px of space, then the demo at full container width (§6).
   - Kicker "● Singapore · Software engineer".
   - h1 display "Systems-minded engineer who **ships**." (accent on "ships").
   - Lede: "I'm Duc, a mobile software engineer at TikTok, working on the instant-messaging SDK: on iOS, and more and more cross-platform. Before that I shipped at Kovalee, dConstruct Robotics and Vebits."
   - CTAs: "See my work →" and "Résumé (PDF)".
   - The demo section opens with an ink rule, an accent kicker "What users see vs what I see" and the mono hint "Send a text, photo, voice note or video, or press and hold any message to pin it. The right side shows what the client does underneath. Simulated, with an invented conversation; not production code."
2. `01 Selected work`, 4 rows:
   - TikTok (Experience · `[impact metric]` placeholder).
   - dConstruct Robotics (−20% latency).
   - Exchange matching engine (Depth · side project · "Benchmarks: TBD").
   - Kovalee (2 apps / month).
3. `02 Latest writing`: 3 newest posts, or omitted entirely.
4. Contact line: "Want to talk mobile, SDKs or systems? Email me." + email + Copy + GitHub + LinkedIn.

**Mobile:** single column; the demo becomes two tabs (What users see / What I see) below the CTAs.

**Work.** h1 "Ordered by strength of evidence: shipped work first, then depth, then the foundations." + pill anchors (5 / 3 / 7).
- **A · Real-world experience:**
  - TikTok (`[start] – now`, Mobile Software Engineer, "Instant-messaging SDK. TikTok is the main client; TikTok Shop and Lemon8 also build on it. Started on iOS; the team now works more and more cross-platform.", metric placeholder, stack placeholder).
  - Kovalee (`Aug 2024 – [end]`, past tense).
  - dConstruct.
  - Vebits.
  - NUS SoC Teaching Assistant (no case study).
- **B · Depth projects:** matching engine (Depth page · Code (C++) · Go port: private repo), Async TCP server (Rust · Tokio), Distributed chat (Go · Kitex RPC · Redis). Context tag placeholder.
- **C · Foundations and built for fun:** Coursework ledger (MPI, CUDA, PeerPrep) and Built-for-fun grid (Gymaite, Caroubuy, Monkey, HobbyList).

**Experience case study** (dConstruct drawn; the same template serves TikTok, Kovalee and Vebits). Back link → tags → sentence h1 → lede → facts → sticky TOC + 40 rem prose: Outcome · Context · What I built · Decisions · In hindsight → Next.

**Project depth page** (matching engine). Header links: "Code (C++) on GitHub ↗", "Go port · private repo", "Try a simulated book below ↓". Sections:
1. 01 Problem.
2. 02 Architecture (16:7 slot) → **↳ Try it** (order-book demo, max 720 px, anchor `#try`).
3. 03 Benchmarks (4 metric slots, chart slot with p50–p99.9 axes, C++ solid vs Go hatched, Method `<details>`).
4. 04 Findings.
5. 05 Next.

**Writing index / Post.** As drawn: year groups, tag chips, reading time = ceil(words ÷ 230); post column 40 rem, code and figures 48 rem.

**About.** Aside: photo slot, name, "Mobile software engineer at TikTok · Singapore", **Download résumé (PDF)**, file meta, socials. Bio (3 paragraphs: TikTok IM SDK and cross-platform; Kovalee, dConstruct, Vebits, "I studied Computer Science at NUS"; side projects). Experience (TikTok first). Education: NUS B.Comp (Hons) CS `2021 – [grad year]`, NOC Paris 2024. Tools (cross-platform stack placeholder).

**Contact.** h1 "Email is the fastest way to reach me." Lede "About roles, mobile and SDK work, or anything on this site. I'm in Singapore (UTC+8)." Big mono email + Copy; GitHub, LinkedIn, Instagram; no-form note.

**404.** "This page was never delivered." + Home · Work · Search with ⌘K + decorative retry-log terminal.

## 10. Interaction, motion and accessibility

- Hover: accent colour (120 ms); arrows nudge 3 px (180 ms). Press: `translateY(1px)`.
- Palette: opacity + 4 px translate, 180 ms. Copy: label swaps to "Copied" with a toast or status.
- Theme switch: no colour transition; `color-scheme` follows the theme.
- Reduced motion: transitions at 0 ms; hero demo has no autoplay and completes instantly; demo book starts paused.
- Skip link, one h1 per page, labelled landmarks, native controls only, 44 px targets (40 px header icons), visible focus, `aria-current`, `aria-pressed`, `rel="me"`, `alt` required by the schema, `<time datetime>`. No horizontal scroll at 375/390 px.
- Live regions only for: hero engineer status, hero hint pill, demo status, palette count, copy confirmations, toast.

## 11. Implementation notes for Astro

```
src/
  site.ts                      // name, role ("Mobile Software Engineer, TikTok"), email (THE only place), socials, resumePath, nav
  styles/global.css            // §4.5
  layouts/Base.astro  CaseStudy.astro  DepthPage.astro  Post.astro
  components/Header  Footer  ThemeToggle  Tag  Placeholder  FeaturedRow  ExperienceRow  DepthCard
             CourseworkTable  FunItem  Outcome  Figure  Callout  BenchChart  CodeBlock
  components/hero/sim.ts                // §6, pure; unit-test: order, dedupe, fail after 5, pin rollback, offline flush
  components/hero/HeroDemo.astro        // SSR boot frame from seed: phone (skin via data-theme) + engineer panel
  components/hero/hero.client.ts        // long press, keyboard menu, tabs, loop
  components/orderbook/engine.ts  OrderBook.astro  orderbook.client.ts   // §7, depth page only
  components/palette/CommandPalette.astro + palette.client.ts
  content.config.ts  content/work/*.mdx  content/writing/*.mdx
  pages/index  work/index  work/[slug]  writing/index  writing/[slug]  about  contact  404  rss.xml.ts
public/resume.pdf  og/*.png   // no favicon files (§4.6)
```

**Content collections (zod)**
```ts
work: {
  title: string; slug: string; tier: "experience" | "depth" | "coursework" | "fun";
  org?: string; role?: string; start: string; end?: string;            // end undefined = present
  summary: string; stack: string[];
  metrics?: { value: string; label: string; source: "resume" | "benchmark" | "public" }[];
  links?: { label: string; href?: string }[];                          // no href → plain text (private)
  context?: "employment" | "internship" | "personal" | "coursework";
  coursework?: { module: string; coAuthors: string[] };                // required when tier === "coursework"
  demo?: "orderbook";                                                  // depth page embeds the demo in "Try it"
  featured?: number; status: "published" | "in-progress" | "upcoming"; hasPage: boolean;
  cover?: image(); coverAlt?: string;
}
writing: { title: string; date: Date; summary: string; tags: string[]; draft: boolean; updated?: Date }
```

**Client-side islands (everything else ships zero JS)**

| Piece | How | Budget (gzip) |
|---|---|---|
| Theme init | Inline head script: saved choice, else `prefers-color-scheme`; try/catch | < 0.4 KB |
| Theme toggle, copy buttons, toast | One delegated module in Base | < 1.5 KB |
| Command palette | Loaded on first ⌘K, header-button hover or focus, or idle | < 3 KB |
| **Hero demo** | Home only; IntersectionObserver start (`client:visible` equivalent); vanilla TS; sticker and illustration SVGs inline | < 9 KB |
| Order-book demo | `/work/matching-engine` only; `client:visible` | < 4 KB |
| Writing tag filter | Links to `?tag=` with a tiny in-place filter | < 0.5 KB |

Home stays under 15 KB of JS, and other pages under 5 KB (the depth page under 9 KB). No UI framework is required.

**Other:** `@astrojs/mdx`, `sitemap`, `rss`; Shiki theme from term tokens; `astro:assets` images; Fontsource (no Google Fonts request in production); per-page meta + OG; email from the current `index.html` `mailto:`; never `tel:`.

## 12. Content Duc still needs to supply

These are placeholders, not design questions:
- **Employer policy check (before launch):** confirm with your employer's policy (NDA, social media and public-statements rules) that the hero demo (a generic DM-style UI plus a simulated client panel) and naming TikTok, TikTok Shop and Lemon8 are OK to publish.
- **TikTok:** start date; one or two **public-safe** impact lines or metrics (e.g. what you own, scale only if already public); the stack line (languages, cross-platform framework); confirmation that naming TikTok Shop and Lemon8 is OK. The TikTok case study must avoid internal architecture, metrics and roadmap. Write it as role, problems in general terms, and what you learned.
- Kovalee end date; NUS graduation year.
- Coursework modules and co-authors; personal vs coursework for each depth project.
- Matching-engine benchmarks, method and architecture diagram.
- Case-study prose for dConstruct, Kovalee and Vebits.
- Photo, résumé PDF, first blog post, one line for the Rust TCP server.
