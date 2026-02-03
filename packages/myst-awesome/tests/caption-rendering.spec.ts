// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { test, expect } from "@playwright/test";

test.describe("Caption and Figure Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4322/caption-test");
    await page.waitForLoadState("networkidle");
  });

  test("page loads successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/Caption Rendering Test/);
  });

  test("renders figure container as <figure> element", async ({ page }) => {
    const figure = page.locator("figure#fig-simple");
    await expect(figure).toBeVisible();
  });

  test("figure has 'numbered' class when enumerated", async ({ page }) => {
    const figure = page.locator("figure#fig-simple");
    await expect(figure).toHaveClass(/numbered/);
  });

  test("non-enumerated figure does not have 'numbered' class", async ({
    page,
  }) => {
    const figure = page.locator("figure#fig-no-number");
    await expect(figure).toBeVisible();
    const classAttr = await figure.getAttribute("class");
    // Class attribute may be null (no classes) or a string without 'numbered'
    expect(classAttr === null || !classAttr.includes("numbered")).toBe(true);
  });

  test("renders caption as <figcaption> element", async ({ page }) => {
    const figcaption = page.locator("figure#fig-simple figcaption");
    await expect(figcaption).toBeVisible();
  });

  test("renders caption-number span with correct format", async ({ page }) => {
    const captionNumber = page.locator("figure#fig-simple .caption-number");
    await expect(captionNumber).toBeVisible();
    await expect(captionNumber).toContainText("Figure 1");
  });

  test("table caption contains 'Table' prefix", async ({ page }) => {
    const tableCaptionNumber = page.locator(
      "figure#tbl-example .caption-number"
    );
    await expect(tableCaptionNumber).toBeVisible();
    await expect(tableCaptionNumber).toContainText("Table 1");
  });

  test("renders legend as div with 'legend' class", async ({ page }) => {
    const legend = page.locator("figure#fig-legend .legend");
    await expect(legend).toBeVisible();
    await expect(legend).toContainText("additional context");
  });

  test("figure with custom class has both 'numbered' and custom class", async ({
    page,
  }) => {
    const figure = page.locator("figure#fig-custom");
    await expect(figure).toHaveClass(/numbered/);
    await expect(figure).toHaveClass(/my-custom-figure/);
  });

  test("figcaption has correct styling - centered text", async ({ page }) => {
    const figcaption = page.locator("figure#fig-simple figcaption");

    // Check text-align is center
    const textAlign = await figcaption.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    );
    expect(textAlign).toBe("center");
  });

  test("caption-number has bolder font weight than normal", async ({ page }) => {
    const captionNumber = page.locator("figure#fig-simple .caption-number");

    const fontWeight = await captionNumber.evaluate(
      (el) => window.getComputedStyle(el).fontWeight
    );
    // Font weight should be at least medium (500) - depends on Web Awesome theme variables
    // Normal is typically 400, so anything >= 500 indicates intentional emphasis
    expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(500);
  });

  test("caption can contain rich content (bold, italic)", async ({ page }) => {
    const caption = page.locator("figure#fig-rich figcaption");
    await expect(caption).toBeVisible();

    // Check for bold text
    const boldText = caption.locator("strong");
    await expect(boldText).toContainText("bold text");

    // Check for italic text
    const italicText = caption.locator("em");
    await expect(italicText).toContainText("italic text");
  });

  test("figure contains image as child", async ({ page }) => {
    const image = page.locator("figure#fig-simple img");
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("alt", "Blue test image");
  });

  test("legend appears after caption in DOM", async ({ page }) => {
    // Get the figure with legend
    const figure = page.locator("figure#fig-legend");

    // Check that figcaption comes before legend in DOM order
    const children = await figure.evaluate((el) => {
      const childElements = Array.from(el.children);
      const captionIndex = childElements.findIndex(
        (c) => c.tagName === "FIGCAPTION"
      );
      const legendIndex = childElements.findIndex((c) =>
        c.classList.contains("legend")
      );
      return { captionIndex, legendIndex };
    });

    expect(children.captionIndex).toBeLessThan(children.legendIndex);
  });
});

test.describe("Image Alignment with CSS Classes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4322/image-test");
    await page.waitForLoadState("networkidle");
  });

  test("left-aligned image has align-left class", async ({ page }) => {
    const leftImage = page.locator('img[alt="Green placeholder image"]');
    await expect(leftImage).toBeVisible();
    await expect(leftImage).toHaveClass(/align-left/);
  });

  test("center-aligned image has align-center class", async ({ page }) => {
    const centerImage = page.locator('img[alt="Purple placeholder image"]');
    await expect(centerImage).toBeVisible();
    await expect(centerImage).toHaveClass(/align-center/);
  });

  test("right-aligned image has align-right class", async ({ page }) => {
    const rightImage = page.locator('img[alt="Red placeholder image"]');
    await expect(rightImage).toBeVisible();
    await expect(rightImage).toHaveClass(/align-right/);
  });

  test("align-left class applies float: left", async ({ page }) => {
    const leftImage = page.locator('img[alt="Green placeholder image"]');

    const float = await leftImage.evaluate(
      (el) => window.getComputedStyle(el).float
    );
    expect(float).toBe("left");
  });

  test("align-center class centers the image", async ({ page }) => {
    const centerImage = page.locator('img[alt="Purple placeholder image"]');

    const display = await centerImage.evaluate(
      (el) => window.getComputedStyle(el).display
    );
    const marginLeft = await centerImage.evaluate(
      (el) => window.getComputedStyle(el).marginLeft
    );
    const marginRight = await centerImage.evaluate(
      (el) => window.getComputedStyle(el).marginRight
    );

    expect(display).toBe("block");
    expect(marginLeft).toBe(marginRight);
  });

  test("align-right class applies float: right", async ({ page }) => {
    const rightImage = page.locator('img[alt="Red placeholder image"]');

    const float = await rightImage.evaluate(
      (el) => window.getComputedStyle(el).float
    );
    expect(float).toBe("right");
  });

  test("image with width still has width in style attribute", async ({
    page,
  }) => {
    const imageWithWidth = page.locator('img[alt="Green placeholder image"]');
    const style = await imageWithWidth.getAttribute("style");
    expect(style).toContain("width: 300px");
  });
});
