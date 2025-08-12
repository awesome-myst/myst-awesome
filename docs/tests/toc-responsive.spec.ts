import { test, expect } from "@playwright/test";

test.describe("TOC Responsive Behavior", () => {
  test("TOC should be hidden on mobile to prevent empty space", async ({
    page,
  }) => {
    // Navigate to a page with TOC content
    await page.goto("/book/typography");

    // Verify page loads (use first to avoid multiple h1 elements)
    await expect(page.locator("h1").first()).toContainText("Typography");

    // Set mobile viewport (narrower than 920px breakpoint)
    await page.setViewportSize({ width: 600, height: 800 });

    // Wait for responsive CSS to take effect
    await page.waitForTimeout(500);

    // Check if TOC wrapper is hidden on mobile
    const tocWrapper = page.locator(".responsive-toc-wrapper");
    if ((await tocWrapper.count()) > 0) {
      // TOC exists, verify it's hidden on mobile
      await expect(tocWrapper).toBeHidden();
    }

    // Verify main content is still visible and taking full width
    const mainContent = page.locator(".page-main");
    await expect(mainContent).toBeVisible();

    // Set desktop viewport (wider than 920px breakpoint)
    await page.setViewportSize({ width: 1200, height: 800 });

    // Wait for responsive CSS to take effect
    await page.waitForTimeout(500);

    // Check if TOC wrapper is visible on desktop
    if ((await tocWrapper.count()) > 0) {
      // TOC exists, verify it's visible on desktop
      await expect(tocWrapper).toBeVisible();
    }
  });

  test("TOC content prevents empty space on mobile", async ({ page }) => {
    // Navigate to a page with TOC content
    await page.goto("/book/typography");

    // Set mobile viewport
    await page.setViewportSize({ width: 600, height: 800 });
    await page.waitForTimeout(500);

    // Verify the aside area doesn't show empty space on mobile
    const tocWrapper = page.locator(".responsive-toc-wrapper");

    if ((await tocWrapper.count()) > 0) {
      // TOC wrapper should be completely hidden, not just have empty content
      await expect(tocWrapper).toBeHidden();

      // Verify main content takes up appropriate space
      const mainContent = page.locator(".page-main");
      await expect(mainContent).toBeVisible();

      // Check that we don't have visible empty aside space
      const pageAside = page.locator(".page-aside");

      // On mobile (≤920px), the aside should be completely hidden
      // This is controlled by CSS: .page-body.collapse-aside-920 .page-aside { display: none !important; }
      await expect(pageAside).toBeHidden();
    }
  });
});
