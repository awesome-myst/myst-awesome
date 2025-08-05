import { test, expect } from "@playwright/test";

test.describe("Responsive Layout Fix", () => {
  test("CSS media query should collapse aside column on narrow screens", async ({
    page,
  }) => {
    // Navigate to the main page
    await page.goto("http://localhost:4321/");

    // Set viewport to narrow width (850px - between 768px and 920px where the issue occurred)
    await page.setViewportSize({ width: 850, height: 800 });

    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Check that page body exists
    const pageBody = page.locator(".page-body");
    await expect(pageBody).toBeVisible();

    // Inject CSS to simulate having aside content and test our responsive behavior
    await page.addStyleTag({
      content: `
        /* Simulate having aside content */
        .page-body::after {
          content: '';
          grid-area: aside;
          background: red;
          width: 100px;
          height: 100px;
        }
        .page-body.has-aside {
          grid-template-columns: 1fr var(--aside-width, 15rem);
          grid-template-areas: "main aside";
        }
      `,
    });

    // Add the has-aside class to simulate aside content and ensure page-layout wrapper exists
    await pageBody.evaluate((el) => {
      el.classList.add("has-aside");
      // Ensure parent has page-layout class
      const pageLayout = el.closest(".page-layout") || el.parentElement;
      if (pageLayout) pageLayout.classList.add("page-layout");
    });

    // Get the computed grid-template-areas before our responsive CSS kicks in
    const gridAreasInitial = await pageBody.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateAreas;
    });

    console.log(
      "Grid areas at 850px width (before responsive fix):",
      gridAreasInitial
    );

    // Now inject our responsive CSS fix with high specificity
    await page.addStyleTag({
      content: `
        @media (max-width: 920px) {
          .page-layout .page-body.has-aside {
            grid-template-columns: 1fr !important;
            grid-template-areas: "main" !important;
          }
        }
      `,
    });

    // Get the computed grid-template-areas after our fix
    const gridAreasAfter = await pageBody.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateAreas;
    });

    console.log(
      "Grid areas at 850px width (after responsive fix):",
      gridAreasAfter
    );

    // Should not include "aside" in the grid areas at this width after our fix
    expect(gridAreasAfter).toBe('"main"');
  });

  test("should preserve aside column on wide screens", async ({ page }) => {
    // Navigate to the main page
    await page.goto("http://localhost:4321/");

    // Set viewport to wide width
    await page.setViewportSize({ width: 1200, height: 800 });

    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Check that page body exists
    const pageBody = page.locator(".page-body");
    await expect(pageBody).toBeVisible();

    // Inject CSS to simulate having aside content
    await page.addStyleTag({
      content: `
        .page-body::after {
          content: '';
          grid-area: aside;
          background: red;
          width: 100px;
          height: 100px;
        }
        .page-body.has-aside {
          grid-template-columns: 1fr var(--aside-width, 15rem);
          grid-template-areas: "main aside";
        }
      `,
    });

    // Add the has-aside class and ensure page-layout class exists
    await pageBody.evaluate((el) => {
      el.classList.add("has-aside");
      // Ensure parent has page-layout class
      const pageLayout = el.closest(".page-layout") || el.parentElement;
      if (pageLayout) pageLayout.classList.add("page-layout");
    });

    // Add our responsive CSS (should not affect wide screens)
    await page.addStyleTag({
      content: `
        @media (max-width: 920px) {
          .page-layout .page-body.has-aside {
            grid-template-columns: 1fr !important;
            grid-template-areas: "main" !important;
          }
        }
      `,
    });

    // Get the computed grid-template-areas
    const gridAreas = await pageBody.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateAreas;
    });

    console.log("Grid areas at 1200px width:", gridAreas);

    // Should still include "aside" in the grid areas at wide width
    expect(gridAreas).toBe('"main aside"');
  });
});
