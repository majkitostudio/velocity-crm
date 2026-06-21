import { expect, test } from "@playwright/test";

import { waitForContactDetail } from "../helpers/auth";

test("operator can complete the main order workflow", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByTestId("operator-dashboard")).toBeVisible();
  await expect(page.getByTestId("operator-queue")).toBeVisible();

  await page.getByTestId("queue-item-link").first().click();
  await waitForContactDetail(page);
  await expect(page.getByTestId("call-workflow-panel")).toBeVisible();
  await expect(page.getByTestId("activity-feed")).toBeVisible();
  await expect(page.getByTestId("activity-empty-state")).toBeVisible();

  await page.getByTestId("start-call-button").click();
  await page.getByTestId("end-call-button").click();
  await page.getByTestId("outcome-order-button").click();

  await expect(page.getByTestId("order-form")).toBeVisible();
  await expect(page.getByTestId("order-product-select").first()).toBeVisible();
  await page.getByTestId("order-quantity-input").first().fill("1");

  await page.getByTestId("confirm-call-button").click();

  await expect(page.getByTestId("call-success-message")).toBeVisible();
  await expect(page.getByTestId("activity-timeline")).toBeVisible();
  await expect(page.getByTestId("activity-call_finished-item").first()).toBeVisible();

  await page.getByTestId("back-to-queue-link").click();
  await expect(page.getByTestId("operator-dashboard")).toBeVisible();
});
