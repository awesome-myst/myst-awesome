// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { test, expect } from "@playwright/test";

test.describe("Admonition Rendering", () => {
  test("page loads successfully", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/Admonition Rendering Test/);

    // Check main heading is visible
    const heading = page.locator(".page-main h1").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Admonition Rendering Test");
  });

  test("all 11 admonition kinds render", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Check for each admonition kind
    const kinds = [
      "note",
      "info",
      "important",
      "tip",
      "hint",
      "seealso",
      "attention",
      "caution",
      "warning",
      "danger",
      "error",
    ];

    for (const kind of kinds) {
      const admonition = page.locator(
        `wa-callout[data-admonition-kind="${kind}"]`
      ).first();
      await expect(admonition).toBeVisible();
    }
  });

  test("note admonition has brand variant", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    const noteAdmonition = page.locator(
      'wa-callout[data-admonition-kind="note"]'
    ).first();
    await expect(noteAdmonition).toBeVisible();
    await expect(noteAdmonition).toHaveAttribute("variant", "brand");
  });

  test("tip admonition has success variant", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    const tipAdmonition = page.locator(
      'wa-callout[data-admonition-kind="tip"]'
    ).first();
    await expect(tipAdmonition).toBeVisible();
    await expect(tipAdmonition).toHaveAttribute("variant", "success");
  });

  test("warning admonition has warning variant", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    const warningAdmonition = page.locator(
      'wa-callout[data-admonition-kind="warning"]'
    ).first();
    await expect(warningAdmonition).toBeVisible();
    await expect(warningAdmonition).toHaveAttribute("variant", "warning");
  });

  test("danger admonition has danger variant", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    const dangerAdmonition = page.locator(
      'wa-callout[data-admonition-kind="danger"]'
    ).first();
    await expect(dangerAdmonition).toBeVisible();
    await expect(dangerAdmonition).toHaveAttribute("variant", "danger");
  });

  test("icons are present in admonitions", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Check that the first note admonition has an icon
    const noteAdmonition = page.locator(
      'wa-callout[data-admonition-kind="note"]'
    ).first();
    const icon = noteAdmonition.locator('wa-icon[slot="icon"]');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute("name", "circle-info");
  });

  test("tip icon is lightbulb", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    const tipAdmonition = page.locator(
      'wa-callout[data-admonition-kind="tip"]'
    ).first();
    const icon = tipAdmonition.locator('wa-icon[slot="icon"]');
    await expect(icon).toHaveAttribute("name", "lightbulb");
  });

  test("warning icon is triangle-exclamation", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    const warningAdmonition = page.locator(
      'wa-callout[data-admonition-kind="warning"]'
    ).first();
    const icon = warningAdmonition.locator('wa-icon[slot="icon"]');
    await expect(icon).toHaveAttribute("name", "triangle-exclamation");
  });

  test("default titles are formatted correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Note should have "Note" title
    const noteAdmonition = page.locator(
      'wa-callout[data-admonition-kind="note"]'
    ).first();
    const noteTitle = noteAdmonition.locator("strong").first();
    await expect(noteTitle).toContainText("Note");

    // See Also should have "See Also" title (not "Seealso")
    const seeAlsoAdmonition = page.locator(
      'wa-callout[data-admonition-kind="seealso"]'
    ).first();
    const seeAlsoTitle = seeAlsoAdmonition.locator("strong").first();
    await expect(seeAlsoTitle).toContainText("See Also");
  });

  test("custom titles render correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Find admonition with "Custom Note Title"
    const customTitleAdmonition = page
      .locator('wa-callout[data-admonition-kind="note"]')
      .filter({ hasText: "Custom Note Title" });
    await expect(customTitleAdmonition).toBeVisible();

    const title = customTitleAdmonition.locator("strong").first();
    await expect(title).toContainText("Custom Note Title");
  });

  test("admonitions without icons hide icon element", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Find "Note Without Icon" section
    const noIconSection = page.locator("text=Note Without Icon");
    await expect(noIconSection).toBeVisible();

    // Find the admonition in this section (should be nearby)
    const admonition = page
      .locator('wa-callout[data-admonition-kind="note"]')
      .filter({ hasText: "Note Without Icon" });

    // Check that there's no icon with slot="icon"
    const icon = admonition.locator('wa-icon[slot="icon"]');
    await expect(icon).not.toBeVisible();
  });

  test("dropdown admonitions use wa-details element", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Find dropdown admonitions
    const dropdownAdmonitions = page.locator("wa-details.admonition");
    const count = await dropdownAdmonitions.count();
    expect(count).toBeGreaterThan(0);

    // Check first dropdown has correct structure
    const firstDropdown = dropdownAdmonitions.first();
    await expect(firstDropdown).toBeVisible();

    // Should have summary slot
    const summary = firstDropdown.locator('[slot="summary"]');
    await expect(summary).toBeVisible();
  });

  test("dropdown can be opened and closed", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Find a dropdown that starts closed
    const dropdown = page
      .locator('wa-details[data-admonition-kind="note"]')
      .filter({ hasText: "Click to Expand" })
      .first();

    await expect(dropdown).toBeVisible();

    // Initially should not have open attribute
    const initialOpen = await dropdown.getAttribute("open");
    expect(initialOpen).toBeNull();

    // Click to open
    const summary = dropdown.locator('[slot="summary"]');
    await summary.click();

    // Wait a moment for state to update
    await page.waitForTimeout(300);

    // Should now have open attribute
    const afterClickOpen = await dropdown.getAttribute("open");
    expect(afterClickOpen).not.toBeNull();
  });

  test("dropdown with open attribute starts open", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Find dropdown with ":open: true"
    const openDropdown = page
      .locator('wa-details[data-admonition-kind="tip"]')
      .filter({ hasText: "Hide Me!" })
      .first();

    await expect(openDropdown).toBeVisible();

    // Should have open attribute
    const hasOpen = await openDropdown.getAttribute("open");
    expect(hasOpen).not.toBeNull();
  });

  test("simple admonitions have plain appearance", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Find admonition with simple class
    const simpleAdmonition = page
      .locator('wa-callout[data-admonition-kind="note"]')
      .filter({ hasText: "Simple Styling" })
      .first();

    await expect(simpleAdmonition).toBeVisible();
    await expect(simpleAdmonition).toHaveAttribute("appearance", "plain");
  });

  test("nested content renders correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Find admonition with list
    const listAdmonition = page
      .locator('wa-callout[data-admonition-kind="note"]')
      .filter({ hasText: "Lists in Admonitions" });

    await expect(listAdmonition).toBeVisible();

    // Check for bullet list
    const bulletList = listAdmonition.locator("ul");
    await expect(bulletList).toBeVisible();

    // Check for numbered list
    const numberedList = listAdmonition.locator("ol");
    await expect(numberedList).toBeVisible();
  });

  test("code blocks in admonitions render correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Find admonition with code block
    const codeAdmonition = page
      .locator('wa-callout[data-admonition-kind="tip"]')
      .filter({ hasText: "Code Example" });

    await expect(codeAdmonition).toBeVisible();

    // Check for code block
    const codeBlock = codeAdmonition.locator("pre");
    await expect(codeBlock).toBeVisible();
  });

  test("nested admonitions render correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Find outer warning admonition
    const outerAdmonition = page
      .locator('wa-callout[data-admonition-kind="warning"]')
      .filter({ hasText: "Outer Warning" })
      .first();

    await expect(outerAdmonition).toBeVisible();

    // Find nested note admonition inside
    const nestedAdmonition = outerAdmonition.locator(
      'wa-callout[data-admonition-kind="note"]'
    );
    await expect(nestedAdmonition).toBeVisible();
  });

  test("responsive behavior on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    // Check admonitions are still visible and not overflowing
    const admonitions = page.locator("wa-callout.admonition");
    const count = await admonitions.count();
    expect(count).toBeGreaterThan(0);

    // Check first admonition doesn't overflow viewport
    const firstAdmonition = admonitions.first();
    const boundingBox = await firstAdmonition.boundingBox();
    if (boundingBox) {
      // Width should not exceed viewport (with some margin for padding)
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    }
  });

  test("admonition CSS classes are applied correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    const noteAdmonition = page.locator(
      'wa-callout[data-admonition-kind="note"]'
    ).first();

    // Should have admonition class
    await expect(noteAdmonition).toHaveClass(/admonition/);

    // Should have kind-specific class
    await expect(noteAdmonition).toHaveClass(/admonition-note/);

    // Should have variant-specific class
    await expect(noteAdmonition).toHaveClass(/admonition-brand/);
  });

  test("admonition content wrapper is present", async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");

    const admonition = page.locator('wa-callout[data-admonition-kind="note"]').first();
    const contentWrapper = admonition.locator(".admonition-content");
    await expect(contentWrapper).toBeVisible();
  });
});
