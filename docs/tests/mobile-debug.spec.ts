import { test, expect } from "@playwright/test";

test.describe("Mobile Debug Tests", () => {
  test("debug mobile layout visibility", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/book/typography");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Debug what's visible and hidden
    console.log("=== DEBUGGING MOBILE LAYOUT ===");

    // Check h1 elements
    const h1Elements = await page.locator("h1").all();
    console.log(`Found ${h1Elements.length} h1 elements`);

    for (let i = 0; i < h1Elements.length; i++) {
      const h1 = h1Elements[i];
      const text = await h1.textContent();
      const isVisible = await h1.isVisible();
      const boundingBox = await h1.boundingBox();
      console.log(
        `H1 ${i}: "${text}" - Visible: ${isVisible} - BoundingBox: ${JSON.stringify(
          boundingBox
        )}`
      );
    }

    // Check main content
    const mainElement = page.locator("main");
    const mainVisible = await mainElement.isVisible();
    const mainBox = await mainElement.boundingBox();
    console.log(
      `Main element - Visible: ${mainVisible} - BoundingBox: ${JSON.stringify(
        mainBox
      )}`
    );

    // Check article content
    const articleElements = await page
      .locator("article, .content, .myst-content")
      .all();
    console.log(`Found ${articleElements.length} article elements`);

    for (let i = 0; i < articleElements.length; i++) {
      const article = articleElements[i];
      const isVisible = await article.isVisible();
      const boundingBox = await article.boundingBox();
      const classes = await article.getAttribute("class");
      console.log(
        `Article ${i}: Classes: "${classes}" - Visible: ${isVisible} - BoundingBox: ${JSON.stringify(
          boundingBox
        )}`
      );
    }

    // Check navigation elements
    const navLinks = await page
      .locator("a")
      .filter({ hasText: /Home|Typography|Page/ })
      .all();
    console.log(`Found ${navLinks.length} navigation links`);

    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      const text = await link.textContent();
      const isVisible = await link.isVisible();
      const boundingBox = await link.boundingBox();
      console.log(
        `Nav Link ${i}: "${text}" - Visible: ${isVisible} - BoundingBox: ${JSON.stringify(
          boundingBox
        )}`
      );
    }

    // Check for mobile drawer
    const drawerElement = page.locator(".mobile-nav-drawer");
    const drawerVisible = await drawerElement.isVisible();
    const drawerBox = await drawerElement.boundingBox();
    console.log(
      `Mobile drawer - Visible: ${drawerVisible} - BoundingBox: ${JSON.stringify(
        drawerBox
      )}`
    );

    // Check toggle button
    const toggleButton = page.locator(".mobile-nav-toggle");
    const toggleVisible = await toggleButton.isVisible();
    const toggleBox = await toggleButton.boundingBox();
    console.log(
      `Mobile toggle - Visible: ${toggleVisible} - BoundingBox: ${JSON.stringify(
        toggleBox
      )}`
    );

    // Let's make basic assertions that should work
    await expect(page.locator("main")).toBeVisible();
  });
});
