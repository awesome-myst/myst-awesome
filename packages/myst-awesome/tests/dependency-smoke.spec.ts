import { test, expect, type Page } from "@playwright/test";

/**
 * Web Awesome dependency smoke tests
 *
 * Web Awesome registers each custom element as a side effect of importing its
 * module, so a layout that renders `<wa-tag>` without importing `tag.js`
 * anywhere in its component tree still builds, still serves valid HTML, and
 * still passes every test that only looks at text content — the element simply
 * never upgrades and its children render as unstyled markup.
 *
 * These tests fail on that state directly: every `wa-*` element the route puts
 * in the DOM must be `:defined`. Keeping the assertion generic means a future
 * Web Awesome upgrade that moves a deep import path is caught by the route that
 * uses it rather than by whoever notices the visual regression.
 */

/** Distinct `wa-*` tags the page rendered, whether or not they upgraded. */
async function renderedWaElements(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [
      ...new Set(
        [...document.querySelectorAll("*")]
          .map((el) => el.localName)
          .filter((name) => name.startsWith("wa-")),
      ),
    ].sort(),
  );
}

/** Distinct `wa-*` tags the page rendered that no module has registered. */
async function unregisteredWaElements(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [
      ...new Set(
        [...document.querySelectorAll(":not(:defined)")]
          .map((el) => el.localName)
          .filter((name) => name.startsWith("wa-")),
      ),
    ].sort(),
  );
}

// Routes chosen for layout coverage rather than content: DocsLayout, the bare
// BasePage, and ContentLayout each register a different set of elements.
const routes = [
  { path: "/docs-example", layout: "DocsLayout" },
  { path: "/", layout: "BasePage" },
  { path: "/blog-example", layout: "ContentLayout" },
];

for (const { path, layout } of routes) {
  test(`${layout} registers every Web Awesome element it renders (${path})`, async ({
    page,
  }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });

    // A route that renders no Web Awesome elements would pass the registration
    // assertion vacuously, so require that it exercises the dependency at all.
    await expect
      .poll(() => renderedWaElements(page), { timeout: 15000 })
      .not.toEqual([]);

    await expect
      .poll(() => unregisteredWaElements(page), { timeout: 15000 })
      .toEqual([]);
  });
}

test("the docs-example route loads without console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto("/docs-example", { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => unregisteredWaElements(page), { timeout: 15000 })
    .toEqual([]);

  expect(errors).toEqual([]);
});
