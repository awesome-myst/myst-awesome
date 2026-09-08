import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:4322",
    actionTimeout: 0,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter=myst-awesome dev",
      url: "http://localhost:4322",
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
      // Astro 7 detects AI coding agents and starts `astro dev` in the
      // background, which returns immediately. Playwright supervises its web
      // server as a foreground process, so it would see the command exit early
      // and abort the run before any test starts.
      env: { ASTRO_DEV_BACKGROUND: "0" },
    },
  ],
});
