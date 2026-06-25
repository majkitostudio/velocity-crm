import { defineConfig, devices } from "@playwright/test";

import { operatorAuthFile } from "./tests/e2e/global-setup";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Intentionally serial: a single `npm run dev` instance cannot reliably serve
  // parallel credential sign-ins and on-demand RSC compilations. Raising workers
  // without switching to a production server caused flaky login/navigation timeouts.
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    storageState: operatorAuthFile,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AI_ENABLED: "true",
      AI_FEATURE_CONTACT_SUMMARY: "true",
      AI_FEATURE_CONTACT_SUMMARY_REFRESH: "true",
      LLM_SUMMARY_VENDOR: "fake",
      LLM_SUMMARY_MODEL: "fake-1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /auth\/auth-roles\.spec\.ts/,
    },
    {
      name: "auth",
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: /auth\/auth-roles\.spec\.ts/,
    },
  ],
});
