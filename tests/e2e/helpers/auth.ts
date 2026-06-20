import { expect, type Page } from "@playwright/test";

import { seedUsers, type SeedUserKey } from "../fixtures/seed-users";

export async function loginAs(page: Page, userKey: SeedUserKey) {
  const user = seedUsers[userKey];

  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(user.email);
  await page.getByTestId("login-password-input").fill(user.password);
  await Promise.all([
    page.waitForURL("**/dashboard", { timeout: 15_000 }),
    page.getByTestId("login-submit-button").click(),
  ]);

  await expect(page.getByTestId("crm-shell")).toBeVisible();
  await expect(page.getByTestId("crm-user-role")).toHaveText(user.role);
}
