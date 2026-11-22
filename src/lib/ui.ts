import { toast } from "./toast";

const root = document.documentElement;

export function setTheme(next: "light" | "dark"): void {
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {}
  syncToggles();
}

export function flipTheme(): "light" | "dark" {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function syncToggles(): void {
  const label = root.dataset.theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  for (const b of document.querySelectorAll("[data-theme-toggle]")) b.setAttribute("aria-label", label);
}

export async function copyText(text: string, done: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
    return true;
  } catch {
    return false;
  }
}
