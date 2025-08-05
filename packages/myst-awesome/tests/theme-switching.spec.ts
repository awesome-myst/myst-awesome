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
    await page.goto("http://localhost:4321/docs-example");
    await page.waitForLoadState("networkidle");

    // Wait for components to be fully loaded
    await page.waitForTimeout(1000);
  });

  test("should display theme controls in header", async ({ page }) => {
    // Verify theme controls are present and visible
    const themeSelector = page.locator(".theme-selector");
    const colorSchemeSelector = page.locator(".color-scheme-selector");

    await expect(themeSelector).toBeVisible();
    await expect(colorSchemeSelector).toBeVisible();

    // Verify they have correct initial values
    const themeValue = await themeSelector.evaluate((el: any) => el.value);
    const colorSchemeValue = await colorSchemeSelector.evaluate(
      (el: any) => el.value
    );

    expect(themeValue).toBe("default");
    expect(colorSchemeValue).toBe("auto");
  });

  test("should switch color schemes correctly", async ({ page }) => {
    const colorSchemeSelector = page.locator(".color-scheme-selector");
    const htmlElement = page.locator("html");

    // Test switching to dark mode
    await colorSchemeSelector.click();
    await page.locator('wa-option[value="dark"]').click();
    await page.waitForTimeout(500);

    // Verify dark mode is applied
    await expect(htmlElement).toHaveClass(/.*wa-dark.*/);
    const darkValue = await colorSchemeSelector.evaluate((el: any) => el.value);
    expect(darkValue).toBe("dark");

    // Test switching to light mode
    await colorSchemeSelector.click();
    await page.locator('wa-option[value="light"]').click();
    await page.waitForTimeout(500);

    // Verify dark mode is removed
    await expect(htmlElement).not.toHaveClass(/.*wa-dark.*/);
    const lightValue = await colorSchemeSelector.evaluate(
      (el: any) => el.value
    );
    expect(lightValue).toBe("light");

    // Test switching back to auto
    await colorSchemeSelector.click();
    await page.locator('wa-option[value="auto"]').click();
    await page.waitForTimeout(500);

    const autoValue = await colorSchemeSelector.evaluate((el: any) => el.value);
    expect(autoValue).toBe("auto");
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
    const colorSchemeSelector = page.locator(".color-scheme-selector");

    // Perform multiple theme switches
    const operations = [
      { selector: colorSchemeSelector, value: "dark" },
      { selector: themeSelector, value: "awesome" },
      { selector: colorSchemeSelector, value: "light" },
      { selector: themeSelector, value: "premium" },
      { selector: colorSchemeSelector, value: "auto" },
      { selector: themeSelector, value: "default" },
    ];

    for (const operation of operations) {
      await operation.selector.click();
      await page.locator(`wa-option[value="${operation.value}"]`).click();
      await page.waitForTimeout(200);
    }

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });
});
