import { test, expect, type Page } from "@playwright/test";

/**
 * Web Awesome dependency smoke tests for the docs app
 *
 * The theme's own suite cannot cover this: the home page composes
 * `ThemeControls` into `BasePage` directly rather than through `DocsLayout`,
 * and it is the only route in the workspace that does. `DocsLayout` registers
 * `wa-select` and `wa-option` for its own theme selector, so every route that
 * uses it hides a missing registration in the component that renders them.
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

test("the home page registers every Web Awesome element it renders", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // The theme selector is the element this route exists to guard, so make the
  // route's own coverage explicit rather than relying on it staying present.
  const rendered = await renderedWaElements(page);
  expect(rendered).toContain("wa-select");
  expect(rendered).toContain("wa-option");

  await expect
    .poll(() => unregisteredWaElements(page), { timeout: 15000 })
    .toEqual([]);
});

test("the home page theme selector is a dropdown, not a run of text", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".theme-selector")).toBeVisible();

  // An unregistered `<wa-select>` leaves its `<wa-option>` children in normal
  // flow, so all ten theme names read as a run of plain text in the header.
  // Once the element upgrades they are slotted into the closed dropdown, which
  // is what makes hidden the correct assertion here.
  await expect(
    page.locator('.theme-selector wa-option[value="brutalist"]'),
  ).toBeHidden();
});
