import { test, expect } from "@playwright/test";

test.describe("Debug Page Structure", () => {
  test("check what elements exist on the page", async ({ page }) => {
    await page.goto("http://localhost:4321/docs-example");
    await page.waitForLoadState("networkidle");

    // Check if the page loads at all
    await expect(page.locator("body")).toBeVisible();

    // Check what's in the page
    const bodyHTML = await page.locator("body").innerHTML();
    console.log(
      "Page body HTML (first 500 chars):",
      bodyHTML.substring(0, 500)
    );

    // Check for specific elements
    const hasPageLayout = await page.locator(".page-layout").count();
    const hasPageBody = await page.locator(".page-body").count();
    const hasMain = await page.locator("main").count();

    console.log("Element counts:");
    console.log("- .page-layout:", hasPageLayout);
    console.log("- .page-body:", hasPageBody);
    console.log("- main:", hasMain);

    // Check the page title to see if it's the right page
    const title = await page.title();
    console.log("Page title:", title);

    expect(hasPageBody).toBeGreaterThan(0);
  });
});
