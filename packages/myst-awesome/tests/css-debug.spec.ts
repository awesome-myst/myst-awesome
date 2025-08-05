import { test, expect } from "@playwright/test";

test.describe("CSS Debug", () => {
  test("check CSS specificity and overrides", async ({ page }) => {
    await page.goto("http://localhost:4321/blog-example");

    // Get all CSS rules that apply to page-layout
    const cssRules = await page.evaluate(() => {
      const pageLayout = document.querySelector(".page-layout");
      if (!pageLayout) return null;

      const computed = getComputedStyle(pageLayout);
      const rules = [];

      // Get all stylesheets and check for rules that affect page-layout
      for (let sheet of document.styleSheets) {
        try {
          for (let rule of sheet.cssRules) {
            if (rule.type === CSSRule.STYLE_RULE) {
              const styleRule = rule;
              if (
                styleRule.selectorText &&
                (styleRule.selectorText.includes("page-layout") ||
                  styleRule.selectorText.includes(".page-layout"))
              ) {
                rules.push({
                  selector: styleRule.selectorText,
                  css: styleRule.cssText,
                  href: sheet.href,
                });
              }
            }
          }
        } catch (e) {
          // Cross-origin or other issues
        }
      }

      return {
        computedDisplay: computed.display,
        computedGridTemplateRows: computed.gridTemplateRows,
        computedGridTemplateAreas: computed.gridTemplateAreas,
        rules: rules,
      };
    });

    console.log("CSS Rules for page-layout:", cssRules);
  });
});
