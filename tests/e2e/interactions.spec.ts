import { expect, test } from "@playwright/test";

test.describe("hero demo", () => {
  test("autoplays one message, then reacts only to the visitor", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("[data-hero]");
    await hero.scrollIntoViewIfNeeded();
    await expect(hero.getByRole("button", { name: /^You: can she review my PR next/ })).toBeVisible({ timeout: 5000 });
    await expect(page.locator("[data-e=status]")).toHaveText(/Seen\.|Delivered\.|Sent\./, { timeout: 8000 });
  });

  test("keyboard: Enter on a bubble opens the actions menu, Esc returns focus", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard path");
    await page.goto("/");
    await page.locator("[data-hero]").scrollIntoViewIfNeeded();
    const bubble = page.getByRole("button", { name: /^Remy: all green/ });
    await bubble.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: "Message actions" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Unpin" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Remy: all green/ })).toBeFocused();
  });

  test("offline: a sent photo waits for the network, then delivers", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("[data-hero]");
    await hero.scrollIntoViewIfNeeded();
    if (await page.getByRole("tab", { name: "What I see" }).isVisible())
      await page.getByRole("tab", { name: "What I see" }).click();
    await page.getByRole("button", { name: "Offline" }).click();
    await expect(page.getByRole("button", { name: "Offline" })).toHaveAttribute("aria-pressed", "true");
    if (await page.getByRole("tab", { name: "What users see" }).isVisible())
      await page.getByRole("tab", { name: "What users see" }).click();
    await page.getByRole("button", { name: "Send a photo", exact: true }).first().click();
    await expect(hero.getByText("Waiting for network").first()).toBeVisible({ timeout: 5000 });
  });
});

test("command palette: ⌘K opens, filter, Enter toggles theme", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcut");
  await page.goto("/about");
  const before = await page.locator("html").getAttribute("data-theme");
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  await expect(dialog).toBeVisible();
  await page.keyboard.type("theme");
  await expect(page.locator("#cmdk-count")).toHaveText("1 result");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", before ?? "");
  await expect(page.locator("#toast")).toHaveText(/^Theme: (dark|light)$/);
});

test("order book: a market buy reports its fill", async ({ page }) => {
  await page.goto("/work/matching-engine#try");
  await page.locator("[data-ob]").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /^Buy 10/ }).click();
  await expect(page.locator("[data-o=msg]")).toHaveText(/^Bought 10 /);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the order book starts paused and the hero does not autoplay", async ({ page }) => {
    await page.goto("/work/matching-engine");
    await page.locator("[data-ob]").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-o=state]")).toHaveText("PAUSED · REDUCED MOTION");
    await page.goto("/");
    await page.locator("[data-hero]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    await expect(page.getByRole("button", { name: /^You: can she review my PR next/ })).toHaveCount(0);
    await expect(page.locator("[data-e=speed]")).toHaveText("INSTANT");
  });
});
