import { test, expect } from "@playwright/test";

test.describe("Hamburger Menu Top-Left Positioning", () => {
  test("hamburger should be positioned at top-left of page on mobile", async ({
    page,
  }) => {
    await page.goto("http://localhost:4321/docs-example");

    // Test desktop view first (wide screen)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState("networkidle");

    const hamburger = page.locator(".mobile-nav-toggle");

    // On desktop, hamburger should be hidden
    await expect(hamburger).toBeHidden();

    // Test mobile view
    await page.setViewportSize({ width: 600, height: 800 });
    await page.waitForTimeout(500); // Allow time for responsive changes

    // On mobile, hamburger should be visible
    await expect(hamburger).toBeVisible();

    // Check that hamburger is positioned at top-left of the page
    const hamburgerBox = await hamburger.boundingBox();
    const pageBox = await page.locator("body").boundingBox();

    if (hamburgerBox && pageBox) {
      // Hamburger should be very close to top-left corner of the page
      expect(hamburgerBox.x).toBeLessThan(50); // Relaxed margin from left edge
      expect(hamburgerBox.y).toBeLessThan(50); // Relaxed margin from top edge

      // Hamburger should not be inside page-body anymore
      const pageBody = page.locator(".page-body");
      const pageBodyBox = await pageBody.boundingBox();

      if (pageBodyBox) {
        // Hamburger should be positioned above or overlapping page-body, not contained within it
        expect(hamburgerBox.y).toBeLessThan(pageBodyBox.y + 10);
      }

      console.log("Hamburger position:", hamburgerBox);
      console.log("Page body position:", pageBodyBox);
    }
  });

  test("page layout should maintain collapsed horizontal space", async ({
    page,
  }) => {
    await page.goto("http://localhost:4321/docs-example");
    await page.setViewportSize({ width: 600, height: 800 });
    await page.waitForLoadState("networkidle");

    // Wait a bit more for JavaScript to run
    await page.waitForTimeout(1000);

    // Check if desktop navigation exists and should be hidden
    const desktopNav = page.locator('.page-menu[data-view="desktop"]');
    const desktopNavExists = await desktopNav.count();
    console.log("Desktop nav count:", desktopNavExists);

    if (desktopNavExists > 0) {
      const navDisplay = await desktopNav.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Desktop nav display:", navDisplay);
      // Desktop nav should be hidden on mobile
      expect(navDisplay).toBe("none");
    }

    // Check page-body grid layout and classes
    const pageBody = page.locator(".page-body");
    const pageBodyClasses = await pageBody.evaluate((el) =>
      Array.from(el.classList)
    );
    console.log("Page body classes:", pageBodyClasses);

    const computedStyle = await pageBody.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        gridTemplateAreas: style.gridTemplateAreas,
        gridTemplateColumns: style.gridTemplateColumns,
      };
    });

    console.log("Page body grid style:", computedStyle);

    // At 600px width, should be single column layout if no visible menu
    if (
      desktopNavExists === 0 ||
      (await desktopNav.evaluate(
        (el) => window.getComputedStyle(el).display === "none"
      ))
    ) {
      expect(computedStyle.gridTemplateAreas).toBe('"main"');
    }
  });
});
