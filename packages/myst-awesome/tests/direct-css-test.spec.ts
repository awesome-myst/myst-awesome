import { test, expect } from "@playwright/test";

test.describe("Direct CSS Test", () => {
  test("manually set proper grid and check result", async ({ page }) => {
    await page.goto("http://localhost:4322/blog-example");

    // First, check current state
    const beforeState = await page.evaluate(() => {
      const pageBody = document.querySelector(".page-body");
      const rect = pageBody?.getBoundingClientRect();
      const computed = pageBody ? getComputedStyle(pageBody) : null;
      return {
        width: rect?.width,
        gridTemplateColumns: computed?.gridTemplateColumns,
        classes: pageBody?.className,
      };
    });

    console.log("Before manual CSS:", beforeState);

    // Manually force the correct grid layout
    await page.evaluate(() => {
      const pageBody = document.querySelector(".page-body");
      if (pageBody) {
        // Force the grid layout
        pageBody.style.gridTemplateColumns = "1fr 15rem";
        pageBody.style.gridTemplateAreas = '"main aside"';
      }
    });

    // Wait for layout to update
    await page.waitForTimeout(100);

    // Check state after manual change
    const afterState = await page.evaluate(() => {
      const pageBody = document.querySelector(".page-body");
      const pageMain = document.querySelector(".page-main");
      const pageBodyRect = pageBody?.getBoundingClientRect();
      const pageMainRect = pageMain?.getBoundingClientRect();
      const computed = pageBody ? getComputedStyle(pageBody) : null;

      return {
        pageBodyWidth: pageBodyRect?.width,
        pageMainWidth: pageMainRect?.width,
        gridTemplateColumns: computed?.gridTemplateColumns,
        viewport: window.innerWidth,
      };
    });

    console.log("After manual CSS:", afterState);

    // This should show the layout is working when forced
    expect(afterState.pageBodyWidth).toBeGreaterThan(1000);
    expect(afterState.pageMainWidth).toBeGreaterThan(800);
  });
});
