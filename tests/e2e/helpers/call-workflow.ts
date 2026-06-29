import { expect, type Page } from "@playwright/test";

import { waitForContactDetail } from "./auth";

export type CallOutcomeTestId = "call_later" | "schedule_call" | "fail";

export function uniquePhoneSuffix(): string {
  return Date.now().toString().slice(-7);
}

export function toDatetimeLocalValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function defaultScheduledAt(hoursFromNow = 2): string {
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + hoursFromNow);
  scheduledAt.setMinutes(0, 0, 0);
  return toDatetimeLocalValue(scheduledAt);
}

export async function gotoContact(page: Page, contactPath: string) {
  await page.goto(contactPath);
  await waitForContactDetail(page);
  await expect(page.getByTestId("call-workflow-panel")).toBeVisible();
}

export async function clearOpenCallbacksIfNeeded(page: Page) {
  const openCallbackRow = page.getByTestId("contact-callback-row").first();

  if (!(await openCallbackRow.isVisible())) {
    return;
  }

  await page.getByTestId("callback-manage-button").first().click();
  await page.getByTestId("callback-cancel-submit").click();
  await expect(page.getByTestId("contact-callback-row")).toHaveCount(0);
}

export async function createOperatorLeadContact(page: Page) {
  const suffix = uniquePhoneSuffix();
  const contactName = `E2E Call Outcome ${suffix}`;
  const phone = `+420603${suffix.padStart(7, "0").slice(0, 7)}`;

  await page.goto("/contacts?status=LEAD");
  await page.getByTestId("create-contact-open-button").click();
  await page.getByTestId("create-contact-name-input").fill(contactName);
  await page.getByTestId("create-contact-phone-input").fill(phone);
  await page.getByTestId("create-contact-submit-button").click();
  await waitForContactDetail(page);

  return { contactName, phone };
}

export async function completeCallWithOutcome(
  page: Page,
  outcome: CallOutcomeTestId,
  options?: { scheduledAt?: string; failNote?: string },
) {
  await page.getByTestId("start-call-button").click();
  await page.getByTestId("end-call-button").click();
  await page.getByTestId(`outcome-${outcome}-button`).click();

  if (outcome === "schedule_call") {
    await page.getByLabel("Datum a čas").fill(options?.scheduledAt ?? defaultScheduledAt());
  }

  if (outcome === "fail" && options?.failNote) {
    await page.getByPlaceholder("Volitelná poznámka k hovoru…").fill(options.failNote);
  }

  await page.getByTestId("confirm-call-button").click();
  await expect(page.getByTestId("call-success-message")).toBeVisible();
}
