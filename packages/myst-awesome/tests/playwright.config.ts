import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: true,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:4321",
    actionTimeout: 0,
    trace: "on-first-retry",
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
      url: "http://localhost:4321",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: "pnpm --filter=myst-awesome-docs run myst-content-server",
      url: "http://localhost:3100",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
