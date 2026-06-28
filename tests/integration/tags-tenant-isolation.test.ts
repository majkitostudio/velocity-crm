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

async function assertTagsTenantIsolation() {
  const foreignTags = await prisma.tag.count({
    where: {
      companyId: SEED_COMPANY_ID,
      id: {
        startsWith: "seed-tag-other",
      },
    },
  });

  assert.equal(foreignTags, 0, "primary tenant must not include other tenant tags");

  const crossTenantAssignments = await prisma.contactTag.count({
    where: {
      companyId: SEED_COMPANY_ID,
      contactId: TENANT_ISOLATION_SEED.otherContactId,
    },
  });

  assert.equal(
    crossTenantAssignments,
    0,
    "primary tenant must not include tag assignments for other tenant contacts",
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for integration tests.");
  }

  await assertTagsTenantIsolation();
  console.log("tags-tenant-isolation: ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
