import { test, expect } from "@playwright/test";

test.describe("Layout Debugging", () => {
  test("debug layout structure", async ({ page }) => {
    await page.goto("http://localhost:4321/blog-example");

    // Log the actual HTML structure
    const pageBodyHTML = await page.locator(".page-body").innerHTML();
    console.log("Page body HTML structure:");
    console.log(pageBodyHTML);

    // Check if navigation and aside elements exist
    const hasNavigation = await page.locator(".page-menu").count();
    const hasAside = await page.locator(".page-aside").count();

    console.log("Has navigation:", hasNavigation);
    console.log("Has aside:", hasAside);

    // Check CSS classes on page-body
    const pageBodyClasses = await page
      .locator(".page-body")
      .getAttribute("class");
    console.log("Page body classes:", pageBodyClasses);

    // Check computed styles
    const computedStyles = await page.locator(".page-body").evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        display: computed.display,
        gridTemplateColumns: computed.gridTemplateColumns,
        gridTemplateAreas: computed.gridTemplateAreas,
        width: computed.width,
        gap: computed.gap,
      };
    });

    console.log("Computed styles:", computedStyles);

    // Check support for :has() selector
    const hasSupport = await page.evaluate(() => {
      try {
        document.querySelector(":has(*)");
        return true;
      } catch (e) {
        return false;
      }
    });

    console.log("Browser supports :has():", hasSupport);
  });
});
