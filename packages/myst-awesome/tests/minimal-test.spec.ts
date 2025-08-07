import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("http://localhost:4322/");
  await expect(page).toHaveTitle(/MyST Awesome Theme Demo/);
  console.log("✓ Homepage loaded successfully");
});

test("blog page loads", async ({ page }) => {
  await page.goto("http://localhost:4322/blog-example");
  await expect(page).toHaveTitle(/Building Modern Documentation/);
  console.log("✓ Blog page loaded successfully");
});

test("working demo loads", async ({ page }) => {
  await page.goto("http://localhost:4322/working-demo");
  await expect(page).toHaveTitle(/Working Demo/);
  console.log("✓ Working demo loaded successfully");
});
