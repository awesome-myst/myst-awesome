import { test, expect } from "@playwright/test";

test.describe("MyST Awesome Docs", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load and check for expected content (be more specific about which h1)
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page).toHaveTitle(/MyST Awesome/);
  });

  test("typography page loads successfully", async ({ page }) => {
    await page.goto("/book/typography");

    // Check that the page loaded
    await expect(page.locator("h1").first()).toBeVisible();

    // Check for basic layout elements
    await expect(page.locator("main")).toBeVisible();
  });

  test("article page loads successfully", async ({ page }) => {
    await page.goto("/article/typography");

    // Check that the page loaded
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("astro-collections page loads successfully", async ({ page }) => {
    await page.goto("/astro-collections");

    // Check that the page loaded
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/book/typography");

    // Wait for the page to fully load
    await page.waitForTimeout(1000);

    // Check if there are any navigation links
    const navLinks = page
      .locator("a")
      .filter({ hasText: /Home|Typography|Page/ });
    await expect(navLinks.first()).toBeVisible({ timeout: 10000 });
  });

  test("main content area is functional", async ({ page }) => {
    await page.goto("/book/typography");

    // Wait for the page to fully load
    await page.waitForTimeout(1000);

    // Check if main content area exists
    await expect(page.locator("main")).toBeVisible();

    // Check if there's actual content
    await expect(page.locator("article, .content, .myst-content")).toBeVisible({
      timeout: 10000,
    });
  });

  test("responsive design works", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/book/typography");

    // Just check that the main content is visible
    await expect(page.locator("main")).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // On mobile, main content should still be visible
    await expect(page.locator("main")).toBeVisible();
  });

  test("Web Awesome components load", async ({ page }) => {
    await page.goto("/book/typography");

    // Wait for Web Awesome components to be defined
    await page.waitForFunction(
      () => {
        return (
          window.customElements &&
          window.customElements.get("wa-icon") !== undefined
        );
      },
      { timeout: 10000 }
    );

    // Check that icons are present
    const icons = page.locator("wa-icon");
    await expect(icons.first()).toBeVisible({ timeout: 5000 });
  });
});
