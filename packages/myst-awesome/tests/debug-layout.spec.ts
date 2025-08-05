import { test, expect } from "@playwright/test";

test.describe("Debug CSS and Layout", () => {
  test("check if collapse-aside-920 class is applied", async ({ page }) => {
    await page.goto("http://localhost:4321/docs-example");
    await page.waitForLoadState("networkidle");

    // Check if the page body has our class
    const pageBody = page.locator(".page-body");
    await expect(pageBody).toBeVisible();

    const hasClass = await pageBody.evaluate((el) =>
      el.classList.contains("collapse-aside-920")
    );
    console.log("Page body has collapse-aside-920 class:", hasClass);

    // Check the actual grid template areas at different widths
    await page.setViewportSize({ width: 850, height: 800 });

    const gridAreas850 = await pageBody.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateAreas;
    });
    console.log("Grid areas at 850px:", gridAreas850);

    await page.setViewportSize({ width: 1200, height: 800 });

    const gridAreas1200 = await pageBody.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateAreas;
    });
    console.log("Grid areas at 1200px:", gridAreas1200);

    // Check all classes on page body
    const allClasses = await pageBody.evaluate((el) =>
      Array.from(el.classList)
    );
    console.log("All page body classes:", allClasses);

    expect(hasClass).toBe(true);
  });
});
