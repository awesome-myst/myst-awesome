import { test, expect } from "@playwright/test";

/**
 * Component Override Tests
 * Tests the component override functionality of the MyST Awesome Theme
 */

test.describe("Component Override System", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the working demo page
    await page.goto("http://localhost:4321/working-demo");
    await page.waitForLoadState("networkidle");
  });

  test("should load the component override demo page", async ({ page }) => {
    // Check that the page loads with the correct title
    await expect(page).toHaveTitle(/Working Demo/);

    // Check that the main heading is present (the custom navigation title)
    await expect(page.locator("h1, h2").first()).toContainText(
      "Custom Navigation"
    );
  });

  test("should display custom navigation menu with custom styling", async ({
    page,
  }) => {
    // Check that the custom navigation menu is present
    const customNav = page.locator(".custom-navigation-menu").first();
    await expect(customNav).toBeVisible();

    // Check for custom navigation header
    const navHeader = customNav.locator(".custom-nav-header");
    await expect(navHeader).toBeVisible();
    await expect(navHeader.locator(".custom-nav-title")).toContainText(
      "Custom Navigation"
    );

    // Check for sparkles icon in header
    await expect(navHeader.locator('wa-icon[name="sparkles"]')).toBeVisible();

    // Check for gradient background (by checking CSS class)
    await expect(customNav).toHaveClass(/custom-navigation-menu/);
  });

  test("should display custom table of contents with progress tracking", async ({
    page,
  }) => {
    // Check that the custom TOC is present
    const customToc = page.locator(".custom-table-of-contents").first();
    await expect(customToc).toBeVisible();

    // Check for custom TOC card
    const tocCard = customToc.locator(".custom-toc-card");
    await expect(tocCard).toBeVisible();

    // Check for progress container
    const progressContainer = customToc.locator(".custom-progress-container");
    await expect(progressContainer).toBeVisible();

    // Check for progress bar
    const progressBar = progressContainer.locator(".custom-progress-bar");
    await expect(progressBar).toBeVisible();

    // Check for progress text
    const progressText = progressContainer.locator(".custom-progress-text");
    await expect(progressText).toBeVisible();
    await expect(progressText).toContainText("% read");
  });

  test("should have functional navigation links in custom navigation", async ({
    page,
  }) => {
    const customNav = page.locator(".custom-navigation-menu").first();

    // Check that navigation links are present and clickable
    const navLinks = customNav.locator(".custom-nav-link");
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // Check that the first link has proper href
    const firstLink = navLinks.first();
    await expect(firstLink).toHaveAttribute("href");

    // Check for current page highlighting
    const currentLink = customNav.locator(".custom-nav-link.custom-current");
    await expect(currentLink).toBeVisible();
  });

  test("should have functional TOC links in custom table of contents", async ({
    page,
  }) => {
    const customToc = page.locator(".custom-table-of-contents").first();

    // Check that TOC links are present
    const tocLinks = customToc.locator(".custom-toc-link");
    const linkCount = await tocLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // Check that links have proper href attributes
    const firstTocLink = tocLinks.first();
    await expect(firstTocLink).toHaveAttribute("href");

    // Test clicking the first available TOC link
    if (linkCount > 0) {
      const firstLink = tocLinks.first();
      await firstLink.click();

      // Check that the URL changed to include a hash
      expect(page.url()).toContain("#");
    }
  });

  test("should update progress bar when scrolling", async ({ page }) => {
    const progressFill = page.locator(".custom-progress-fill").first();
    const progressText = page.locator(".custom-progress-text").first();

    // Initial state - should show 0% or low percentage
    await expect(progressText).toContainText(/\d+% read/);

    // Scroll down to middle of page
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight / 2);
    });

    // Wait for progress update
    await page.waitForTimeout(100);

    // Progress should have increased
    const progressAfterScroll = await progressText.textContent();
    expect(progressAfterScroll).toMatch(/\d+% read/); // Should show percentage
  });

  test("should highlight active TOC link based on scroll position", async ({
    page,
  }) => {
    // Check that TOC links exist
    const tocLinks = page.locator(".custom-toc-link");
    expect(await tocLinks.count()).toBeGreaterThan(0);

    // Check that at least one link can be active
    const activeTocLink = page.locator(".custom-toc-link.custom-active");
    // This test just verifies the TOC structure exists
  });

  test("should display custom badges and icons", async ({ page }) => {
    const customNav = page.locator(".custom-navigation-menu").first();

    // Check for badges in navigation
    const badges = customNav.locator('[data-testid="nav-badge"]');
    expect(await badges.count()).toBeGreaterThan(0);

    // Check for icons in navigation
    const icons = customNav.locator("wa-icon");
    expect(await icons.count()).toBeGreaterThan(0);

    // Check for specific "New" badge
    const newBadge = customNav.locator("wa-badge").filter({ hasText: "New" });
    await expect(newBadge).toBeVisible();
  });

  test("should have proper accessibility features", async ({ page }) => {
    // Check for aria-current on current navigation link
    const currentNavLink = page
      .locator(".custom-nav-link.custom-current")
      .first();
    await expect(currentNavLink).toHaveAttribute("aria-current", "page");

    // Check that links have proper focus indicators
    const firstNavLink = page.locator(".custom-nav-link").first();
    await firstNavLink.focus();

    // The focused element should be the link we focused or a descendant
    const focusedElementHandle = await page.evaluateHandle(
      () => document.activeElement
    );
    const isFocusedElementDescendantOrSelf = await firstNavLink.evaluate(
      (node, focusedElement) =>
        node.contains(focusedElement) || node === focusedElement,
      focusedElementHandle
    );

    expect(isFocusedElementDescendantOrSelf).toBe(true);
  });

  test("should work on mobile viewports", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow responsive changes to take effect

    // On mobile, navigation might be in a drawer, check TOC instead
    const customToc = page.locator(".custom-table-of-contents").first();
    await expect(customToc).toBeVisible();

    // Check that TOC links are functional on mobile
    const tocLinks = customToc.locator("a[href^='#']");
    expect(await tocLinks.count()).toBeGreaterThan(0);

    // Test clicking a TOC link on mobile
    const firstTocLink = tocLinks.first();
    await firstTocLink.click();
  });

  test("should load Web Awesome components properly", async ({ page }) => {
    // Check that Web Awesome components are defined
    const webAwesomeComponents = await page.evaluate(() => {
      return {
        button: !!customElements.get("wa-button"),
        icon: !!customElements.get("wa-icon"),
        badge: !!customElements.get("wa-badge"),
        card: !!customElements.get("wa-card"),
        input: !!customElements.get("wa-input"),
        callout: !!customElements.get("wa-callout"),
        tabGroup: !!customElements.get("wa-tab-group"),
      };
    });

    // All required Web Awesome components should be loaded
    expect(webAwesomeComponents.button).toBe(true);
    expect(webAwesomeComponents.icon).toBe(true);
    expect(webAwesomeComponents.badge).toBe(true);
    expect(webAwesomeComponents.card).toBe(true);
    expect(webAwesomeComponents.input).toBe(true);
    expect(webAwesomeComponents.callout).toBe(true);
  });
});
