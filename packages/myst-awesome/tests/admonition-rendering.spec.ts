// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { test, expect } from "@playwright/test";

test.describe("Admonition Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4322/admonition-test");
    await page.waitForLoadState("networkidle");
  });

  test("renders custom title for admonitionTitle", async ({ page }) => {
    const title = page.locator("wa-callout .admonition-title").first();
    await expect(title).toContainText("Custom Note Title");
  });

  test("maps note admonition to brand variant", async ({ page }) => {
    const callout = page.locator("wa-callout").first();
    await expect(callout).toHaveAttribute("variant", "brand");
  });

  test("defaults warning title when missing", async ({ page }) => {
    const warningCallout = page.locator("wa-callout").nth(1);
    const title = warningCallout.locator(".admonition-title");
    await expect(title).toContainText("Warning");
  });

  test("simple admonition omits icon slot", async ({ page }) => {
    const dangerCallout = page.locator("wa-callout").nth(2);
    const iconSlot = dangerCallout.locator("wa-icon[slot=\"icon\"]");
    await expect(iconSlot).toHaveCount(0);
  });
});
