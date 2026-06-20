import { expect, test } from "@playwright/test";

import { waitForContactDetail } from "../helpers/auth";

function uniquePhoneSuffix(): string {
  return Date.now().toString().slice(-7);
}

test.describe("manual contact creation", () => {
  test("operator can create a contact and return to filtered list", async ({ page }) => {
    const suffix = uniquePhoneSuffix();
    const contactName = `E2E Nový kontakt ${suffix}`;
    const phone = `+420601${suffix.padStart(7, "0").slice(0, 7)}`;

    await page.goto("/contacts?status=LEAD");
    await expect(page.getByTestId("contacts-page")).toBeVisible();

    await page.getByTestId("create-contact-open-button").click();
    await expect(page.getByTestId("create-contact-dialog")).toBeVisible();

    await page.getByTestId("create-contact-name-input").fill(contactName);
    await page.getByTestId("create-contact-phone-input").fill(phone);
    await page.getByTestId("create-contact-submit-button").click();

    await waitForContactDetail(page);
    await expect(page).toHaveURL(/created=1/);
    await expect(page.getByTestId("contact-created-message")).toBeVisible();
    await expect(page.getByTestId("contact-phone")).toHaveText(phone);

    await page.getByTestId("breadcrumb").getByRole("link", { name: "Kontakty" }).click();
    await expect(page).toHaveURL(/\/contacts\?status=LEAD/);
    await expect(
      page.getByTestId("contact-list-link").filter({ hasText: contactName }),
    ).toBeVisible();
  });

  test("shows duplicate error when phone already exists", async ({ page }) => {
    await page.goto("/contacts");
    await page.getByTestId("create-contact-open-button").click();

    await page.getByTestId("create-contact-name-input").fill("Duplicitní kontakt");
    await page.getByTestId("create-contact-phone-input").fill("+420601100001");
    await page.getByTestId("create-contact-submit-button").click();

    await expect(page.getByTestId("create-contact-error")).toBeVisible();
    await expect(page.getByTestId("create-contact-error")).toContainText(
      "stejným telefonem",
    );
    await expect(page.getByTestId("create-contact-dialog")).toBeVisible();
  });
});
