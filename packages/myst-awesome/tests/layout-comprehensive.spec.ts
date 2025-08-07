import { test, expect } from "@playwright/test";

/**
 * Layout Tests - Comprehensive layout verification
 */

test.describe("Layout System", () => {
  test.beforeEach(async ({ page }) => {
    // Start with the blog example page
    await page.goto("http://localhost:4322/blog-example");
    await page.waitForLoadState("networkidle");
  });

  test("should load page with correct layout structure", async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Building Modern Documentation/);

    // Verify key layout elements exist
    await expect(page.locator(".page-layout")).toBeVisible();
    await expect(page.locator(".page-body")).toBeVisible();
    await expect(page.locator(".page-main")).toBeVisible();
    await expect(page.locator(".main-content")).toBeVisible();
  });

  test("should have proper responsive layout at different sizes", async ({ page }) => {
    const sizes = [
      { width: 1280, height: 800, name: "Desktop" },
      { width: 768, height: 600, name: "Tablet" },
      { width: 375, height: 667, name: "Mobile" },
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(300); // Allow layout to settle

      const pageMain = page.locator(".page-main");
      await expect(pageMain).toBeVisible();

      const mainBox = await pageMain.boundingBox();
      expect(mainBox).toBeTruthy();
      
      if (mainBox) {
        // Content should be at least 30% of viewport width
        const ratio = mainBox.width / size.width;
        expect(ratio).toBeGreaterThan(0.3);
        console.log(`${size.name} (${size.width}px): Main content ${mainBox.width}px, ratio: ${ratio.toFixed(2)}`);
      }
    }
  });

  test("should have proper CSS grid layout", async ({ page }) => {
    const pageBody = page.locator(".page-body");
    
    // Check that grid properties are set
    const gridTemplateAreas = await pageBody.evaluate(
      (el) => getComputedStyle(el).gridTemplateAreas
    );
    
    const gridTemplateColumns = await pageBody.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns
    );

    console.log("Grid template areas:", gridTemplateAreas);
    console.log("Grid template columns:", gridTemplateColumns);

    // Should have grid areas defined
    expect(gridTemplateAreas).not.toBe("none");
  });

  test("should handle aside (sidebar) properly", async ({ page }) => {
    const pageAside = page.locator(".page-aside");
    
    // Desktop: aside should be visible
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    
    const asideBox = await pageAside.boundingBox();
    if (asideBox) {
      expect(asideBox.width).toBeGreaterThan(0);
      console.log("Desktop aside width:", asideBox.width);
    }

    // Mobile: aside behavior may vary but element should still exist
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    const mobileAsideBox = await pageAside.boundingBox();
    console.log("Mobile aside visible:", !!mobileAsideBox);
  });
});

test.describe("Component Override System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4322/working-demo");
    await page.waitForLoadState("networkidle");
  });

  test("should load working demo page", async ({ page }) => {
    await expect(page).toHaveTitle(/Working Demo/);
    await expect(page.locator("h1")).toContainText("Working Demo");
  });

  test("should display custom navigation", async ({ page }) => {
    const customNav = page.locator(".custom-navigation-menu").first();
    await expect(customNav).toBeVisible();

    const navTitle = page.locator(".custom-nav-title").first();
    await expect(navTitle).toBeVisible();
    await expect(navTitle).toContainText("Custom Navigation");
  });

  test("should display custom table of contents", async ({ page }) => {
    const customToc = page.locator(".custom-table-of-contents").first();
    await expect(customToc).toBeVisible();

    const tocTitle = page.locator(".custom-toc-title").first();
    await expect(tocTitle).toBeVisible();
    await expect(tocTitle).toContainText("Demo TOC");
  });

  test("should have functional navigation links", async ({ page }) => {
    const navLinks = page.locator(".custom-nav-link");
    const firstLink = navLinks.first();

    await expect(firstLink).toBeVisible();
    await expect(firstLink).toHaveAttribute("href");
  });

  test("should have functional TOC links", async ({ page }) => {
    const tocLinks = page.locator(".custom-toc-link");
    const firstTocLink = tocLinks.first();

    await expect(firstTocLink).toBeVisible();
    await expect(firstTocLink).toHaveAttribute("href");
  });
});

test.describe("Basic Functionality", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("http://localhost:4322/");
    await expect(page).toHaveTitle(/MyST Awesome Theme Demo/);
    await expect(page.locator("h1")).toContainText("MyST Awesome Theme");
  });

  test("should navigate between pages", async ({ page }) => {
    await page.goto("http://localhost:4322/");
    
    // Click on working demo link
    await page.click('a[href="/working-demo"]');
    await page.waitForLoadState("networkidle");
    
    await expect(page).toHaveTitle(/Working Demo/);
    await expect(page.locator("h1")).toContainText("Working Demo");
  });
});
