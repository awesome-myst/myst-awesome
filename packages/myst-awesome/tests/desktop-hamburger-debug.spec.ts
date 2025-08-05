import { test, expect } from "@playwright/test";

test.describe("Desktop Hamburger Debug", () => {
  test("check desktop hamburger behavior and layout", async ({ page }) => {
    await page.goto("http://localhost:4321/");

    // Desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const hamburger = page.locator(".mobile-nav-toggle");
    const hamburgerExists = await hamburger.count();
    console.log("Hamburger exists:", hamburgerExists);

    if (hamburgerExists > 0) {
      const hamburgerVisible = await hamburger.isVisible();
      console.log("Hamburger visible on desktop:", hamburgerVisible);

      if (hamburgerVisible) {
        const hamburgerBox = await hamburger.boundingBox();
        console.log("Hamburger position on desktop:", hamburgerBox);

        // Check if it's overlapping with header content
        const header = page.locator(".page-header");
        const headerBox = await header.boundingBox();
        console.log("Header position:", headerBox);

        // Check project title position
        const brandLink = page.locator(".brand-link");
        const brandExists = await brandLink.count();
        if (brandExists > 0) {
          const brandBox = await brandLink.boundingBox();
          console.log("Brand link position:", brandBox);
        }
      }
    }

    // Check page body grid layout on desktop
    const pageBody = page.locator(".page-body");
    const pageBodyClasses = await pageBody.evaluate((el) =>
      Array.from(el.classList)
    );
    console.log("Desktop page body classes:", pageBodyClasses);

    const computedStyle = await pageBody.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        gridTemplateAreas: style.gridTemplateAreas,
        gridTemplateColumns: style.gridTemplateColumns,
      };
    });

    console.log("Desktop page body grid style:", computedStyle);

    // Check if there's blank space on left when menu collapsed
    const desktopNav = page.locator('.page-menu[data-view="desktop"]');
    const navDisplay = await desktopNav.evaluate(
      (el) => window.getComputedStyle(el).display
    );
    console.log("Desktop nav display:", navDisplay);
  });
});
