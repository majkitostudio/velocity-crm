import { expect, test } from "@playwright/test";

import { loginAs } from "../helpers/auth";

test.describe("operator contacts list", () => {
  test("operator sees only assigned contacts", async ({ page }) => {
    await page.goto("/contacts");

    await expect(page.getByTestId("contacts-page")).toBeVisible();
    await expect(page.getByTestId("contacts-list")).toBeVisible();
    await expect(page.getByTestId("contact-list-link").first()).toBeVisible();

    await expect(
      page.getByTestId("contact-list-link").filter({ hasText: "Anna Nováková" }),
    ).toBeVisible();
    await expect(page.getByText("Tomáš Horák")).toHaveCount(0);
    await expect(page.getByTestId("contacts-operator-filter-all")).toHaveCount(0);
  });

  test("operator can search contacts with Enter", async ({ page }) => {
    await page.goto("/contacts");

    await page.getByTestId("contacts-search-input").fill("Petr Svoboda");
    await page.getByTestId("contacts-search-submit").click();

    await expect(page).toHaveURL(/q=Petr/);
    await expect(
      page.getByTestId("contact-list-link").filter({ hasText: "Petr Svoboda" }),
    ).toBeVisible();
    await expect(page.getByTestId("contact-list-link")).toHaveCount(1);
  });
});

test.describe("manager contacts list", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("manager can filter contacts by status", async ({ page }) => {
    await loginAs(page, "manager");
    await page.goto("/contacts");

    await expect(page.getByTestId("contacts-page")).toBeVisible();
    await expect(page.getByTestId("contacts-operator-filter-all")).toBeVisible();

    const allLinks = page.getByTestId("contact-list-link");
    const allCount = await allLinks.count();
    expect(allCount).toBeGreaterThan(0);

    await page.getByTestId("contacts-status-filter-lost").click();
    await expect(page).toHaveURL(/status=LOST/);

    await expect(page.getByTestId("contact-list-link").first()).toBeVisible();
    const lostCount = await page.getByTestId("contact-list-link").count();
    expect(lostCount).toBeGreaterThan(0);
    expect(lostCount).toBeLessThan(allCount);

    await expect(
      page.getByTestId("contact-list-link").filter({ hasText: "Klára Veselá" }),
    ).toBeVisible();
  });
});
