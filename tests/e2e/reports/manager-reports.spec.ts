import { expect, test } from "@playwright/test";

import { loginAs } from "../helpers/auth";

test.describe("manager reports", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("manager can open reporting dashboard with seeded metrics", async ({ page }) => {
    await loginAs(page, "manager");

    await expect(page.getByTestId("crm-nav-reports")).toBeVisible();
    await page.getByTestId("crm-nav-reports").click();

    await page.waitForURL(/\/reports(?:\?.*)?$/, {
      timeout: 30_000,
      waitUntil: "commit",
    });

    await expect(page.getByTestId("reports-dashboard")).toBeVisible();
    await expect(page.getByTestId("reports-operators-table")).toBeVisible();
  });

  test("manager can switch reporting period", async ({ page }) => {
    await loginAs(page, "manager");
    await page.goto("/reports");

    await expect(page.getByTestId("reports-period-30d")).toHaveAttribute("aria-current", "page");

    await page.getByTestId("reports-period-7d").click();
    await page.waitForURL(/period=7d/, { waitUntil: "commit" });
    await expect(page.getByTestId("reports-period-7d")).toHaveAttribute("aria-current", "page");
  });
});

test.describe("operator reports access", () => {
  test("operator does not see reports navigation", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByTestId("operator-dashboard")).toBeVisible();
    await expect(page.getByTestId("crm-nav-reports")).toHaveCount(0);
  });
});
