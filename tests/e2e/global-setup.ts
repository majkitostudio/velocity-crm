import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

import { chromium, type FullConfig } from "@playwright/test";

import { seedUsers } from "./fixtures/seed-users";

export const operatorAuthFile = path.join(
  process.cwd(),
  "playwright",
  ".auth",
  "operator.json",
);

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  // Apply schema and restore deterministic queue/callback state after prior E2E runs.
  execSync("npx prisma migrate deploy", { stdio: "inherit", cwd: process.cwd() });
  execSync("npm run prisma:seed", { stdio: "inherit", cwd: process.cwd() });

  mkdirSync(path.dirname(operatorAuthFile), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const user = seedUsers.operator;

  await page.goto(`${baseURL}/login`);
  await page.getByTestId("login-email-input").fill(user.email);
  await page.getByTestId("login-password-input").fill(user.password);
  await page.getByTestId("login-submit-button").click();
  await page.waitForURL(/\/dashboard(?:\/)?$/, {
    timeout: 30_000,
    waitUntil: "commit",
  });

  await context.storageState({ path: operatorAuthFile });
  await browser.close();
}

export default globalSetup;
