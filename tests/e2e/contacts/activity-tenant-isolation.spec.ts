import { expect, test } from "@playwright/test";

import { TENANT_ISOLATION_SEED } from "../../../prisma/fixtures/tenant-isolation";

test.describe("contact activity tenant isolation", () => {
  test("operator cannot open another tenant contact detail", async ({ page }) => {
    await page.goto(`/contacts/${TENANT_ISOLATION_SEED.otherContactId}`);

    await expect(page.getByRole("heading", { name: "Contact not found" })).toBeVisible();
    await expect(page.getByTestId("contact-detail-page")).toHaveCount(0);
  });

  test("operator cannot read another tenant activity timeline", async ({ page }) => {
    await page.goto(
      `/contacts/${TENANT_ISOLATION_SEED.otherContactId}?activity=calls&activityPeriod=30d`,
    );

    await expect(page.getByRole("heading", { name: "Contact not found" })).toBeVisible();
    await expect(page.getByTestId("activity-feed")).toHaveCount(0);
  });
});
