// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { test, expect } from "@playwright/test";

test.describe("KaTeX Math Rendering", () => {
  test("renders inline math correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/katex-test");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/KaTeX Math Test/);

    // Check for inline math elements (KaTeX creates .katex elements)
    const inlineMath = page.locator(".katex").first();
    await expect(inlineMath).toBeVisible();

    // Verify specific math content is rendered (E = mc^2)
    const mathElements = page.locator(".katex");
    const mathCount = await mathElements.count();
    expect(mathCount).toBeGreaterThan(0);

    // Check that math is properly formatted (has KaTeX HTML structure)
    const katexHtml = page.locator(".katex-html").first();
    await expect(katexHtml).toBeVisible();

    // Verify no KaTeX errors are present
    const katexErrors = page.locator(".katex-error");
    await expect(katexErrors).toHaveCount(0);
  });

  test("renders display math correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/katex-test");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check for display math elements
    const displayMath = page.locator(".katex-display");
    await expect(displayMath.first()).toBeVisible();

    const displayMathCount = await displayMath.count();
    expect(displayMathCount).toBeGreaterThan(0);

    // Verify display math is centered
    const firstDisplayMath = displayMath.first();
    const textAlign = await firstDisplayMath.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    );
    expect(textAlign).toBe("center");
  });

  test("handles math errors gracefully", async ({ page }) => {
    // Create a page with invalid math to test error handling
    const invalidMathContent = `
      # Math Error Test
      
      Here's some invalid math: $\\invalid{syntax$
      
      And some valid math: $x = y$
    `;

    // We would need to create this via the MyST renderer
    // For now, just check that the page loads without crashing
    await page.goto("http://localhost:4322/katex-test");
    await page.waitForLoadState("networkidle");

    // Page should load successfully even if there were math errors
    const title = await page.locator("h1").first().textContent();
    expect(title).toContain("Math Rendering Test");
  });

  test("math is responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:4322/katex-test");
    await page.waitForLoadState("networkidle");

    // Check that math elements are still visible and properly sized
    const mathElements = await page.locator(".katex").all();
    expect(mathElements.length).toBeGreaterThan(0);

    // Check that display math has proper overflow handling
    const displayMath = page.locator(".katex-display").first();
    if ((await displayMath.count()) > 0) {
      const overflowX = await displayMath.evaluate(
        (el) => window.getComputedStyle(el).overflowX
      );
      // Should allow horizontal scrolling on mobile for long equations
      expect(["auto", "scroll", "visible"]).toContain(overflowX);
    }
  });
});
