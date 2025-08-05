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

    // Get viewport width to determine mobile vs desktop behavior
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize && viewportSize.width <= 768;

    if (isMobile) {
      // On mobile, main content should be visible but h1 might be in a collapsed layout
      await expect(page.locator("main")).toBeVisible();

      // Check that we can access the h1 via the mobile toggle or that content is loading
      await page.waitForTimeout(1000); // Give time for layout to settle

      // Check if the page has some content - either h1 is visible or we can access mobile nav
      const h1Visible = await page.locator("h1").first().isVisible();
      const toggleVisible = await page
        .locator(".mobile-nav-toggle")
        .isVisible();

      // At least one of these should be true on a properly loaded mobile page
      expect(h1Visible || toggleVisible).toBe(true);
    } else {
      // On desktop, check that the page loaded normally
      await expect(page.locator("h1").first()).toBeVisible();
    }

    // Check for basic layout elements - main should always be visible
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

    // Get viewport width to determine mobile vs desktop behavior
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize && viewportSize.width <= 768;

    if (isMobile) {
      // On mobile, check that the toggle button is available
      await expect(page.locator(".mobile-nav-toggle")).toBeVisible({
        timeout: 10000,
      });

      // Click the mobile toggle to open the drawer and check for nav links
      await page.locator(".mobile-nav-toggle").click();
      await page.waitForTimeout(500); // Wait for drawer animation

      // Check if navigation links are available in the drawer
      const navLinks = page
        .locator(".mobile-nav-drawer a")
        .filter({ hasText: /Home|Typography|Page/ });
      await expect(navLinks.first()).toBeVisible({ timeout: 5000 });
    } else {
      // On desktop, check if there are any navigation links visible
      const navLinks = page
        .locator("a")
        .filter({ hasText: /Home|Typography|Page/ });
      await expect(navLinks.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("main content area is functional", async ({ page }) => {
    await page.goto("/book/typography");

    // Wait for the page to fully load
    await page.waitForTimeout(1000);

    // Check if main content area exists - this should work on both mobile and desktop
    await expect(page.locator("main")).toBeVisible();

    // Get viewport width to determine mobile vs desktop behavior
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize && viewportSize.width <= 768;

    if (isMobile) {
      // On mobile, content might be in a collapsed layout
      // Check that we have some content indicators
      const hasMainContent = await page.locator("main").isVisible();
      const hasToggleButton = await page
        .locator(".mobile-nav-toggle")
        .isVisible();

      // At least the main area and mobile controls should be present
      expect(hasMainContent && hasToggleButton).toBe(true);
    } else {
      // On desktop, check if there's actual content
      await expect(
        page.locator("article, .content, .myst-content")
      ).toBeVisible({
        timeout: 10000,
      });
    }
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
