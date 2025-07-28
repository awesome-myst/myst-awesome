import { test, expect } from "@playwright/test";

test.describe("Layout Width Analysis", () => {
  test("analyze width distribution", async ({ page }) => {
    await page.goto("http://localhost:4321/blog-example.html");

    // Get all width measurements
    const widths = await page.evaluate(() => {
      const pageBody = document.querySelector(".page-body");
      const pageMain = document.querySelector(".page-main");
      const pageAside = document.querySelector(".page-aside");
      const mainContent = document.querySelector(".main-content");

      return {
        viewport: window.innerWidth,
        pageBody: pageBody?.getBoundingClientRect().width,
        pageMain: pageMain?.getBoundingClientRect().width,
        pageAside: pageAside?.getBoundingClientRect().width,
        mainContent: mainContent?.getBoundingClientRect().width,
        pageBodyComputedWidth: pageBody
          ? getComputedStyle(pageBody).width
          : null,
        pageMainComputedWidth: pageMain
          ? getComputedStyle(pageMain).width
          : null,
        pageAsideComputedWidth: pageAside
          ? getComputedStyle(pageAside).width
          : null,
        gridTemplateColumns: pageBody
          ? getComputedStyle(pageBody).gridTemplateColumns
          : null,
      };
    });

    console.log("Width Analysis:", widths);

    // Check the grid layout calculations
    const gridInfo = await page.evaluate(() => {
      const pageBody = document.querySelector(".page-body");
      if (!pageBody) return null;

      const computed = getComputedStyle(pageBody);
      return {
        display: computed.display,
        gridTemplateColumns: computed.gridTemplateColumns,
        gridTemplateAreas: computed.gridTemplateAreas,
        width: computed.width,
        maxWidth: computed.maxWidth,
        minWidth: computed.minWidth,
      };
    });

    console.log("Grid Layout Info:", gridInfo);

    // Check CSS custom properties
    const cssProps = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);
      return {
        menuWidth: computed.getPropertyValue("--menu-width"),
        mainWidth: computed.getPropertyValue("--main-width"),
        asideWidth: computed.getPropertyValue("--aside-width"),
      };
    });

    console.log("CSS Custom Properties:", cssProps);
  });
});
