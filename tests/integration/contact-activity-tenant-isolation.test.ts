import assert from "node:assert/strict";

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { TENANT_ISOLATION_SEED } from "../../prisma/fixtures/tenant-isolation";
import { PrismaClient } from "../../src/generated/prisma/client";

const SEED_COMPANY_ID = "seed-company-velocity";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function assertTimelineTenantIsolation() {
  const foreignContactActivities = await prisma.contactActivity.findMany({
    where: {
      companyId: SEED_COMPANY_ID,
      contactId: TENANT_ISOLATION_SEED.otherContactId,
    },
    select: { id: true },
  });

  assert.equal(
    foreignContactActivities.length,
    0,
    "primary tenant must not read other tenant activities by foreign contactId",
  );

  const ownTenantActivities = await prisma.contactActivity.findMany({
    where: {
      companyId: TENANT_ISOLATION_SEED.otherCompanyId,
      contactId: TENANT_ISOLATION_SEED.otherContactId,
    },
    select: { id: true },
  });

  assert.ok(
    ownTenantActivities.length > 0,
    "other tenant seed must include at least one ContactActivity row",
  );

  const foreignContact = await prisma.contact.findFirst({
    where: {
      id: TENANT_ISOLATION_SEED.otherContactId,
      companyId: SEED_COMPANY_ID,
    },
    select: { id: true },
  });

  assert.equal(
    foreignContact,
    null,
    "other tenant contact must not be visible under primary companyId",
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for integration tests.");
  }

  await assertTimelineTenantIsolation();
  console.log("contact-activity tenant isolation: ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
