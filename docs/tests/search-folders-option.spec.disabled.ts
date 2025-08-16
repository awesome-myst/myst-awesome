import { test, expect } from "@playwright/test";

test.describe("Search dialog with folders option", () => {
  test("transforms search result URLs correctly when folders: true", async ({
    page,
  }) => {
    // Use a page that renders DocsLayout (which includes the SearchDialog)
    await page.goto("/book/site-options");

    // Ensure SearchDialog script has initialized and attached listeners
    await page.waitForFunction(() => (window as any).__searchReady === true);

    // Wait for SearchDialog hooks/listeners to be available
    await page.waitForFunction(
      () => typeof (window as any).__searchOpen === "function"
    );

    // Open search dialog
    await page.evaluate(() => (window as any).__searchOpen());
    await page.waitForFunction(() => (window as any).__searchOpened === true);
    const openHost = page.locator("wa-dialog.search-dialog[open]");
    await expect(openHost).toHaveCount(1);

    // Search for "site options" which should return results for customization/site-options
    await page.evaluate(() => (window as any).__searchSetQuery("site options"));
    await page.waitForFunction(
      () => (window as any).__searchResultsCount() > 0
    );

    // Wait for results to be rendered in DOM
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".search-dialog[open] .results .result-item")
          .length > 0,
      { timeout: 10000 }
    );

    const items = openHost.locator(".results .result-item");
    await expect(items.first()).toHaveCount(1);

    // Initially, first result is selected
    await expect(items.first()).toHaveClass(/selected/);

    // Get the selected URL using the test hook
    const selectedUrl = await page.evaluate(() =>
      (window as any).__searchSelectedUrlPrefixed?.()
    );

    // The URL should be encoded with '--' when folders: true
    // Expected pattern: /book/customization--site-options
    expect(selectedUrl).toBeTruthy();
    expect(selectedUrl).toMatch(/\/book\/customization--site-options/);

    // Navigate to verify the URL works
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(selectedUrl);

    // Verify we're on the right page by checking title
    await expect(page.locator("h1")).toContainText("Site Options");
  });

  test("handles root page URL correctly when folders: true", async ({
    page,
  }) => {
    await page.goto("/book/site-options");

    // Ensure SearchDialog is ready
    await page.waitForFunction(() => (window as any).__searchReady === true);
    await page.waitForFunction(
      () => typeof (window as any).__searchOpen === "function"
    );

    // Open search dialog
    await page.evaluate(() => (window as any).__searchOpen());
    await page.waitForFunction(() => (window as any).__searchOpened === true);

    // Search for "MyST Awesome" which should return the root page
    await page.evaluate(() => (window as any).__searchSetQuery("MyST Awesome"));
    await page.waitForFunction(
      () => (window as any).__searchResultsCount() > 0
    );

    // Wait for results to be rendered
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".search-dialog[open] .results .result-item")
          .length > 0,
      { timeout: 10000 }
    );

    const items = page.locator(".search-dialog[open] .results .result-item");
    await expect(items.first()).toHaveCount(1);

    // Get the selected URL for the root page
    const selectedUrl = await page.evaluate(() =>
      (window as any).__searchSelectedUrlPrefixed?.()
    );

    // Root page should be /book/ (baseDir + "/")
    expect(selectedUrl).toBeTruthy();
    expect(selectedUrl).toBe("/book/");

    // Navigate to verify
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/book/");
  });

  test("handles nested folder URLs correctly when folders: true", async ({
    page,
  }) => {
    await page.goto("/book/typography");

    // Ensure SearchDialog is ready
    await page.waitForFunction(() => (window as any).__searchReady === true);
    await page.waitForFunction(
      () => typeof (window as any).__searchOpen === "function"
    );

    // Open search dialog
    await page.evaluate(() => (window as any).__searchOpen());
    await page.waitForFunction(() => (window as any).__searchOpened === true);

    // Search for "themes" which should return customization/themes
    await page.evaluate(() => (window as any).__searchSetQuery("themes"));
    await page.waitForFunction(
      () => (window as any).__searchResultsCount() > 0
    );

    // Wait for results to be rendered
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".search-dialog[open] .results .result-item")
          .length > 0,
      { timeout: 10000 }
    );

    const items = page.locator(".search-dialog[open] .results .result-item");
    await expect(items.first()).toHaveCount(1);

    // Get the selected URL
    const selectedUrl = await page.evaluate(() =>
      (window as any).__searchSelectedUrlPrefixed?.()
    );

    // Should be encoded as /book/customization--themes
    expect(selectedUrl).toBeTruthy();
    expect(selectedUrl).toMatch(/\/book\/customization--themes/);

    // Navigate to verify
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(selectedUrl);

    // Verify we're on the themes page
    await expect(page.locator("h1")).toContainText("Themes");
  });
});
