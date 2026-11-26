import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const pages = [
  "/",
  "/work",
  "/work/tiktok",
  "/work/kovalee",
  "/work/dconstruct",
  "/work/vebits",
  "/writing",
  "/about",
  "/contact",
];

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
}

for (const path of pages) {
  for (const theme of ["light", "dark"] as const) {
    test(`${path} (${theme}): one h1, no console errors, no axe violations`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await setTheme(page, theme);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("h1")).toHaveCount(1);
      // Let the lazy islands mount before scanning.
      await page.waitForTimeout(400);
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      // No horizontal scroll (§10: 375/390 px).
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
}

test("unknown routes get the 404 page", async ({ page }) => {
  const res = await page.goto("/projects/old-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page was never delivered.");
});

test("privacy: no phone number and no tel: links anywhere", async ({ page }) => {
  for (const path of [...pages, "/404"]) {
    await page.goto(path);
    const html = await page.content();
    expect(html).not.toContain("tel:");
    expect(html).not.toMatch(/9774\s?7903/);
  }
});

test("honesty: simulations are labelled, the Go port is unlinked", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".eg-sim")).toHaveText("SIMULATED");
  // On mobile the engineer pane sits behind a tab, so check presence rather than visibility.
  await expect(page.getByText("Not production code, not real data, and not any company's implementation.")).toHaveCount(
    1,
  );
  await page.goto("/work");
  await expect(page.locator('a[href*="matching-engine-go"]')).toHaveCount(0);
});

test("hidden school projects have no page and are not listed", async ({ page }) => {
  for (const slug of ["matching-engine", "tcp-server-rust", "distributed-chat", "peerprep", "hobbylist"]) {
    const res = await page.goto(`/work/${slug}`);
    expect(res?.status()).toBe(404);
  }
  for (const path of ["/", "/work", "/about"]) {
    await page.goto(path);
    await expect(
      page.locator('a[href^="/work/matching-engine"], a[href*="peerprep"], a[href*="hobbylist"]'),
    ).toHaveCount(0);
    await expect(page.getByText(/CS3211|CS3210|CS3219|CS2103T/)).toHaveCount(0);
  }
});
