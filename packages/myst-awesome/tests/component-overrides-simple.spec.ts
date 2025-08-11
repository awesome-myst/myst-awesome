import { test, expect } from "@playwright/test";

/**
 * Component Override Tests
 * Tests the component override functionality of the MyST Awesome Theme
 */

test.describe("Component Override System", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the working demo page
    await page.goto("http://localhost:4322/working-demo", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector(
      ".custom-navigation-menu, .custom-table-of-contents, h1,h2",
      { timeout: 15000 }
    );
  });

  test("should load the component override demo page", async ({ page }) => {
    // Check that the page loads with the correct title
    await expect(page).toHaveTitle(/Working Demo/);

    // Check that the main content is present (custom navigation title)
    await expect(page.locator("h2").first()).toContainText("Custom Navigation");
  });

  test("should display custom navigation menu", async ({ page }) => {
    // Check if custom navigation menu is present
    const customNav = page.locator(".custom-navigation-menu").first();
    await expect(customNav).toBeVisible();

    // Check for custom navigation header
    const navTitle = page.locator(".custom-nav-title").first();
    await expect(navTitle).toBeVisible();
    await expect(navTitle).toContainText("Custom Navigation");

    // Check for sparkles icon in custom nav
    const sparklesIcon = page
      .locator('.custom-nav-title wa-icon[name="sparkles"]')
      .first();
    await expect(sparklesIcon).toBeVisible();
  });

  test("should display custom table of contents", async ({ page }) => {
    // Check if custom TOC is present
    const customToc = page.locator(".custom-table-of-contents").first();
    await expect(customToc).toBeVisible();

    // Check for custom TOC features
    const tocTitle = page.locator(".custom-toc-title").first();
    await expect(tocTitle).toBeVisible();
    await expect(tocTitle).toContainText("Demo TOC");
  });

  test("should have functional navigation links", async ({ page }) => {
    // Check that navigation links are clickable
    const navLinks = page.locator(".custom-nav-link");
    const firstLink = navLinks.first();

    await expect(firstLink).toBeVisible();
    await expect(firstLink).toHaveAttribute("href");
  });

  test("should have functional TOC links", async ({ page }) => {
    // Check that TOC links are clickable
    const tocLinks = page.locator(".custom-toc-link");
    const firstTocLink = tocLinks.first();

    await expect(firstTocLink).toBeVisible();
    await expect(firstTocLink).toHaveAttribute("href");
  });

  test("should apply custom styling", async ({ page }) => {
    // Check for custom CSS classes
    const customNav = page.locator(".custom-navigation-menu").first();
    await expect(customNav).toBeVisible();

    // Check for custom TOC card styling
    const customToc = page.locator(".custom-table-of-contents").first();
    await expect(customToc).toBeVisible();
  });

  test("should be responsive", async ({ page }) => {
    // Test desktop viewport first
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500); // Allow responsive changes to take effect

    const customNav = page.locator(".custom-navigation-menu").first();
    await expect(customNav).toBeVisible();

    const customToc = page.locator(".custom-table-of-contents").first();
    await expect(customToc).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow responsive changes to take effect

    // On mobile, navigation might be in a drawer that's initially hidden
    // Check if TOC is still visible (this page uses aside slot)
    await expect(customToc).toBeVisible();
  });
});
