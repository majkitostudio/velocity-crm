import { expect, test } from "@playwright/test";
import path from "node:path";

import { loginAs } from "../helpers/auth";

const importFixturePath = path.join(
  process.cwd(),
  "tests/e2e/fixtures/import-leads.csv",
);

async function runImportWizard(page: import("@playwright/test").Page) {
  await page.goto("/contacts/import?returnTo=%2Fcontacts%3Fstatus%3DLEAD");
  await expect(page.getByTestId("contacts-import-page")).toBeVisible();

  await page.getByTestId("import-upload-input").setInputFiles(importFixturePath);
  await expect(page.getByTestId("import-mapping-form")).toBeVisible({ timeout: 30_000 });

  await page.getByTestId("import-mapping-continue-button").click();
  await expect(page.getByTestId("import-preview-summary")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("import-preview-summary")).toContainText("připraveno");

  await page.getByTestId("import-preview-continue-button").click();
  await expect(page.getByTestId("import-confirm-checkbox")).toBeVisible();

  await page.getByTestId("import-confirm-checkbox").check();
  await page.getByTestId("import-execute-button").click();

  await expect(page.getByTestId("import-result-panel")).toBeVisible({ timeout: 60_000 });
}

test.describe("csv contact import", () => {
  test.describe("manager flow", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("manager can import contacts through the wizard", async ({ page }) => {
      await loginAs(page, "manager");
      await runImportWizard(page);

      await expect(page.getByTestId("import-result-created")).toHaveText("3");
      await expect(page.getByTestId("import-result-skipped")).toHaveText("2");
      await expect(page.getByTestId("import-result-failed")).toHaveText("1");

      await page.getByTestId("import-result-back-button").click();
      await expect(page).toHaveURL(/\/contacts\?status=LEAD/);
    });
  });

  test("operator is redirected away from import route", async ({ page }) => {
    await page.goto("/contacts/import");
    await expect(page).toHaveURL(/\/contacts(?:\/)?$/);
    await expect(page.getByTestId("contacts-import-page")).toHaveCount(0);
  });

  test("import link is hidden for operator on contacts list", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByTestId("contacts-page")).toBeVisible();
    await expect(page.getByTestId("contacts-import-link")).toHaveCount(0);
  });
});
