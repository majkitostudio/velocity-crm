import { expect, test } from "@playwright/test";

import { loginAs } from "../helpers/auth";
import { seedUsers } from "../fixtures/seed-users";

test.describe.configure({ mode: "serial" });

for (const roleKey of Object.keys(seedUsers) as (keyof typeof seedUsers)[]) {
  test(`seeded ${roleKey} can sign in`, async ({ page }) => {
    await loginAs(page, roleKey);

    await expect(page.getByTestId("operator-dashboard")).toBeVisible();
  });
}
