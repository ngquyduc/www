import { expect, test } from "@playwright/test";

// DESIGN.md §13.6 step 11: plates are decoration, experience cards are single links named by
// their org, nothing owed by Duc reaches a production build, and motion never hides content.

const pages = ["/", "/work", "/about", "/work/tiktok", "/work/kovalee", "/work/dconstruct", "/work/vebits"];
const orgs = ["TikTok", "Kovalee", "dConstruct Robotics", "Vebits AI"];

test("every plate is aria-hidden", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const plates = page.locator("[data-plate] svg");
    const n = await plates.count();
    if (path !== "/about") expect(n, path).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(plates.nth(i)).toHaveAttribute("aria-hidden", "true");
  }
});

test("experience cards are single links with the org in the accessible name", async ({ page }) => {
  for (const path of ["/", "/work"]) {
    await page.goto(path);
    await expect(page.locator("a.xc")).toHaveCount(4);
    await expect(page.locator("a.xc a, a.xc button")).toHaveCount(0);
    for (const org of orgs) await expect(page.getByRole("link", { name: new RegExp(`^${org}\\b`) })).toHaveCount(1);
  }
});

test("production pages render no placeholders", async ({ page }) => {
  for (const path of [...pages, "/contact", "/writing"]) {
    await page.goto(path);
    await expect(page.locator("[data-placeholder]"), path).toHaveCount(0);
  }
});

test("reduced motion: nothing waits for an animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator(".io-wait, .io-in")).toHaveCount(0);
});

test.describe("no JS", () => {
  test.use({ javaScriptEnabled: false });
  test("section rules, figures and plates are fully drawn", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".io-wait")).toHaveCount(0);
    const rule = await page
      .locator(".shead")
      .first()
      .evaluate((el) => getComputedStyle(el, "::after").transform);
    expect(rule === "none" || rule === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
    await expect(page.locator(".ledger dd").first()).toContainText("iOS");
  });
});

test("first view: off-screen section heads wait, then draw", async ({ page }) => {
  await page.goto("/");
  const head = page.locator(".shead").first();
  await head.scrollIntoViewIfNeeded();
  await expect(head).toHaveClass(/io-in/);
});
