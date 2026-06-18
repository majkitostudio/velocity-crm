import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const SEED_COMPANY_NAME = "Velocity Call Center";
const SEED_ADMIN_EMAIL = "admin@velocity.local";
const SEED_ADMIN_PASSWORD = "changeme-admin";
const SEED_OPERATOR_EMAIL = "operator@velocity.local";
const SEED_OPERATOR_PASSWORD = "changeme-operator";

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "seed-company-velocity" },
    update: { name: SEED_COMPANY_NAME },
    create: {
      id: "seed-company-velocity",
      name: SEED_COMPANY_NAME,
    },
  });

  const adminHash = await hash(SEED_ADMIN_PASSWORD, 12);
  const operatorHash = await hash(SEED_OPERATOR_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: {
      companyId: company.id,
      name: "Admin",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
    create: {
      companyId: company.id,
      name: "Admin",
      email: SEED_ADMIN_EMAIL,
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: SEED_OPERATOR_EMAIL },
    update: {
      companyId: company.id,
      name: "Test Operator",
      passwordHash: operatorHash,
      role: UserRole.OPERATOR,
    },
    create: {
      companyId: company.id,
      name: "Test Operator",
      email: SEED_OPERATOR_EMAIL,
      passwordHash: operatorHash,
      role: UserRole.OPERATOR,
    },
  });

  console.log("Seed complete:");
  console.log(`  Company: ${company.name} (${company.id})`);
  console.log(`  Admin:   ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD}`);
  console.log(`  Operator: ${SEED_OPERATOR_EMAIL} / ${SEED_OPERATOR_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
