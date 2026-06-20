import { expect, test } from "@playwright/test";

import { loginAs } from "../helpers/auth";

test("operator can schedule a callback from contact detail", async ({ page }) => {
  await loginAs(page, "operator");

  await page.goto("/dashboard");
  await page.getByTestId("queue-leads-list").getByTestId("queue-item-link").first().click();

  await expect(page.getByTestId("contact-callbacks-panel")).toBeVisible();

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
  await loginAs(page, "operator");

  await page.goto("/callbacks");
  await expect(page.getByTestId("callbacks-page")).toBeVisible();

  const firstCallback = page.getByTestId("callback-list-link").first();
  await expect(firstCallback).toBeVisible();
  await firstCallback.click();

  await expect(page.getByTestId("contact-detail-page")).toBeVisible();
  await expect(page.getByTestId("contact-callbacks-panel")).toBeVisible();
  await expect(page.getByTestId("contact-callback-row").first()).toBeVisible();
});
