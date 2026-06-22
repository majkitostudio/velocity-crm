import assert from "node:assert/strict";

import "dotenv/config";

import { TENANT_ISOLATION_SEED } from "../../prisma/fixtures/tenant-isolation";
import { buildContactContextForTenant } from "../../src/features/contacts/context/contact-context.builder";
import {
  CONTACT_DETAIL_SECTIONS,
  AI_FULL_SECTIONS,
} from "../../src/features/contacts/context/types/build-options";
import { resolveProvidersForSections } from "../../src/features/contacts/context/providers/provider-registry";
import { NotFoundError } from "../../src/domain/errors";

const SEED_COMPANY_ID = "seed-company-velocity";
const SEED_CUSTOMER_CONTACT_ID = "seed-contact-customer";

async function assertDetailPresetSkipsExpensiveSections() {
  const context = await buildContactContextForTenant({
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CUSTOMER_CONTACT_ID,
    options: {
      sections: [...CONTACT_DETAIL_SECTIONS],
      includeHistory: false,
      includeStatistics: false,
      limits: {
        notes: null,
      },
    },
  });

  const providers = resolveProvidersForSections(new Set(CONTACT_DETAIL_SECTIONS));
  const providerKeys = new Set(providers.map((provider) => provider.key));

  assert.equal(providerKeys.has("products"), false);
  assert.equal(providerKeys.has("orders"), false);
  assert.equal(providerKeys.has("activity"), false);
  assert.equal(context.snapshot.products.catalog.length, 0);
  assert.equal(context.snapshot.orders.recent.length, 0);
  assert.equal(context.history.activities.length, 0);
  assert.ok(context.contact.id === SEED_CUSTOMER_CONTACT_ID);
  assert.ok(Object.isFrozen(context));
}

async function assertFullPresetLoadsProducts() {
  const context = await buildContactContextForTenant({
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CUSTOMER_CONTACT_ID,
    options: {
      sections: [...AI_FULL_SECTIONS],
      includeMetadata: false,
    },
  });

  assert.ok(context.snapshot.products.catalog.length > 0);
}

async function assertTenantIsolation() {
  await assert.rejects(
    () =>
      buildContactContextForTenant({
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

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for integration tests.");
  }

  await assertDetailPresetSkipsExpensiveSections();
  await assertFullPresetLoadsProducts();
  await assertTenantIsolation();
  console.log("contact-context: ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
