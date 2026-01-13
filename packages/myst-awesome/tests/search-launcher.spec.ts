import { test, expect, devices } from "@playwright/test";

const testUrl = "http://localhost:4322/docs-example";

test.describe("Search launcher in header", () => {
  test("search launcher is visible in header on desktop", async ({ page }) => {
    await page.goto(testUrl);
    await page.waitForLoadState("domcontentloaded");

    // Check that the search launcher is present in the header
    const headerSearch = page.locator(".header-search .search-launcher-input");
    await expect(headerSearch).toBeVisible();
  });

  test("search dialog opens when clicking header search launcher", async ({
    page,
  }) => {
    await page.goto(testUrl);
    await page.waitForLoadState("domcontentloaded");

    // Wait for search to be ready
    await page.waitForFunction(() => (window as any).__searchReady === true, {
      timeout: 10000,
    });

    // Click the header search launcher
    const headerSearch = page.locator(".header-search .search-launcher-input");
    await headerSearch.click();

    // Verify dialog opens
    await page.waitForFunction(() => (window as any).__searchOpened === true, {
      timeout: 5000,
    });
    const dialog = page.locator("wa-dialog.search-dialog[open]");
    await expect(dialog).toHaveCount(1);
  });

  test("search opens with '/' keyboard shortcut", async ({ page }) => {
    await page.goto(testUrl);
    await page.waitForLoadState("domcontentloaded");

    // Wait for search to be ready
    await page.waitForFunction(() => (window as any).__searchReady === true, {
      timeout: 10000,
    });

    // Press '/' to open search
    await page.keyboard.press("/");

    // Verify dialog opens
    await page.waitForFunction(() => (window as any).__searchOpened === true, {
      timeout: 5000,
    });
    const dialog = page.locator("wa-dialog.search-dialog[open]");
    await expect(dialog).toHaveCount(1);
  });

  test("search dialog closes with Escape key", async ({ page }) => {
    await page.goto(testUrl);
    await page.waitForLoadState("domcontentloaded");

    // Wait for search to be ready
    await page.waitForFunction(() => (window as any).__searchReady === true, {
      timeout: 10000,
    });

    // Open search
    await page.evaluate(() => (window as any).__searchOpen());
    await page.waitForFunction(() => (window as any).__searchOpened === true, {
      timeout: 5000,
    });

    // Close with Escape
    await page.keyboard.press("Escape");

    // Verify dialog closes
    await page.waitForFunction(() => (window as any).__searchOpened === false, {
      timeout: 5000,
    });
  });
});

test.describe("Search consistency across viewports", () => {
  test("search works on mobile viewport (navigation collapsed)", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(testUrl);
    await page.waitForLoadState("domcontentloaded");

    // Wait for search to be ready
    await page.waitForFunction(() => (window as any).__searchReady === true, {
      timeout: 10000,
    });

    // On very small screens, header search might be hidden, but '/' shortcut should still work
    await page.keyboard.press("/");

    // Verify dialog opens
    await page.waitForFunction(() => (window as any).__searchOpened === true, {
      timeout: 5000,
    });
    const dialog = page.locator("wa-dialog.search-dialog[open]");
    await expect(dialog).toHaveCount(1);
  });

  test("search works on tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(testUrl);
    await page.waitForLoadState("domcontentloaded");

    // Wait for search to be ready
    await page.waitForFunction(() => (window as any).__searchReady === true, {
      timeout: 10000,
    });

    // Check that the search launcher is visible
    const headerSearch = page.locator(".header-search .search-launcher-input");
    await expect(headerSearch).toBeVisible();

    // Click to open
    await headerSearch.click();

    // Verify dialog opens
    await page.waitForFunction(() => (window as any).__searchOpened === true, {
      timeout: 5000,
    });
    const dialog = page.locator("wa-dialog.search-dialog[open]");
    await expect(dialog).toHaveCount(1);
  });

  test("search dialog is present in DOM regardless of navigation state", async ({
    page,
  }) => {
    await page.goto(testUrl);
    await page.waitForLoadState("domcontentloaded");

    // The dialog should always be in the DOM (rendered by BasePage)
    const dialog = page.locator("wa-dialog.search-dialog");
    await expect(dialog).toHaveCount(1);

    // Check on mobile viewport too
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100); // Allow viewport change to settle

    // Dialog should still be present
    await expect(dialog).toHaveCount(1);
  });

  test("search open/close behavior is consistent on desktop and mobile", async ({
    page,
  }) => {
    await page.goto(testUrl);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForFunction(() => (window as any).__searchReady === true, {
      timeout: 10000,
    });

    // Test on desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    // Open
    await page.evaluate(() => (window as any).__searchOpen());
    await page.waitForFunction(() => (window as any).__searchOpened === true);

    // Close
    await page.evaluate(async () => await (window as any).__searchClose());
    await page.waitForFunction(() => (window as any).__searchOpened === false);

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);

    // Open
    await page.evaluate(() => (window as any).__searchOpen());
    await page.waitForFunction(() => (window as any).__searchOpened === true);

    // Close
    await page.evaluate(async () => await (window as any).__searchClose());
    await page.waitForFunction(() => (window as any).__searchOpened === false);
  });
});
