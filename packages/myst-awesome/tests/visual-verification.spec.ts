import { test, expect } from "@playwright/test";

test.describe("Responsive Layout CSS Fix Verification", () => {
  test("should have responsive CSS rules in the DocsLayout", async ({
    page,
  }) => {
    // Navigate to the docs-example page (which uses DocsLayout)
    await page.goto("http://localhost:4322/docs-example", {
      waitUntil: "domcontentloaded",
    });

    // Wait for content to load
    await page.waitForSelector("body", { timeout: 15000 });

    // Check that the page loads successfully
    await expect(page.locator("body")).toBeVisible();

    // Get all the CSS rules from stylesheets
    const cssRules = await page.evaluate(() => {
      const rules = [];
      for (let styleSheet of document.styleSheets) {
        try {
          for (let rule of styleSheet.cssRules || []) {
            if (rule.type === CSSRule.MEDIA_RULE) {
              const mediaRule = rule as CSSMediaRule;
              if (mediaRule.conditionText.includes("920px")) {
                for (let innerRule of mediaRule.cssRules) {
                  const styleRule = innerRule as CSSStyleRule;
                  if (
                    styleRule.selectorText &&
                    styleRule.selectorText.includes("collapse-aside-920")
                  ) {
                    rules.push({
                      selector: styleRule.selectorText,
                      cssText: styleRule.cssText,
                      mediaQuery: mediaRule.conditionText,
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      }
      return rules;
    });

    console.log("Found responsive CSS rules:", cssRules);

    // Should have at least one rule targeting .page-body at 920px breakpoint
    expect(cssRules.length).toBeGreaterThan(0);

    // Check if any rule contains our expected CSS
    const hasGridTemplateRule = cssRules.some(
      (rule) =>
        rule.cssText.includes("grid-template-columns") ||
        rule.cssText.includes("grid-template-areas")
    );

    expect(hasGridTemplateRule).toBe(true);
  });

  test("visual verification - narrow width layout", async ({ page }) => {
    await page.goto("http://localhost:4322/docs-example", {
      waitUntil: "domcontentloaded",
    });

    // Set narrow viewport
    await page.setViewportSize({ width: 850, height: 800 });
    await page.waitForSelector("body", { timeout: 15000 });
    await page.waitForTimeout(1000); // Allow time for responsive changes

    // Take a screenshot for manual verification
    await page.screenshot({ path: "test-results/narrow-width-850px.png" });

    // Just verify the page loads
    await expect(page.locator("body")).toBeVisible();
  });

  test("visual verification - wide width layout", async ({ page }) => {
    await page.goto("http://localhost:4322/docs-example", {
      waitUntil: "domcontentloaded",
    });

    // Set wide viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForSelector("body", { timeout: 15000 });
    await page.waitForTimeout(1000); // Allow time for responsive changes

    // Take a screenshot for manual verification
    await page.screenshot({ path: "test-results/wide-width-1200px.png" });

    // Just verify the page loads
    await expect(page.locator("body")).toBeVisible();
  });
});
