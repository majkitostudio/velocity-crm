import { expect, test } from "@playwright/test";

import { waitForContactDetail } from "../helpers/auth";

const scheduleContactPath = "/contacts/seed-contact-lead-high";

async function clearOpenCallbacksIfNeeded(page: import("@playwright/test").Page) {
  const openCallbackRow = page.getByTestId("contact-callback-row").first();

  if (!(await openCallbackRow.isVisible())) {
    return;
  }

  await page.getByTestId("callback-manage-button").first().click();
  await page.getByTestId("callback-cancel-submit").click();
  await expect(page.getByTestId("contact-callback-row")).toHaveCount(0);
}

test("operator can schedule a callback from contact detail", async ({ page }) => {
  await page.goto(scheduleContactPath);
  await waitForContactDetail(page);
  await clearOpenCallbacksIfNeeded(page);

  await expect(page.getByTestId("contact-callbacks-panel")).toBeVisible();
  await expect(page.getByTestId("callback-create-form")).toBeVisible();
  await expect(page.getByTestId("callback-scheduled-at-input")).toBeEnabled();

  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + 2);
  scheduledAt.setMinutes(0, 0, 0);
  const local = new Date(scheduledAt.getTime() - scheduledAt.getTimezoneOffset() * 60_000);
  const scheduledAtValue = local.toISOString().slice(0, 16);

  await page.getByTestId("callback-scheduled-at-input").fill(scheduledAtValue);
  await page.getByTestId("callback-note-input").fill("E2E test callback");
  await page.getByTestId("callback-create-submit").click();

  await expect(page.getByTestId("callback-create-success")).toBeVisible();
  await expect(page.getByTestId("contact-callback-row").first()).toBeVisible();
});

test("callbacks page links to contact detail with callback highlight", async ({ page }) => {
  await page.goto("/callbacks");
  await expect(page.getByTestId("callbacks-page")).toBeVisible();

  const firstCallback = page.getByTestId("callback-list-link").first();
  await expect(firstCallback).toBeVisible();
  await firstCallback.click();
  await waitForContactDetail(page);
  await expect(page.getByTestId("contact-callbacks-panel")).toBeVisible();
  await expect(page.getByTestId("contact-callback-row").first()).toBeVisible();
});
