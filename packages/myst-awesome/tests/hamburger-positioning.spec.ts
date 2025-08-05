import { test, expect } from "@playwright/test";

test.describe("Hamburger Menu Positioning", () => {
  test("hamburger should be positioned in page-body on mobile", async ({
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

    // Check that hamburger is within page-body
    const pageBody = page.locator(".page-body");
    await expect(pageBody).toContainText(""); // Ensure page-body exists

    // Check that hamburger is positioned correctly within page-body
    const hamburgerBox = await hamburger.boundingBox();
    const pageBodyBox = await pageBody.boundingBox();

    if (hamburgerBox && pageBodyBox) {
      // Hamburger should be inside page-body
      expect(hamburgerBox.x).toBeGreaterThanOrEqual(pageBodyBox.x);
      expect(hamburgerBox.y).toBeGreaterThanOrEqual(pageBodyBox.y);

      // Hamburger should be near the top of page-body
      expect(hamburgerBox.y - pageBodyBox.y).toBeLessThan(50);

      console.log("Hamburger position:", hamburgerBox);
      console.log("Page body position:", pageBodyBox);
    }
  });

  test("hamburger functionality should work", async ({ page }) => {
    await page.goto("http://localhost:4321/docs-example");
    await page.setViewportSize({ width: 600, height: 800 });
    await page.waitForLoadState("networkidle");

    const hamburger = page.locator(".mobile-nav-toggle");
    const drawer = page.locator(".mobile-nav-drawer");

    await expect(hamburger).toBeVisible();

    // Click hamburger to open drawer
    await hamburger.click();

    // Wait a moment for animation
    await page.waitForTimeout(300);

    // Drawer should be opened (check for open attribute or visible state)
    const drawerOpen = await drawer.evaluate((el) => {
      const htmlEl = el as HTMLElement;
      return el.hasAttribute("open") || htmlEl.offsetWidth > 0;
    });
    expect(drawerOpen).toBe(true);
  });
});
