import assert from "node:assert/strict";

import { buildContactSummaryExecuteInput } from "../../src/features/ai/lib/build-contact-summary-execute-input";

async function assertBuildsExecuteInput() {
  const input = buildContactSummaryExecuteInput(
    {
      id: "user-1",
      companyId: "company-1",
      role: "OPERATOR",
      email: "operator@example.com",
      name: "Operator",
    },
    "contact-1",
  );

  assert.deepEqual(input, {
    companyId: "company-1",
    userId: "user-1",
    userRole: "OPERATOR",
    contactId: "contact-1",
    locale: "cs",
    force: undefined,
  });
}

async function assertSupportsForceAndLocale() {
  const input = buildContactSummaryExecuteInput(
    {
      id: "user-1",
      companyId: "company-1",
      role: "MANAGER",
    },
    "contact-2",
    { locale: "en", force: true },
  );

  assert.equal(input.locale, "en");
  assert.equal(input.force, true);
  assert.equal(input.userRole, "MANAGER");
}

async function main() {
  await assertBuildsExecuteInput();
  await assertSupportsForceAndLocale();
  console.log("generate-contact-summary-action: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
