import { test, expect } from "@playwright/test";

test.describe("Basic Functionality", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("http://localhost:4322/");
    await expect(page).toHaveTitle(/MyST Awesome Theme Demo/);
    await expect(page.locator("h1").first()).toContainText(
      "MyST Awesome Theme"
    );
  });

  test("should navigate between pages", async ({ page }) => {
    await page.goto("http://localhost:4322/", {
      waitUntil: "domcontentloaded",
    });
    await page.click('a[href="/working-demo"]');
    await page.waitForLoadState("domcontentloaded");
    // Wait for main content to be visible (avoid matching elements in closed drawers/dialogs)
    await page.waitForSelector(
      ".page-main h1, .page-main h2, main h1, main h2",
      { timeout: 15000, state: "visible" }
    );
    await expect(page).toHaveTitle(/Working Demo/);
    await expect(page.locator("h1").first()).toContainText("Working Demo");
  });
});
