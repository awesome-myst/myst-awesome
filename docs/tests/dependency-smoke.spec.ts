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

// Web Awesome 3 form controls emit the standard `input` and `change` events;
// the `wa-input` and `wa-change` names from its betas are never dispatched, so
// a listener still registered under one of them is silently dead. The home
// page is also the only route that renders NavigationMenu: DocsLayout builds
// its own navigation and drops a page's `navigation` slot.
test("the home page theme controls apply the chosen theme and color scheme", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => unregisteredWaElements(page), { timeout: 15000 })
    .toEqual([]);
  const html = page.locator("html");

  await page.locator(".theme-selector").click();
  await page.locator('.theme-selector wa-option[value="awesome"]').click();
  await expect(html).toHaveClass(/\bwa-theme-awesome\b/);

  await page.locator(".color-scheme-selector").click();
  await page.locator('.color-scheme-selector wa-option[value="dark"]').click();
  await expect(html).toHaveClass(/\bwa-dark\b/);
});

test("the home page navigation filter keeps matching entries and hides the rest", async ({
  page,
  isMobile,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => unregisteredWaElements(page), { timeout: 15000 })
    .toEqual([]);

  // BasePage renders the menu twice, in the desktop sidebar and in the mobile
  // drawer; each copy has to filter on its own.
  let menu = page.locator(".page-menu .navigation-menu");
  if (isMobile) {
    await page.locator(".mobile-nav-toggle").click();
    menu = page.locator(".mobile-nav-drawer .navigation-menu");
  }
  const sections = menu.locator(".nav-section");
  const search = menu.locator(".search-input input");
  await expect(sections.first()).toBeVisible();
  const total = await sections.count();

  // The home page's entries are flat: titled links with no children, which a
  // filter that only inspects child links hides for every query.
  await search.fill("admon");
  await expect(sections.filter({ visible: true })).toHaveText([/admonitions/i]);

  // The arrow keys move only between entries the filter left visible, and the
  // search field is one of the stops.
  await search.press("ArrowDown");
  await expect(sections.filter({ visible: true }).locator("a")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(search).toBeFocused();

  await search.fill("no page is called this");
  await expect(sections.filter({ visible: true })).toHaveCount(0);

  await search.fill("");
  await expect(sections.filter({ visible: true })).toHaveCount(total);
});
