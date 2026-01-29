// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { test, expect } from "@playwright/test";

test.describe("Image Node Rendering", () => {
  test("renders simple images correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/image-test");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/Image Rendering Test/);

    // Check for image elements
    const images = page.locator("img");
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);

    // Verify first image has required attributes
    const firstImage = images.first();
    await expect(firstImage).toBeVisible();
    await expect(firstImage).toHaveAttribute("src");
    await expect(firstImage).toHaveAttribute("alt");
  });

  test("renders image alt text correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Find image with specific alt text
    const landscapeImage = page.locator('img[alt="A beautiful landscape"]');
    await expect(landscapeImage).toBeVisible();

    const mountainImage = page.locator('img[alt="Mountain sunset"]');
    await expect(mountainImage).toBeVisible();
  });

  test("renders image title attribute correctly", async ({ page }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Find image with title attribute
    const imageWithTitle = page.locator(
      'img[title="Beautiful sunset over mountains"]'
    );
    await expect(imageWithTitle).toBeVisible();
    await expect(imageWithTitle).toHaveAttribute(
      "title",
      "Beautiful sunset over mountains"
    );
  });

  test("renders left-aligned images with correct styling", async ({ page }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Find left-aligned image
    const leftImage = page.locator('img[alt="Forest path"]');
    await expect(leftImage).toBeVisible();

    // Check style attribute contains float: left
    const style = await leftImage.getAttribute("style");
    expect(style).toContain("float: left");
    expect(style).toContain("margin-right");
  });

  test("renders center-aligned images with correct styling", async ({
    page,
  }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Find center-aligned image
    const centerImage = page.locator('img[alt="Nature landscape"]');
    await expect(centerImage).toBeVisible();

    // Check style attribute contains centering styles
    const style = await centerImage.getAttribute("style");
    expect(style).toContain("display: block");
    expect(style).toContain("margin-left: auto");
    expect(style).toContain("margin-right: auto");
  });

  test("renders right-aligned images with correct styling", async ({
    page,
  }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Find right-aligned image
    const rightImage = page.locator('img[alt="Mountain view"]');
    await expect(rightImage).toBeVisible();

    // Check style attribute contains float: right
    const style = await rightImage.getAttribute("style");
    expect(style).toContain("float: right");
    expect(style).toContain("margin-left");
  });

  test("renders images with custom width", async ({ page }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Find image with custom width
    const customWidthImage = page.locator(
      'img[alt="Landscape with custom width"]'
    );
    await expect(customWidthImage).toBeVisible();

    // Check that width is specified in style
    const style = await customWidthImage.getAttribute("style");
    expect(style).toContain("width: 700px");
  });

  test("images are responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Check that images are still visible and properly sized
    const images = await page.locator("img").all();
    expect(images.length).toBeGreaterThan(0);

    // Check that images don't overflow viewport
    for (const image of images.slice(0, 3)) {
      const boundingBox = await image.boundingBox();
      if (boundingBox) {
        // Images should not be wider than viewport (with some margin for padding)
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test("all images load successfully", async ({ page }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Wait a bit for images to load
    await page.waitForTimeout(2000);

    // Check that images have loaded (no broken image indicators)
    const images = await page.locator("img").all();

    for (const image of images) {
      // Check naturalWidth > 0 indicates image loaded
      const naturalWidth = await image.evaluate(
        (img) => (img as HTMLImageElement).naturalWidth
      );
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test("image with both width and alignment renders correctly", async ({
    page,
  }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Find image with both width and alignment (left-aligned with 300px width)
    const imageWithBoth = page.locator('img[alt="Forest path"]');
    await expect(imageWithBoth).toBeVisible();

    const style = await imageWithBoth.getAttribute("style");
    // Should have both width and alignment styles
    expect(style).toContain("width: 300px");
    expect(style).toContain("float: left");
  });

  test("handles images without optional attributes", async ({ page }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");

    // Find image with only alt text (no title, width, or align)
    const simpleImage = page.locator('img[alt="Ocean waves"]');
    await expect(simpleImage).toBeVisible();

    // Should have src and alt, but no title or style
    await expect(simpleImage).toHaveAttribute("src");
    await expect(simpleImage).toHaveAttribute("alt", "Ocean waves");

    // Title should not be present (or empty)
    const title = await simpleImage.getAttribute("title");
    expect(title).toBeNull();
  });
});
