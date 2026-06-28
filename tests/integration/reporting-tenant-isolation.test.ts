import assert from "node:assert/strict";

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { TENANT_ISOLATION_SEED } from "../../prisma/fixtures/tenant-isolation";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const SEED_COMPANY_ID = "seed-company-velocity";

async function assertReportingTenantIsolation() {
  const foreignCalls = await prisma.callActivity.count({
    where: {
      companyId: SEED_COMPANY_ID,
      contactId: TENANT_ISOLATION_SEED.otherContactId,
    },
  });

  assert.equal(
    foreignCalls,
    0,
    "primary tenant reporting must not include calls for other tenant contacts",
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for integration tests.");
  }

  await assertReportingTenantIsolation();
  console.log("reporting-tenant-isolation: ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
