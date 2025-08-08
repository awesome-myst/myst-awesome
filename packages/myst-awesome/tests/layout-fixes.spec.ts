import { test, expect } from "@playwright/test";

test.describe("Layout Rendering Issues", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4322/blog-example");
  });

  test("should not have horizontally squished content", async ({ page }) => {
    // Check main content area width
    const mainContent = page.locator(".page-main");
    await expect(mainContent).toBeVisible();

    // Get viewport and content widths
    const viewportSize = page.viewportSize();
    const mainContentBox = await mainContent.boundingBox();

    console.log("Viewport width:", viewportSize?.width);
    console.log("Main content width:", mainContentBox?.width);

    // Content should not be unreasonably narrow
    if (viewportSize && mainContentBox) {
      const contentRatio = mainContentBox.width / viewportSize.width;
      console.log("Content to viewport ratio:", contentRatio);

      // Content should take up reasonable portion of viewport (at least 30%)
      expect(contentRatio).toBeGreaterThan(0.3);
    }
  });

  test("should handle window resize properly", async ({ page }) => {
    // Test desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    const desktopMainBox = await page.locator(".page-main").boundingBox();
    console.log("Desktop main content width:", desktopMainBox?.width);

    // Test tablet size
    await page.setViewportSize({ width: 768, height: 600 });
    await page.waitForTimeout(500);

    const tabletMainBox = await page.locator(".page-main").boundingBox();
    console.log("Tablet main content width:", tabletMainBox?.width);

    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileMainBox = await page.locator(".page-main").boundingBox();
    console.log("Mobile main content width:", mobileMainBox?.width);

    // Check that content adapts to different sizes
    expect(mobileMainBox?.width).toBeLessThan(tabletMainBox?.width || 0);
    expect(tabletMainBox?.width).toBeLessThan(desktopMainBox?.width || 0);
  });

  test("should have proper grid layout", async ({ page }) => {
    const pageBody = page.locator(".page-body");

    // Check grid template areas
    const gridTemplateAreas = await pageBody.evaluate(
      (el) => getComputedStyle(el).gridTemplateAreas
    );

    console.log("Grid template areas:", gridTemplateAreas);

    // Check grid template columns
    const gridTemplateColumns = await pageBody.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns
    );

    console.log("Grid template columns:", gridTemplateColumns);

    // Verify grid is properly set up
    expect(gridTemplateAreas).toContain("main");
  });

  test("should have proper spacing and margins", async ({ page }) => {
    const mainContent = page.locator(".main-content");

    // Check padding and margins
    const styles = await mainContent.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        padding: computed.padding,
        margin: computed.margin,
        maxWidth: computed.maxWidth,
        width: computed.width,
        overflow: computed.overflow,
      };
    });

    console.log("Main content styles:", styles);

    // Check if content has proper max-width constraints
    expect(styles.maxWidth).not.toBe("none");
  });
});
