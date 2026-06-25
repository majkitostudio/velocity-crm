import { expect, test } from "@playwright/test";

import { waitForContactDetail } from "../helpers/auth";

const seedContactPath = "/contacts/seed-contact-lead-high";

test.describe("Contact AI Summary", () => {
  test("operator can generate, read cache, refresh live, and cache again after reload", async ({
    page,
  }) => {
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

    await page.reload();
    await waitForContactDetail(page);
    await expect(page.getByTestId("contact-ai-summary-empty")).toBeVisible();

    await page.getByTestId("contact-ai-summary-generate-button").click();
    await expect(page.getByTestId("contact-ai-summary-success")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("contact-ai-summary-source-badge")).toHaveText("CACHE");

    const refreshButton = page.getByTestId("contact-ai-summary-refresh-button");
    await expect(refreshButton).toBeVisible();
    await expect(refreshButton).toBeEnabled();
    await refreshButton.click();

    await expect(page.getByTestId("contact-ai-summary-success")).toBeVisible();
    await expect(page.getByTestId("contact-ai-summary-refresh-spinner")).toBeVisible();
    await expect(page.getByTestId("contact-ai-summary-success")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("contact-ai-summary-source-badge")).toHaveText("LIVE");

    await page.reload();
    await waitForContactDetail(page);
    await expect(page.getByTestId("contact-ai-summary-empty")).toBeVisible();

    await page.getByTestId("contact-ai-summary-generate-button").click();
    await expect(page.getByTestId("contact-ai-summary-success")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("contact-ai-summary-source-badge")).toHaveText("CACHE");
  });
});
