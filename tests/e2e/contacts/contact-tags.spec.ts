import { expect, test } from "@playwright/test";

import { loginAs } from "../helpers/auth";
import { waitForContactDetail } from "../helpers/auth";

test.describe("contact tags", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("manager assigns and filters contacts by tag", async ({ page }) => {
    await loginAs(page, "manager");

    await page.goto("/contacts/seed-contact-lead-normal");
    await waitForContactDetail(page);

    await expect(page.getByTestId("contact-tags-panel")).toBeVisible();
    await page.getByTestId("contact-tag-create-input").fill("E2E Test Tag");
    await page.getByTestId("contact-tag-create-submit").click();

    await expect(page.getByTestId("contact-tags-list")).toContainText("E2E Test Tag", {
      timeout: 15_000,
    });

    await page.goto("/contacts");
    await expect(page.getByTestId("contacts-page")).toBeVisible();
    await expect(page.getByText("E2E Test Tag")).toBeVisible();
    await page.getByText("E2E Test Tag").click();

    await expect(page.getByTestId("contacts-page")).toBeVisible();
    await expect(page.getByTestId("contact-list-link")).toHaveCount(1);
    await expect(page.getByTestId("contact-list-link")).toContainText("Petr Svoboda");
  });
});
