import { test, expect } from "@playwright/test";

test.describe("Layout Final Verification", () => {
  test("verify layout works on blog example", async ({ page }) => {
    await page.goto("http://localhost:4322/blog-example");

    const measurements = await page.evaluate(() => {
      return {
        viewport: window.innerWidth,
        pageLayout: document
          .querySelector(".page-layout")
          ?.getBoundingClientRect().width,
        pageBody: document.querySelector(".page-body")?.getBoundingClientRect()
          .width,
        pageMain: document.querySelector(".page-main")?.getBoundingClientRect()
          .width,
        pageAside: document
          .querySelector(".page-aside")
          ?.getBoundingClientRect().width,
        mainContent: document
          .querySelector(".main-content")
          ?.getBoundingClientRect().width,
        contentRatio:
          (document.querySelector(".page-main")?.getBoundingClientRect()
            .width || 0) / window.innerWidth,
      };
    });

    console.log("Final Layout Measurements:", measurements);

    // Verify all components are properly sized
    expect(measurements.pageLayout).toBe(measurements.viewport); // Full width
    expect(measurements.pageBody).toBe(measurements.viewport); // Full width
    // With a 3-column grid (menu 240 + main 1fr + aside 240) at 1200px viewport,
    // main will be ~720px => ratio ~0.6. Require a sensible lower bound.
    expect(measurements.contentRatio).toBeGreaterThan(0.55);
    expect(measurements.pageAside).toBe(240); // 15rem = 240px
  });

  test("verify responsive behavior", async ({ page }) => {
    await page.goto("http://localhost:4322/blog-example");

    // Test different viewport sizes
    const sizes = [
      { width: 1280, height: 800, name: "Desktop" },
      { width: 768, height: 600, name: "Tablet" },
      { width: 375, height: 667, name: "Mobile" },
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(300); // Allow layout to settle

      const measurements = await page.evaluate(() => {
        const pageMain = document.querySelector(".page-main");
        const pageAside = document.querySelector(".page-aside");
        return {
          viewport: window.innerWidth,
          mainWidth: pageMain?.getBoundingClientRect().width,
          asideWidth: pageAside?.getBoundingClientRect().width,
          asideVisible: pageAside
            ? getComputedStyle(pageAside).display !== "none"
            : false,
        };
      });

      console.log(`${size.name} (${size.width}px):`, measurements);

      // Verify main content scales appropriately
      expect(measurements.mainWidth).toBeGreaterThan(size.width * 0.2); // At least 20% of viewport
    }
  });
});
