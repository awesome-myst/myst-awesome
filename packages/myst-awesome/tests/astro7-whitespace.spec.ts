// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { test, expect, type Page } from "@playwright/test";

/**
 * Astro 7 changed the default `compressHTML` from `true` to `"jsx"`, so the
 * template compiler now applies JSX whitespace rules: the space between a line
 * of text and an element opening on the next line is *deleted* rather than
 * collapsed to a single space. Astro 6 collapsed it, so prose that relied on
 * the line break for spacing silently lost it on upgrade — no build warning,
 * only words running together in the rendered page.
 *
 * Each case below is a place where that space carries meaning and is therefore
 * held open explicitly with `{" "}` in the template. The assertions are on
 * rendered text rather than a screenshot so that a failure names the exact
 * phrase that ran together.
 */

/**
 * Rendered text of the first `selector` match, with runs of whitespace
 * collapsed to a single space.
 *
 * `innerText` is used rather than `textContent` because only the browser knows
 * which source whitespace actually renders. Collapsing runs is safe for this
 * regression: it maps "with Astro" onto itself and leaves "withAstro"
 * unchanged, so the two stay distinguishable. The result is deliberately not
 * trimmed, because a leading space is exactly what separates an inline icon
 * from its label.
 */
async function renderedText(page: Page, selector: string): Promise<string> {
  const text = await page.locator(selector).first().innerText();
  return text.replace(/\s+/g, " ");
}

test.describe("Astro 7 whitespace preservation", () => {
  test("prose keeps the space before an inline link", async ({ page }) => {
    await page.goto("/docs-example");

    const overview = await renderedText(page, "#overview + p");
    expect(overview).toContain(
      "documentation theme built with Astro and Web Awesome components"
    );
  });

  test("prose keeps the space between adjacent inline links", async ({
    page,
  }) => {
    await page.goto("/blog-example");

    const intro = await renderedText(page, "#introduction + p");
    expect(intro).toContain(
      "Astro's static site generation with Web Awesome's component library"
    );
  });

  test("prose keeps the space between adjacent inline code spans", async ({
    page,
  }) => {
    await page.goto("/component-override-test");

    const resolvers = await renderedText(page, "#component-resolvers + p");
    expect(resolvers).toContain(
      "NavigationMenuResolver and TableOfContentsResolver act as wrappers"
    );
  });

  test("callout keeps the space before a trailing link", async ({ page }) => {
    await page.goto("/blog-example");

    const callout = await renderedText(page, "wa-callout[variant='brand']");
    expect(callout).toContain(
      "Check out our installation guide and begin building"
    );
  });

  // The article metadata row is the non-prose form of the same regression: each
  // item is an inline `wa-icon` followed by its label, and without the explicit
  // space the glyph butts directly against the text. `wa-icon` contributes no
  // text of its own, so the separator surfaces as a leading space on the item.
  test("article metadata separates each icon from its label", async ({
    page,
  }) => {
    await page.goto("/blog-example");

    for (const item of [
      ".meta-item.date",
      ".meta-item.reading-time",
      ".meta-item.updated",
    ]) {
      await expect(page.locator(item).first()).toBeVisible();

      const text = await renderedText(page, item);
      expect(
        text,
        `${item} lost the space between its icon and its label`
      ).toMatch(/^ \S/);
    }
  });
});
