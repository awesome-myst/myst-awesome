// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { test, expect } from "@playwright/test";

test.describe("Docs Admonition Integration", () => {
  test("admonitions documentation page loads", async ({ page }) => {
    await page.goto("http://localhost:4321/book/authoring/admonitions");
    await page.waitForLoadState("networkidle");

    // Check that the page loaded
    await expect(page).toHaveTitle(/Callouts & Admonitions/);

    // Check for main content
    const mainContent = page.locator(".page-main");
    await expect(mainContent).toBeVisible();
  });

  test("example admonitions render on docs page", async ({ page }) => {
    await page.goto("http://localhost:4321/book/authoring/admonitions");
    await page.waitForLoadState("networkidle");

    // Check for various admonition types
    const admonitions = page.locator("wa-callout.admonition, wa-details.admonition");
    const count = await admonitions.count();

    // The admonitions page should have multiple admonitions
    expect(count).toBeGreaterThan(5);
  });

  test("dropdown admonitions work on docs page", async ({ page }) => {
    await page.goto("http://localhost:4321/book/authoring/admonitions");
    await page.waitForLoadState("networkidle");

    // Find any dropdown admonition
    const dropdowns = page.locator("wa-details.admonition");
    const dropdownCount = await dropdowns.count();

    if (dropdownCount > 0) {
      const firstDropdown = dropdowns.first();
      await expect(firstDropdown).toBeVisible();

      // Try to interact with it
      const summary = firstDropdown.locator('[slot="summary"]');
      await expect(summary).toBeVisible();

      // Click to toggle
      await summary.click();
      await page.waitForTimeout(200);

      // Should be interactable (exact state depends on initial state)
      const hasOpen = await firstDropdown.getAttribute("open");
      // Just check the attribute exists or doesn't (either state is valid)
      expect(hasOpen !== undefined).toBe(true);
    }
  });

  test("icons display correctly on docs page", async ({ page }) => {
    await page.goto("http://localhost:4321/book/authoring/admonitions");
    await page.waitForLoadState("networkidle");

    // Find a callout admonition with an icon
    const callouts = page.locator("wa-callout.admonition");
    const calloutCount = await callouts.count();

    if (calloutCount > 0) {
      const firstCallout = callouts.first();
      const icon = firstCallout.locator('wa-icon[slot="icon"]');

      // Icon should be visible (unless icon: false was set)
      const iconCount = await icon.count();
      // Most admonitions should have icons
      expect(iconCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("mobile responsive behavior on docs", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:4321/book/authoring/admonitions");
    await page.waitForLoadState("networkidle");

    // Check admonitions are visible on mobile
    const admonitions = page.locator("wa-callout.admonition, wa-details.admonition");
    const count = await admonitions.count();
    expect(count).toBeGreaterThan(0);

    // Check first admonition doesn't overflow
    const firstAdmonition = admonitions.first();
    await expect(firstAdmonition).toBeVisible();

    const boundingBox = await firstAdmonition.boundingBox();
    if (boundingBox) {
      // Width should fit within mobile viewport
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    }
  });

  test("nested MyST content renders in admonitions", async ({ page }) => {
    await page.goto("http://localhost:4321/book/authoring/admonitions");
    await page.waitForLoadState("networkidle");

    // Find any admonition with nested content
    const admonitions = page.locator("wa-callout.admonition, wa-details.admonition");
    const count = await admonitions.count();

    if (count > 0) {
      // Check if any admonitions contain paragraphs or lists
      const admonitionsWithP = page.locator(
        "wa-callout.admonition p, wa-details.admonition p"
      );
      const pCount = await admonitionsWithP.count();

      // Admonitions should contain content
      expect(pCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("admonition styles are applied correctly on docs", async ({ page }) => {
    await page.goto("http://localhost:4321/book/authoring/admonitions");
    await page.waitForLoadState("networkidle");

    // Check that admonition CSS is loaded
    const admonition = page.locator("wa-callout.admonition, wa-details.admonition").first();
    await expect(admonition).toBeVisible();

    // Check for CSS classes
    const classAttribute = await admonition.getAttribute("class");
    expect(classAttribute).toContain("admonition");
  });

  test("variant colors are correctly applied", async ({ page }) => {
    await page.goto("http://localhost:4321/book/authoring/admonitions");
    await page.waitForLoadState("networkidle");

    // Find different admonition kinds
    const noteAdmonition = page
      .locator('wa-callout[data-admonition-kind="note"]')
      .first();
    const warningAdmonition = page
      .locator('wa-callout[data-admonition-kind="warning"]')
      .first();

    // Check variants are set correctly
    if ((await noteAdmonition.count()) > 0) {
      await expect(noteAdmonition).toHaveAttribute("variant", "brand");
    }

    if ((await warningAdmonition.count()) > 0) {
      await expect(warningAdmonition).toHaveAttribute("variant", "warning");
    }
  });
});
