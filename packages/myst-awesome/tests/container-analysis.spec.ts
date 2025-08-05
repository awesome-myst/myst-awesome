import { test, expect } from "@playwright/test";

test.describe("DOM Hierarchy Analysis", () => {
  test("analyze parent containers", async ({ page }) => {
    await page.goto("http://localhost:4321/blog-example");

    // Get width of all parent containers
    const containerWidths = await page.evaluate(() => {
      const pageLayout = document.querySelector(".page-layout");
      const pageBody = document.querySelector(".page-body");
      const pageMain = document.querySelector(".page-main");
      const contentArticle = document.querySelector(".content-article");
      const html = document.documentElement;
      const body = document.body;

      const getElementInfo = (el, name) => {
        if (!el) return { name, missing: true };
        const rect = el.getBoundingClientRect();
        const computed = getComputedStyle(el);
        return {
          name,
          width: rect.width,
          computedWidth: computed.width,
          maxWidth: computed.maxWidth,
          minWidth: computed.minWidth,
          margin: computed.margin,
          padding: computed.padding,
          boxSizing: computed.boxSizing,
          display: computed.display,
        };
      };

      return {
        viewport: window.innerWidth,
        html: getElementInfo(html, "html"),
        body: getElementInfo(body, "body"),
        pageLayout: getElementInfo(pageLayout, "page-layout"),
        pageBody: getElementInfo(pageBody, "page-body"),
        pageMain: getElementInfo(pageMain, "page-main"),
        contentArticle: getElementInfo(contentArticle, "content-article"),
      };
    });

    console.log("Container Width Analysis:");
    Object.entries(containerWidths).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
  });
});
