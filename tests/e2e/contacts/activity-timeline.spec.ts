import { expect, test } from "@playwright/test";

import { waitForContactDetail } from "../helpers/auth";

function uniquePhoneSuffix(): string {
  return Date.now().toString().slice(-7);
}

test.describe("contact activity timeline", () => {
  test("manual contact creation records CONTACT_CREATED activity", async ({ page }) => {
    const suffix = uniquePhoneSuffix();
    const contactName = `E2E Timeline ${suffix}`;
    const phone = `+420602${suffix.padStart(7, "0").slice(0, 7)}`;

    await page.goto("/contacts?status=LEAD");
    await page.getByTestId("create-contact-open-button").click();
    await page.getByTestId("create-contact-name-input").fill(contactName);
    await page.getByTestId("create-contact-phone-input").fill(phone);
    await page.getByTestId("create-contact-submit-button").click();

    await waitForContactDetail(page);
    await expect(page.getByTestId("activity-timeline")).toBeVisible();
    await expect(page.getByTestId("activity-contact_created-item").first()).toBeVisible();
    await expect(page.getByTestId("activity-item-summary").first()).toContainText(
      "Kontakt vytvořen",
    );
  });

  test("adding a note records NOTE_CREATED activity", async ({ page }) => {
    const noteBody = `E2E note ${Date.now()}`;

    await page.goto("/contacts/seed-contact-lead-high");
    await waitForContactDetail(page);

    await page.locator("#note-body").fill(noteBody);
    await page.getByRole("button", { name: "Save note" }).click();
    await expect(page.getByText("Note saved.")).toBeVisible();

    await expect(page.getByTestId("activity-timeline")).toBeVisible();
    await expect(page.getByTestId("activity-note_created-item").first()).toBeVisible();
    await expect(page.getByTestId("activity-item-summary").first()).toContainText("Poznámka");
  });

  test("activity filters update the timeline query", async ({ page }) => {
    await page.goto("/contacts/seed-contact-lead-high");
    await waitForContactDetail(page);

    await page.getByTestId("activity-filter-notes").click();
    await expect(page).toHaveURL(/activity=notes/);
    await expect(page.getByTestId("activity-filters")).toBeVisible();

    await page.getByTestId("activity-period-7d").click();
    await expect(page).toHaveURL(/activityPeriod=7d/);
  });
});
