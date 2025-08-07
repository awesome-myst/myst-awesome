import { test, expect } from "@playwright/test";

test.describe("Navigation Responsive Fix", () => {
  test("navigation should reappear when transitioning back from mobile to desktop", async ({
    page,
  }) => {
    await page.goto("http://localhost:4322/docs-example");

    // Start in desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const desktopNav = page.locator('.page-menu[data-view="desktop"]');
    const hamburger = page.locator(".mobile-nav-toggle");

    // Desktop: navigation should be visible, hamburger hidden
    if ((await desktopNav.count()) > 0) {
      const navDisplay = await desktopNav.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Desktop nav display (initial desktop):", navDisplay);
      expect(navDisplay).toBe("flex");
    }

    const hamburgerDisplay = await hamburger.evaluate(
      (el) => window.getComputedStyle(el).display
    );
    console.log("Hamburger display (initial desktop):", hamburgerDisplay);
    expect(hamburgerDisplay).toBe("none");

    // Switch to mobile view
    await page.setViewportSize({ width: 600, height: 800 });
    await page.waitForTimeout(500); // Allow time for JavaScript responsive handler

    // Mobile: navigation should be hidden, hamburger visible
    if ((await desktopNav.count()) > 0) {
      const navDisplayMobile = await desktopNav.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Desktop nav display (mobile):", navDisplayMobile);
      expect(navDisplayMobile).toBe("none");
    }

    const hamburgerDisplayMobile = await hamburger.evaluate(
      (el) => window.getComputedStyle(el).display
    );
    console.log("Hamburger display (mobile):", hamburgerDisplayMobile);
    expect(hamburgerDisplayMobile).toBe("block");

    // Switch back to desktop view - THIS IS THE CRITICAL TEST
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500); // Allow time for JavaScript responsive handler

    // Desktop (second time): navigation should be visible again, hamburger hidden
    if ((await desktopNav.count()) > 0) {
      const navDisplayBack = await desktopNav.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Desktop nav display (back to desktop):", navDisplayBack);
      // This is what was failing before the fix - navigation didn't reappear
      expect(navDisplayBack).toBe("flex");
    }

    const hamburgerDisplayBack = await hamburger.evaluate(
      (el) => window.getComputedStyle(el).display
    );
    console.log("Hamburger display (back to desktop):", hamburgerDisplayBack);
    expect(hamburgerDisplayBack).toBe("none");
  });

  test("aside should also reappear when transitioning back from mobile to desktop", async ({
    page,
  }) => {
    await page.goto("http://localhost:4322/docs-example");

    // Start in desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const aside = page.locator(".page-aside");

    // Desktop: aside should be visible
    if ((await aside.count()) > 0) {
      const asideDisplay = await aside.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Aside display (initial desktop):", asideDisplay);
      expect(asideDisplay).toBe("flex");

      // Switch to mobile view
      await page.setViewportSize({ width: 600, height: 800 });
      await page.waitForTimeout(500);

      // Mobile: aside should be hidden
      const asideDisplayMobile = await aside.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Aside display (mobile):", asideDisplayMobile);
      expect(asideDisplayMobile).toBe("none");

      // Switch back to desktop view
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);

      // Desktop (second time): aside should be visible again
      const asideDisplayBack = await aside.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Aside display (back to desktop):", asideDisplayBack);
      expect(asideDisplayBack).toBe("flex");
    }
  });

  test("custom navigation should always be visible regardless of viewport", async ({
    page,
  }) => {
    await page.goto("http://localhost:4322/docs-example");

    // Inject custom navigation to test the custom navigation behavior
    await page.addStyleTag({
      content: `
        .custom-navigation-menu {
          background: red;
          padding: 10px;
          color: white;
        }
      `,
    });

    await page.evaluate(() => {
      const nav = document.querySelector('.page-menu[data-view="desktop"]');
      if (nav) {
        const customNav = document.createElement("div");
        customNav.className = "custom-navigation-menu";
        customNav.textContent = "Custom Navigation";
        nav.appendChild(customNav);
      }
    });

    const desktopNav = page.locator('.page-menu[data-view="desktop"]');

    if ((await desktopNav.count()) > 0) {
      // Desktop view
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);

      let navDisplay = await desktopNav.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Custom nav display (desktop):", navDisplay);
      expect(navDisplay).toBe("flex");

      // Mobile view - should still be visible because of custom navigation
      await page.setViewportSize({ width: 600, height: 800 });
      await page.waitForTimeout(500);

      navDisplay = await desktopNav.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Custom nav display (mobile):", navDisplay);
      expect(navDisplay).toBe("flex");

      // Back to desktop - should still be visible
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);

      navDisplay = await desktopNav.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      console.log("Custom nav display (back to desktop):", navDisplay);
      expect(navDisplay).toBe("flex");
    }
  });
});
