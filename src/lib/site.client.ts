// One delegated module for every page (§11 budget: < 1.5 KB gzip):
// theme toggle, copy buttons, toast, platform key labels and the lazy command palette.
import { copyText, flipTheme, syncToggles } from "./ui";

// Ctrl K on non-Apple platforms (§5.1).
if (!/Mac|iP(hone|ad|od)/.test(navigator.platform || navigator.userAgent)) {
  for (const k of document.querySelectorAll("[data-kbd]")) k.textContent = "Ctrl K";
}
syncToggles();

let palette: Promise<typeof import("../components/palette/palette.client")> | undefined;
const loadPalette = () => {
  palette ??= import("../components/palette/palette.client");
  return palette;
};
const openPalette = (opener?: Element | null) => loadPalette().then((m) => m.toggle(opener));

document.addEventListener("click", (e) => {
  const t = e.target as Element;
  if (t.closest("[data-theme-toggle]")) {
    flipTheme();
    return;
  }
  const opener = t.closest("[data-palette-open]");
  if (opener) {
    openPalette(opener);
    return;
  }
  const btn = t.closest<HTMLButtonElement>("[data-copy]");
  if (btn) {
    const code = btn.closest("figure")?.querySelector("pre");
    const text = code ? (code.textContent ?? "") : (btn.dataset.copy ?? "");
    const label = btn.textContent;
    copyText(text, btn.dataset.copyDone ?? "Copied").then((ok) => {
      if (!ok) {
        if (btn.dataset.copyFallback) location.href = btn.dataset.copyFallback;
        return;
      }
      btn.textContent = "Copied";
      setTimeout(() => {
        btn.textContent = label;
      }, 1600);
    });
  }
});

document.addEventListener("keydown", (e) => {
  const t = e.target as HTMLElement;
  const typing = t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openPalette(document.activeElement);
  } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    openPalette(document.activeElement);
  }
});

// Warm the palette on intent (hover or focus on an opener), or when the page goes idle.
for (const ev of ["pointerover", "focusin"]) {
  document.addEventListener(ev, (e) => {
    if ((e.target as Element).closest?.("[data-palette-open]")) loadPalette();
  });
}
if ("requestIdleCallback" in window) requestIdleCallback(() => loadPalette(), { timeout: 4000 });
else setTimeout(loadPalette, 2000);
