import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import "dotenv/config";

import { TENANT_ISOLATION_SEED } from "../../prisma/fixtures/tenant-isolation";
import { buildContactAiContextForTenant } from "../../src/features/ai/context/contact-ai-context.builder";
import { NotFoundError } from "../../src/domain/errors";

const SEED_COMPANY_ID = "seed-company-velocity";
const SEED_CUSTOMER_CONTACT_ID = "seed-contact-customer";

const WRAPPER_GOLDEN_OPTIONS = {
  includeMetadata: false,
  limits: {
    activity: 10,
    orders: 5,
    notes: 5,
    recentClosedCallbacks: 2,
  },
} as const;

const WRAPPER_GOLDEN_PATH = join(
  import.meta.dirname,
  "fixtures",
  "contact-ai-context-wrapper-golden.json",
);

const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// The seed assigns a random user id and relative (daysAgo/now) timestamps, so
// these values change on every reseed. Normalize only those fields before
// comparing against the committed golden; every other value stays strictly
// asserted.
function normalizeDynamicSnapshotFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeDynamicSnapshotFields);
  }

  if (value !== null && typeof value === "object") {
    const normalized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      normalized[key] = normalizeDynamicSnapshotFields(entry);
    }
    return normalized;
  }

  if (typeof value === "string" && ISO_TIMESTAMP_PATTERN.test(value)) {
    return "<TIMESTAMP>";
  }

  return value;
}

async function assertWrapperMatchesCommittedGoldenSnapshot() {
  const actual = await buildContactAiContextForTenant({
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CUSTOMER_CONTACT_ID,
    options: WRAPPER_GOLDEN_OPTIONS,
  });

  const normalized = normalizeDynamicSnapshotFields(actual) as {
    contact?: { assignedUser?: { id?: string } | null };
  };
  if (normalized.contact?.assignedUser) {
    normalized.contact.assignedUser.id = "<USER_ID>";
  }

  const serialized = JSON.stringify(normalized);

  if (process.env.UPDATE_GOLDEN === "1") {
    writeFileSync(WRAPPER_GOLDEN_PATH, `${JSON.stringify(JSON.parse(serialized), null, 2)}\n`);
    console.log(`Updated wrapper golden snapshot: ${WRAPPER_GOLDEN_PATH}`);
    return;
  }

  if (!existsSync(WRAPPER_GOLDEN_PATH)) {
    throw new Error(
      `Missing wrapper golden snapshot at ${WRAPPER_GOLDEN_PATH}. ` +
        "Run with UPDATE_GOLDEN=1 against a seeded database to generate it.",
    );
  }

  const golden = readFileSync(WRAPPER_GOLDEN_PATH, "utf8");
  assert.equal(serialized, JSON.stringify(JSON.parse(golden)));
}

async function assertBuildsDeterministicContext() {
  const options = WRAPPER_GOLDEN_OPTIONS;

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
  await assertWrapperMatchesCommittedGoldenSnapshot();
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
