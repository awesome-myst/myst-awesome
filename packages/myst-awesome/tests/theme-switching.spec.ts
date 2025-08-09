import { test, expect } from "@playwright/test";

/**
 * Theme Switching Tests
 * Tests the theme and color scheme switching functionality of the MyST Awesome Theme
 */

test.describe("Theme Switching", () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip Firefox due to timeout issues with Web Awesome components
    test.skip(
      browserName === "firefox",
      "Theme switching tests are flaky in Firefox"
    );

    // Navigate to the docs-example page which has theme controls
    await page.goto("http://localhost:4322/docs-example");
    await page.waitForLoadState("networkidle");

    // Wait for components to be fully loaded
    await page.waitForTimeout(1000);
  });

  test("should display theme controls in header", async ({ page }) => {
    // Verify theme controls are present and visible
    const themeSelector = page.locator(".theme-selector");
    const colorSchemeToggle = page.locator(".color-scheme-toggle");

    await expect(themeSelector).toBeVisible();
    await expect(colorSchemeToggle).toBeVisible();

    // Verify they have correct initial values
    const themeValue = await themeSelector.evaluate((el: any) => el.value);
    // Active button reflects initial state
    const activeBtn = page.locator(".color-scheme-toggle .color-btn.active");
    await expect(activeBtn).toHaveCount(1);
    await expect(activeBtn).toHaveAttribute("data-value", "auto");
    expect(themeValue).toBe("default");
  });

  test("should switch color schemes correctly", async ({ page }) => {
    const colorSchemeToggle = page.locator(".color-scheme-toggle");
    const htmlElement = page.locator("html");

    // Test switching to dark mode
    await page
      .locator('.color-scheme-toggle .color-btn[data-value="dark"]')
      .click();
    await page.waitForTimeout(500);

    // Verify dark mode is applied
    await expect(htmlElement).toHaveClass(/.*wa-dark.*/);
    await expect(
      page.locator(".color-scheme-toggle .color-btn.active")
    ).toHaveAttribute("data-value", "dark");

    // Test switching to light mode
    await page
      .locator('.color-scheme-toggle .color-btn[data-value="light"]')
      .click();
    await page.waitForTimeout(500);

    // Verify dark mode is removed
    await expect(htmlElement).not.toHaveClass(/.*wa-dark.*/);
    await expect(
      page.locator(".color-scheme-toggle .color-btn.active")
    ).toHaveAttribute("data-value", "light");

    // Test switching back to auto
    await page
      .locator('.color-scheme-toggle .color-btn[data-value="auto"]')
      .click();
    await page.waitForTimeout(500);
    await expect(
      page.locator(".color-scheme-toggle .color-btn.active")
    ).toHaveAttribute("data-value", "auto");
  });

  test("should switch themes correctly", async ({ page }) => {
    // Listen for console logs
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    const themeSelector = page.locator(".theme-selector");
    const htmlElement = page.locator("html");

    // Test switching to awesome theme
    await themeSelector.click();
    await page.locator('wa-option[value="awesome"]').click();
    await page.waitForTimeout(500);

    // Verify awesome theme is applied
    await expect(htmlElement).toHaveClass(/.*wa-theme-awesome.*/);
    const awesomeValue = await themeSelector.evaluate((el: any) => el.value);
    expect(awesomeValue).toBe("awesome");

    // Test switching to shoelace theme
    await themeSelector.click();
    await page.locator('wa-option[value="shoelace"]').click();
    await page.waitForTimeout(500);

    // Verify shoelace theme is applied and awesome is removed
    await expect(htmlElement).toHaveClass(/.*wa-theme-shoelace.*/);
    await expect(htmlElement).not.toHaveClass(/.*wa-theme-awesome.*/);
    const shoelaceValue = await themeSelector.evaluate((el: any) => el.value);
    expect(shoelaceValue).toBe("shoelace");

    // Test switching back to default theme
    await themeSelector.click();
    await page.locator('wa-option[value="default"]').click();
    await page.waitForTimeout(500);

    // Verify theme classes are removed
    await expect(htmlElement).not.toHaveClass(/.*wa-theme-shoelace.*/);
    await expect(htmlElement).not.toHaveClass(/.*wa-theme-awesome.*/);
    const defaultValue = await themeSelector.evaluate((el: any) => el.value);
    expect(defaultValue).toBe("default");
  });

  test("should not have console errors during theme switching", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const themeSelector = page.locator(".theme-selector");
    const colorSchemeToggle = page.locator(".color-scheme-toggle");

    // Perform multiple theme switches
    const operations: Array<{ type: "color" | "theme"; value: string }> = [
      { type: "color", value: "dark" },
      { type: "theme", value: "awesome" },
      { type: "color", value: "light" },
      { type: "theme", value: "shoelace" },
      { type: "color", value: "auto" },
      { type: "theme", value: "default" },
    ];

    for (const op of operations) {
      if (op.type === "color") {
        await page
          .locator(`.color-scheme-toggle .color-btn[data-value="${op.value}"]`)
          .click();
      } else {
        await themeSelector.click();
        await page.locator(`wa-option[value="${op.value}"]`).click();
      }
      await page.waitForTimeout(200);
    }

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });
});
