import { expect, test } from "@playwright/test";

import {
  clearOpenCallbacksIfNeeded,
  completeCallWithOutcome,
  createOperatorLeadContact,
  defaultScheduledAt,
  gotoContact,
} from "../helpers/call-workflow";

const LEAD_HIGH_PATH = "/contacts/seed-contact-lead-high";

test.describe("call workflow outcomes", () => {
  test("operator can complete CALL_LATER and create a callback", async ({ page }) => {
    await gotoContact(page, LEAD_HIGH_PATH);
    await clearOpenCallbacksIfNeeded(page);

    const callbackCountBefore = await page.getByTestId("contact-callback-row").count();

    await completeCallWithOutcome(page, "call_later");

    await expect(page.getByTestId("activity-timeline")).toBeVisible();
    await expect(page.getByTestId("activity-call_finished-item").first()).toBeVisible();
    await expect(page.getByTestId("activity-callback_created-item").first()).toBeVisible();
    await expect(page.getByTestId("contact-callback-row")).toHaveCount(callbackCountBefore + 1);
  });

  test("operator can complete SCHEDULE_CALL with a planned callback", async ({ page }) => {
    await gotoContact(page, LEAD_HIGH_PATH);
    await clearOpenCallbacksIfNeeded(page);

    const scheduledAt = defaultScheduledAt(3);

    await completeCallWithOutcome(page, "schedule_call", { scheduledAt });

    await expect(page.getByTestId("activity-call_finished-item").first()).toBeVisible();
    await expect(page.getByTestId("activity-callback_created-item").first()).toBeVisible();
    await expect(page.getByTestId("contact-callback-row").first()).toBeVisible();
  });

  test("operator can complete FAIL without reaching lost threshold", async ({ page }) => {
    await createOperatorLeadContact(page);

    await completeCallWithOutcome(page, "fail", {
      failNote: "E2E single fail attempt",
    });

    await expect(page.getByTestId("contact-detail-page").getByText("Lead", { exact: true })).toBeVisible();
    await expect(page.getByTestId("activity-call_finished-item").first()).toBeVisible();
    await expect(page.getByText("Tento pokus označí kontakt jako ztracený")).toHaveCount(0);
  });

  test("operator FAIL at threshold marks contact as lost", async ({ page }) => {
    await createOperatorLeadContact(page);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await page.getByTestId("start-call-button").click();
      await page.getByTestId("end-call-button").click();
      await page.getByTestId("outcome-fail-button").click();

      if (attempt === 3) {
        await expect(
          page.getByText("Tento pokus označí kontakt jako ztracený"),
        ).toBeVisible();
      }

      await page.getByTestId("confirm-call-button").click();
      await expect(page.getByTestId("call-success-message")).toBeVisible();
    }

    await expect(page.getByTestId("contact-detail-page").getByText("Lost", { exact: true })).toBeVisible();
    await expect(page.getByTestId("activity-contact_status_changed-item").first()).toBeVisible();
  });
});
