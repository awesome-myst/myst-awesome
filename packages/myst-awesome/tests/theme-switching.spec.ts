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
  await page.goto("http://localhost:4322/docs-example", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".theme-selector, .color-scheme-toggle, body", { timeout: 15000 });

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
    const htmlElement = page.locator("html");
    const activeBtn = page.locator(".color-scheme-toggle .color-btn.active");

    // Initial state is auto
    await expect(activeBtn).toHaveAttribute("data-value", "auto");

    // auto -> light
    await activeBtn.click();
    await page.waitForTimeout(300);
    await expect(activeBtn).toHaveAttribute("data-value", "light");
    await expect(htmlElement).not.toHaveClass(/.*wa-dark.*/);

    // light -> dark
    await activeBtn.click();
    await page.waitForTimeout(300);
    await expect(activeBtn).toHaveAttribute("data-value", "dark");
    await expect(htmlElement).toHaveClass(/.*wa-dark.*/);

    // dark -> auto
    await activeBtn.click();
    await page.waitForTimeout(300);
    await expect(activeBtn).toHaveAttribute("data-value", "auto");
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
    // Cycle color scheme and change themes between cycles
    const clickActive = async () => {
      await page.locator(".color-scheme-toggle .color-btn.active").click();
      await page.waitForTimeout(150);
    };

    // auto -> light
    await clickActive();
    await themeSelector.click();
    await page.locator('wa-option[value="awesome"]').click();
    await page.waitForTimeout(150);

    // light -> dark
    await clickActive();
    await themeSelector.click();
    await page.locator('wa-option[value="shoelace"]').click();
    await page.waitForTimeout(150);

    // dark -> auto
    await clickActive();
    await themeSelector.click();
    await page.locator('wa-option[value="default"]').click();
    await page.waitForTimeout(150);

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });
});
