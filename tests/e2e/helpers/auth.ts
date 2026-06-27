import { expect, type Page } from "@playwright/test";

import { seedUsers, type SeedUserKey } from "../fixtures/seed-users";

export async function waitForContactDetail(page: Page) {
  await page.waitForURL(/\/contacts\//, {
    timeout: 30_000,
    waitUntil: "commit",
  });
  await expect(page.getByTestId("contact-detail-page")).toBeVisible();
}

export async function loginAs(page: Page, userKey: SeedUserKey) {
  const user = seedUsers[userKey];

  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(user.email);
  await page.getByTestId("login-password-input").fill(user.password);
  await page.getByTestId("login-submit-button").click();

  await page.waitForURL(/\/dashboard(?:\/)?$/, {
    timeout: 30_000,
    waitUntil: "commit",
  });

  await expect(page.getByTestId("crm-shell")).toBeVisible();
  await expect(page.getByTestId("crm-user-role")).toHaveText(user.role);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/login(?:\/)?$/, {
    timeout: 30_000,
    waitUntil: "commit",
  });
  await expect(page.getByTestId("login-email-input")).toBeVisible();
}
