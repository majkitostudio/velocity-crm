import { expect, test } from "@playwright/test";

import { waitForContactDetail } from "../helpers/auth";

const seedContactPath = "/contacts/seed-contact-lead-high";

test.describe("Contact AI Summary", () => {
  test("operator can generate summary and see cache badge on second run", async ({ page }) => {
    await page.goto(seedContactPath);
    await waitForContactDetail(page);

    const panel = page.getByTestId("contact-ai-summary-panel");
    await expect(panel).toBeVisible();
    await expect(page.getByTestId("contact-ai-summary-empty")).toBeVisible();

    const generateButton = page.getByTestId("contact-ai-summary-generate-button");
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    await expect(page.getByTestId("contact-ai-summary-loading")).toBeVisible();
    await expect(page.getByTestId("contact-ai-summary-success")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("contact-ai-summary-text")).not.toBeEmpty();
    await expect(page.getByTestId("contact-ai-summary-source-badge")).toHaveText("LIVE");

    await generateButton.click();
    await expect(page.getByTestId("contact-ai-summary-success")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("contact-ai-summary-source-badge")).toHaveText("CACHE");
  });
});
