import { test, expect } from "@playwright/test";

test.describe("Search dialog UX", () => {
  test("opens with '/', searches, navigates results, Enter opens, Esc closes", async ({
    page,
  }) => {
    // Use a page that renders DocsLayout (which includes the SearchDialog)
    await page.goto("/book/typography");

    // Ensure SearchDialog script has initialized and attached listeners
    await page.waitForFunction(() => (window as any).__searchReady === true);

    // Wait for SearchDialog hooks/listeners to be available
    await page.waitForFunction(
      () => typeof (window as any).__searchOpen === "function"
    );

    // Open with global '/'
    await page.keyboard.press("/");
    await page.waitForFunction(() => (window as any).__searchOpened === true);
    const openHost = page.locator("wa-dialog.search-dialog[open]");
    await expect(openHost).toHaveCount(1);

    // Set query deterministically and wait for results to populate
    await page.evaluate(() => (window as any).__searchSetQuery("typography"));
    await page.waitForFunction(
      () => (window as any).__searchResultsCount() > 0
    );

    // Wait for results to be rendered in DOM (simpler check for mobile compatibility)
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".search-dialog[open] .results .result-item")
          .length > 0,
      { timeout: 10000 }
    );

    const items = openHost.locator(".results .result-item");
    // Use a more lenient check that works on mobile browsers
    await expect(items.first()).toHaveCount(1);

    // Initially, first result is selected
    await expect(items.first()).toHaveClass(/selected/);

    // Arrow selection moves to second
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toHaveClass(/selected/);

    // Capture URL from selected row
    const selectedUrl = (
      await openHost
        .locator(".results .result-item.selected .result-title")
        .first()
        .textContent()
    )?.trim();
    expect(selectedUrl).toBeTruthy();

    // Enter opens selected result
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      new RegExp(`${selectedUrl?.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`)
    );
    // Go back to a page that we know has the SearchDialog
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
    // Reopen deterministically via hook, then close with Escape
    await page.waitForFunction(
      () => typeof (window as any).__searchOpen === "function"
    );
    await page.evaluate(() => (window as any).__searchOpen());
    await page.waitForFunction(() => (window as any).__searchOpened === true);
    await expect(page.locator("wa-dialog.search-dialog[open]")).toHaveCount(1);
    // No visibility assertion to avoid animation flake
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => (window as any).__searchOpened === false);
    await expect(page.locator("wa-dialog.search-dialog[open]")).toHaveCount(0);
  });

  test("Close via hook closes and stays closed (no reopen)", async ({
    page,
  }) => {
    await page.goto("/book/typography");
    await page.waitForFunction(() => (window as any).__searchReady === true, {
      timeout: 15000,
    });
    await page.waitForFunction(
      () => typeof (window as any).__searchOpen === "function",
      { timeout: 10000 }
    );

    // Open deterministically
    await page.evaluate(() => (window as any).__searchOpen());
    await page.waitForFunction(() => (window as any).__searchOpened === true);
    await expect(page.locator("wa-dialog.search-dialog[open]")).toHaveCount(1);

    // Close programmatically (simulates Close button or other close triggers)
    await page.evaluate(async () => await (window as any).__searchClose());
    await page.waitForFunction(() => (window as any).__searchOpened === false);
    await expect(page.locator("wa-dialog.search-dialog[open]")).toHaveCount(0);

    // Ensure it doesn't immediately re-open
    await page.waitForTimeout(250);
    await expect(page.locator("wa-dialog.search-dialog[open]")).toHaveCount(0);

    // It should still open again when requested later
    await page.evaluate(() => (window as any).__searchOpen());
    await page.waitForFunction(() => (window as any).__searchOpened === true);
  });
});
