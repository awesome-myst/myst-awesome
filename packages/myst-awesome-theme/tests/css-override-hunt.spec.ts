import { test, expect } from "@playwright/test";

test.describe("CSS Override Hunt", () => {
  test("find what is setting display flex", async ({ page }) => {
    await page.goto("http://localhost:4321/blog-example.html");

    // Search for any CSS that might be setting display: flex on page-layout
    const allFlexRules = await page.evaluate(() => {
      const flexRules = [];

      // Get all stylesheets and check for any rules that set display: flex
      for (let sheet of document.styleSheets) {
        try {
          for (let rule of sheet.cssRules) {
            if (rule.type === CSSRule.STYLE_RULE) {
              const styleRule = rule;
              const cssText = styleRule.cssText;
              if (
                cssText.includes("display") &&
                (cssText.includes("flex") || cssText.includes("grid"))
              ) {
                flexRules.push({
                  selector: styleRule.selectorText,
                  css: cssText,
                  href: sheet.href,
                });
              }
            }
          }
        } catch (e) {
          // Cross-origin issues
        }
      }

      return flexRules;
    });

    console.log("All display rules that mention flex or grid:");
    allFlexRules.forEach((rule, i) => {
      console.log(`${i + 1}. ${rule.selector}:`);
      console.log(`   ${rule.css}`);
      console.log("");
    });
  });
});
