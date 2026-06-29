import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { loginAs, waitForContactDetail } from "../helpers/auth";

function uniqueImportSuffix(): string {
  return Date.now().toString().slice(-7);
}

function buildImportCsv(suffix: string): {
  filePath: string;
  lead1Name: string;
  lead2Name: string;
} {
  const phone1 = `+420601${suffix.padStart(7, "0").slice(0, 7)}`;
  const phone2 = `+420601${String(Number(suffix) + 1).padStart(7, "0").slice(-7)}`;
  const dupInFilePhone = `+420601${String(Number(suffix) + 2).padStart(7, "0").slice(-7)}`;
  const lead1Name = `E2E Import Lead 1 ${suffix}`;
  const lead2Name = `E2E Import Lead 2 ${suffix}`;

  const content = [
    "name,phone,email",
    `${lead1Name},${phone1},import1-${suffix}@velocity.local`,
    `${lead2Name},${phone2},import2-${suffix}@velocity.local`,
    "Duplicate Seed,+420601100001,duplicate@velocity.local",
    `Dup In File A,${dupInFilePhone},dupA-${suffix}@velocity.local`,
    `Dup In File B,${dupInFilePhone},dupB-${suffix}@velocity.local`,
    "Invalid Phone,not-a-phone,invalid@velocity.local",
  ].join("\n");

  const filePath = path.join(os.tmpdir(), `import-leads-${suffix}.csv`);
  fs.writeFileSync(filePath, content, "utf8");

  return { filePath, lead1Name, lead2Name };
}

async function runImportWizard(
  page: import("@playwright/test").Page,
  importFilePath: string,
) {
  await page.goto("/contacts/import?returnTo=%2Fcontacts%3Fstatus%3DLEAD");
  await expect(page.getByTestId("contacts-import-page")).toBeVisible();

  await page.getByTestId("import-upload-input").setInputFiles(importFilePath);
  await expect(page.getByTestId("import-mapping-form")).toBeVisible({ timeout: 30_000 });

  await page.getByTestId("import-mapping-continue-button").click();
  await expect(page.getByTestId("import-preview-summary")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("import-preview-summary")).toHaveText(/3 připraveno/);

  const continueButton = page.getByTestId("import-preview-continue-button");
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
  await expect(page.getByTestId("import-confirm-checkbox")).toBeVisible();

  await page.getByTestId("import-confirm-checkbox").check();
  await page.getByTestId("import-execute-button").click();

  await expect(page.getByTestId("import-result-panel")).toBeVisible({ timeout: 60_000 });
}

async function runTaggedImportWizard(
  page: import("@playwright/test").Page,
  importFilePath: string,
) {
  await page.goto("/contacts/import?returnTo=%2Fcontacts%3Fstatus%3DLEAD");
  await expect(page.getByTestId("contacts-import-page")).toBeVisible();

  await page.getByTestId("import-upload-input").setInputFiles(importFilePath);
  await expect(page.getByTestId("import-mapping-form")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("import-mapping-tags")).toHaveValue("tags");

  await page.getByTestId("import-mapping-continue-button").click();
  await expect(page.getByTestId("import-preview-summary")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("import-preview-ready")).toContainText("VIP");

  const continueButton = page.getByTestId("import-preview-continue-button");
  await continueButton.click();
  await expect(page.getByTestId("import-confirm-checkbox")).toBeVisible();

  await page.getByTestId("import-confirm-checkbox").check();
  await page.getByTestId("import-execute-button").click();

  await expect(page.getByTestId("import-result-panel")).toBeVisible({ timeout: 60_000 });
}

function buildTaggedImportCsv(suffix: string): {
  filePath: string;
  leadName: string;
  tagName: string;
} {
  const phone = `+420604${suffix.padStart(7, "0").slice(0, 7)}`;
  const leadName = `E2E Tagged Lead ${suffix}`;
  const tagName = `E2E Import Tag ${suffix}`;

  const content = [
    "name,phone,tags",
    `${leadName},${phone},"${tagName};VIP"`,
  ].join("\n");

  const filePath = path.join(os.tmpdir(), `import-tags-${suffix}.csv`);
  fs.writeFileSync(filePath, content, "utf8");

  return { filePath, leadName, tagName };
}

test.describe("csv contact import", () => {
  test.describe("manager flow", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("manager can import contacts and open import batch filter", async ({ page }) => {
      const suffix = uniqueImportSuffix();
      const { filePath, lead1Name } = buildImportCsv(suffix);

      await loginAs(page, "manager");
      await runImportWizard(page, filePath);

      await expect(page.getByTestId("import-result-created")).toHaveText("3");
      await expect(page.getByTestId("import-result-skipped")).toHaveText("2");
      await expect(page.getByTestId("import-result-failed")).toHaveText("1");
      await expect(page.getByTestId("import-result-file-name")).toContainText(`import-leads-${suffix}.csv`);
      await expect(page.getByTestId("import-result-assignee")).toHaveText("Nepřiřazeno");

      await page.getByTestId("import-result-view-contacts-button").click();
      await expect(page).toHaveURL(/importBatch=/);
      await expect(page.getByTestId("contacts-import-batch-banner")).toBeVisible();
      await expect(page.getByTestId("contacts-list")).toBeVisible();
      await expect(page.getByTestId("contact-list-link")).toHaveCount(3);
      await expect(
        page.getByTestId("contact-list-link").filter({ hasText: lead1Name }),
      ).toBeVisible();
    });

    test("manager can import contacts with tags from csv", async ({ page }) => {
      const suffix = uniqueImportSuffix();
      const { filePath, leadName, tagName } = buildTaggedImportCsv(suffix);

      await loginAs(page, "manager");
      await runTaggedImportWizard(page, filePath);

      await expect(page.getByTestId("import-result-created")).toHaveText("1");

      await page.getByTestId("import-result-view-contacts-button").click();
      await expect(page.getByTestId("contacts-list")).toBeVisible();
      await page.getByTestId("contact-list-link").filter({ hasText: leadName }).click();
      await waitForContactDetail(page);

      await expect(page.getByTestId("contact-tags-list")).toContainText(tagName);
      await expect(page.getByTestId("contact-tags-list")).toContainText("VIP");
      await expect(page.getByTestId("activity-contact_tag_added-item").first()).toBeVisible();

      await page.goto("/contacts");
      await page.getByText(tagName).click();
      await expect(page.getByTestId("contact-list-link")).toHaveCount(1);
      await expect(page.getByTestId("contact-list-link")).toContainText(leadName);
    });

    test("shows empty state for unknown import batch", async ({ page }) => {
      await loginAs(page, "manager");
      await page.goto("/contacts?importBatch=missing-batch-id");

      await expect(page.getByTestId("contacts-import-batch-banner")).toBeVisible();
      await expect(page.getByTestId("contacts-import-batch-not-found-empty")).toBeVisible();
      await expect(page.getByTestId("contacts-empty-action")).toBeVisible();
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
