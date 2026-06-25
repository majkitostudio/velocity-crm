import { expect, test } from "@playwright/test";

import { waitForContactDetail } from "../helpers/auth";

const seedContactPath = "/contacts/seed-contact-lead-high";

test.describe("Contact AI Recommendation flag disabled", () => {
  test("recommendation panel is hidden when ai.recommendation is disabled", async ({ page }) => {
    await page.goto(seedContactPath);
    await waitForContactDetail(page);

    await expect(page.getByTestId("contact-ai-workspace")).toBeVisible();
    await expect(page.getByTestId("contact-ai-recommendation-panel")).toHaveCount(0);
  });
});
