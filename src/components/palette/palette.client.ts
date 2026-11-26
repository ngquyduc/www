// Command palette (§8). Budget < 3 KB gzip.

import { toast } from "../../lib/toast";
import { copyText, flipTheme } from "../../lib/ui";
import { site } from "../../site";

interface Cmd {
  group: "Go to" | "Actions";
  label: string;
  words: string;
  glyph: string;
  hint: () => string;
  run: () => void;
}

const go = (href: string) => () => {
  location.href = href;
};
const open = (href: string) => () => {
  window.open(href, "_blank", "noopener");
};

const cmds: Cmd[] = [
  { group: "Go to", label: "Go to home", words: "home index start", glyph: "→", hint: () => "/", run: go("/") },
  {
    group: "Go to",
    label: "Go to work",
    words: "work projects experience case studies",
    glyph: "→",
    hint: () => "/work",
    run: go("/work"),
  },
  {
    group: "Go to",
    label: "Go to writing",
    words: "writing blog posts articles notes",
    glyph: "→",
    hint: () => "/writing",
    run: go("/writing"),
  },
  {
    group: "Go to",
    label: "Go to about",
    words: "about bio resume education",
    glyph: "→",
    hint: () => "/about",
    run: go("/about"),
  },
  {
    group: "Go to",
    label: "Go to contact",
    words: "contact email reach hire",
    glyph: "→",
    hint: () => "/contact",
    run: go("/contact"),
  },
  {
    group: "Go to",
    label: "Open GitHub",
    words: "github code repos",
    glyph: "↗",
    hint: () => "github.com",
    run: open(site.socials.github.href),
  },
  {
    group: "Go to",
    label: "Open LinkedIn",
    words: "linkedin profile",
    glyph: "↗",
    hint: () => "linkedin.com",
    run: open(site.socials.linkedin.href),
  },
  {
    group: "Actions",
    label: "Copy email address",
    words: "copy email mail contact hire",
    glyph: "@",
    hint: () => "clipboard",
    run: () => {
      copyText(site.email, "Email address copied").then((ok) => {
        if (!ok) location.href = `mailto:${site.email}`;
      });
    },
  },
  {
    group: "Actions",
    label: "Download résumé (PDF)",
    words: "download resume résumé cv pdf",
    glyph: "↓",
    hint: () => "PDF",
    run: () => {
      const a = document.createElement("a");
      a.href = site.resumePath;
      a.download = "resume.pdf";
      a.click();
      toast("Downloading resume.pdf");
    },
  },
  {
    group: "Actions",
    label: "Toggle theme",
    words: "toggle theme dark light mode appearance",
    glyph: "◐",
    hint: () => (document.documentElement.dataset.theme === "dark" ? "to light" : "to dark"),
    run: () => toast(`Theme: ${flipTheme()}`),
  },
];

const dlg = document.getElementById("cmdk") as HTMLDialogElement;
const input = document.getElementById("cmdk-q") as HTMLInputElement;
const list = document.getElementById("cmdk-list") as HTMLUListElement;
const count = document.getElementById("cmdk-count") as HTMLElement;
let hits: Cmd[] = [];
let active = 0;
let opener: HTMLElement | null = null;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function render(): void {
  const q = input.value.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  hits = cmds.filter((c) => terms.every((t) => `${c.label} ${c.words}`.toLowerCase().includes(t)));
  active = Math.min(active, Math.max(hits.length - 1, 0));
  let html = "";
  let group = "";
  hits.forEach((c, i) => {
    const g = q ? "Results" : c.group;
    if (g !== group) {
      group = g;
      html += `<li role="presentation" class="cmdk-group">${g}</li>`;
    }
    html += `<li id="cmdk-${i}" role="option" class="cmdk-opt" aria-selected="${i === active}" data-i="${i}"><span class="cmdk-glyph" aria-hidden="true">${c.glyph}</span><span class="flex-1">${c.label}</span><span class="cmdk-hint">${c.hint()}</span><span class="cmdk-enter" aria-hidden="true"></span></li>`;
  });
  if (!hits.length)
    html = `<li role="presentation" class="cmdk-empty">No command matches “${esc(input.value.trim())}”. Try “work”, “email” or “theme”.</li>`;
  list.innerHTML = html;
  count.textContent = `${hits.length} result${hits.length === 1 ? "" : "s"}`;
  syncActive();
}

function syncActive(): void {
  for (const li of list.querySelectorAll<HTMLElement>("[role=option]"))
    li.setAttribute("aria-selected", String(li.dataset.i === String(active)));
  if (hits.length) {
    input.setAttribute("aria-activedescendant", `cmdk-${active}`);
    document.getElementById(`cmdk-${active}`)?.scrollIntoView({ block: "nearest" });
  } else input.removeAttribute("aria-activedescendant");
}

function run(i: number): void {
  const c = hits[i];
  if (!c) return;
  dlg.close();
  c.run();
}

export function toggle(from?: Element | null): void {
  if (dlg.open) {
    dlg.close();
    return;
  }
  opener = from instanceof HTMLElement ? from : null;
  input.value = "";
  active = 0;
  render();
  dlg.showModal();
  input.focus();
}

input.addEventListener("input", () => {
  active = 0;
  render();
});

input.addEventListener("keydown", (e) => {
  const n = hits.length;
  const keys: Record<string, () => void> = {
    ArrowDown: () => {
      active = n ? (active + 1) % n : 0;
    },
    ArrowUp: () => {
      active = n ? (active - 1 + n) % n : 0;
    },
    Home: () => {
      active = 0;
    },
    End: () => {
      active = Math.max(n - 1, 0);
    },
    Enter: () => run(active),
  };
  const f = keys[e.key];
  if (!f) return;
  e.preventDefault();
  f();
  if (e.key !== "Enter") syncActive();
});

list.addEventListener("click", (e) => {
  const li = (e.target as Element).closest<HTMLElement>("[role=option]");
  if (li) run(Number(li.dataset.i));
});
list.addEventListener("pointermove", (e) => {
  const li = (e.target as Element).closest<HTMLElement>("[role=option]");
  if (li && Number(li.dataset.i) !== active) {
    active = Number(li.dataset.i);
    syncActive();
  }
});

// Click on the backdrop closes the dialog.
dlg.addEventListener("click", (e) => {
  if (e.target === dlg) dlg.close();
});
dlg.addEventListener("close", () => {
  opener?.focus();
  opener = null;
});
