import assert from "node:assert/strict";

import "dotenv/config";

import { TENANT_ISOLATION_SEED } from "../../prisma/fixtures/tenant-isolation";
import { buildContactAiContextForTenant } from "../../src/features/ai/context/contact-ai-context.builder";
import { NotFoundError } from "../../src/domain/errors";

const SEED_COMPANY_ID = "seed-company-velocity";
const SEED_CUSTOMER_CONTACT_ID = "seed-contact-customer";

async function assertBuildsDeterministicContext() {
  const options = {
    includeMetadata: false,
    limits: {
      activity: 10,
      orders: 5,
      notes: 5,
      recentClosedCallbacks: 2,
    },
  } as const;

  const first = await buildContactAiContextForTenant({
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CUSTOMER_CONTACT_ID,
    options,
  });

  const second = await buildContactAiContextForTenant({
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CUSTOMER_CONTACT_ID,
    options,
  });

  assert.equal(
    JSON.stringify(first),
    JSON.stringify(second),
    "identical inputs must produce identical AI context output",
  );

  assert.equal(first.schemaVersion, 1);
  assert.equal(first.contact.id, SEED_CUSTOMER_CONTACT_ID);
  assert.ok(first.history.activities.length >= 0);
  assert.ok(first.snapshot.products.catalog.length > 0);
  assert.equal(first.metadata, undefined);
  assert.ok(Object.isFrozen(first));
}

async function assertHistoryComesFromContactActivityOnly() {
  const context = await buildContactAiContextForTenant({
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CUSTOMER_CONTACT_ID,
    options: {
      sections: ["history"],
      includeStatistics: false,
    },
  });

  for (const activity of context.history.activities) {
    assert.ok(activity.id.length > 0);
    assert.ok(activity.kind.length > 0);
    assert.ok(activity.summary.length > 0);
    assert.equal(activity.payloadVersion, 1);
  }
}

async function assertTenantIsolation() {
  await assert.rejects(
    () =>
      buildContactAiContextForTenant({
        companyId: SEED_COMPANY_ID,
        contactId: TENANT_ISOLATION_SEED.otherContactId,
        options: {
          sections: ["contact"],
          includeStatistics: false,
          includeHistory: false,
        },
      }),
    NotFoundError,
  );
}

async function assertStatisticsFromProviderAggregates() {
  const context = await buildContactAiContextForTenant({
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CUSTOMER_CONTACT_ID,
    options: {
      sections: ["statistics"],
      includeHistory: false,
    },
  });

  assert.equal(context.snapshot.orders.recent.length, 0);
  assert.ok(context.statistics.totalOrders >= 0);
  assert.ok(context.statistics.totalCalls >= 0);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for integration tests.");
  }

  await assertBuildsDeterministicContext();
  await assertHistoryComesFromContactActivityOnly();
  await assertTenantIsolation();
  await assertStatisticsFromProviderAggregates();
  console.log("contact-ai-context: ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
