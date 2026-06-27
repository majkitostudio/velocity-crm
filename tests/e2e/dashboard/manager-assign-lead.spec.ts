import { expect, test } from "@playwright/test";

import { loginAs, logout } from "../helpers/auth";

function uniquePhoneSuffix(): string {
  return Date.now().toString().slice(-7);
}

test.describe("manager lead assignment", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("manager assigns unassigned lead to operator from dashboard", async ({ page }) => {
    const suffix = uniquePhoneSuffix();
    const contactName = `E2E Assign Lead ${suffix}`;
    const phone = `+420602${suffix.padStart(7, "0").slice(0, 7)}`;

    await loginAs(page, "manager");

    await page.goto("/contacts");
    await expect(page.getByTestId("contacts-page")).toBeVisible();
    await page.getByTestId("create-contact-open-button").click();
    await page.getByTestId("create-contact-name-input").fill(contactName);
    await page.getByTestId("create-contact-phone-input").fill(phone);
    await expect(page.getByTestId("create-contact-assignee-select")).toBeVisible();
    await page.getByTestId("create-contact-assignee-select").selectOption("");
    await page.getByTestId("create-contact-submit-button").click();
    await page.waitForURL(/\/contacts\//, { timeout: 30_000, waitUntil: "commit" });

    await page.goto("/dashboard");
    await expect(page.getByTestId("operator-dashboard")).toBeVisible();
    await expect(page.getByTestId("manager-unassigned-leads-panel")).toBeVisible();

    const leadRow = page
      .getByTestId("unassigned-lead-row")
      .filter({ hasText: contactName });
    await expect(leadRow).toBeVisible();
    await leadRow.scrollIntoViewIfNeeded();

    await leadRow
      .getByTestId("unassigned-lead-operator-select")
      .selectOption({ label: "Test Operator" });
    await leadRow.getByTestId("unassigned-lead-assign-submit").click();

    await expect(leadRow).toHaveCount(0, { timeout: 15_000 });

    await logout(page);
    await loginAs(page, "operator");

    await page.goto("/dashboard");
    await expect(page.getByTestId("operator-dashboard")).toBeVisible();
    await expect(page.getByTestId("queue-leads-list")).toBeVisible();
    await expect(
      page.getByTestId("queue-item-link").filter({ hasText: contactName }),
    ).toBeVisible();
  });

  test("operator does not see manager unassigned leads panel", async ({ page }) => {
    await loginAs(page, "operator");

    await page.goto("/dashboard");
    await expect(page.getByTestId("operator-dashboard")).toBeVisible();
    await expect(page.getByTestId("manager-unassigned-leads-panel")).toHaveCount(0);
  });
});
