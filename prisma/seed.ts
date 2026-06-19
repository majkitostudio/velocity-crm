import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import {
  CallOutcome,
  CallbackStatus,
  ContactPriority,
  ContactSource,
  ContactStatus,
  PrismaClient,
  UserRole,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const SEED_COMPANY_ID = "seed-company-velocity";
const SEED_COMPANY_NAME = "Velocity Call Center";

const SEED_ADMIN_EMAIL = "admin@velocity.local";
const SEED_ADMIN_PASSWORD = "changeme-admin";
const SEED_MANAGER_EMAIL = "manager@velocity.local";
const SEED_MANAGER_PASSWORD = "changeme-manager";
const SEED_OPERATOR_EMAIL = "operator@velocity.local";
const SEED_OPERATOR_PASSWORD = "changeme-operator";

const SEED_CONTACT_IDS = {
  leadHigh: "seed-contact-lead-high",
  leadNormal: "seed-contact-lead-normal",
  withCallback: "seed-contact-with-callback",
  customer: "seed-contact-customer",
  lost: "seed-contact-lost",
  unassigned: "seed-contact-unassigned",
} as const;

const SEED_CALLBACK_DUE_ID = "seed-callback-due";

const SEED_CALL_IDS = {
  failOne: "seed-call-fail-1",
  failTwo: "seed-call-fail-2",
  callLater: "seed-call-call-later",
  scheduleCall: "seed-call-schedule-call",
} as const;

const SEED_NOTE_IDS = {
  leadHigh: "seed-note-lead-high",
  withCallback: "seed-note-with-callback",
} as const;

function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function upsertUser(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyId: string;
}) {
  const passwordHash = await hash(input.password, 12);

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      companyId: input.companyId,
      name: input.name,
      passwordHash,
      role: input.role,
    },
    create: {
      companyId: input.companyId,
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
  });
}

async function upsertContact(input: {
  id: string;
  companyId: string;
  assignedUserId: string | null;
  status: ContactStatus;
  source: ContactSource;
  priority: ContactPriority;
  name: string;
  phone: string;
  email: string;
  createdAt?: Date;
}) {
  return prisma.contact.upsert({
    where: { id: input.id },
    update: {
      companyId: input.companyId,
      assignedUserId: input.assignedUserId,
      status: input.status,
      source: input.source,
      priority: input.priority,
      name: input.name,
      phone: input.phone,
      email: input.email,
      createdAt: input.createdAt,
    },
    create: {
      id: input.id,
      companyId: input.companyId,
      assignedUserId: input.assignedUserId,
      status: input.status,
      source: input.source,
      priority: input.priority,
      name: input.name,
      phone: input.phone,
      email: input.email,
      createdAt: input.createdAt,
    },
  });
}

async function main() {
  const company = await prisma.company.upsert({
    where: { id: SEED_COMPANY_ID },
    update: { name: SEED_COMPANY_NAME },
    create: {
      id: SEED_COMPANY_ID,
      name: SEED_COMPANY_NAME,
    },
  });

  const [admin, manager, operator] = await Promise.all([
    upsertUser({
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      name: "Admin",
      role: UserRole.ADMIN,
      companyId: company.id,
    }),
    upsertUser({
      email: SEED_MANAGER_EMAIL,
      password: SEED_MANAGER_PASSWORD,
      name: "Test Manager",
      role: UserRole.MANAGER,
      companyId: company.id,
    }),
    upsertUser({
      email: SEED_OPERATOR_EMAIL,
      password: SEED_OPERATOR_PASSWORD,
      name: "Test Operator",
      role: UserRole.OPERATOR,
      companyId: company.id,
    }),
  ]);

  const [leadHigh, leadNormal, withCallback] = await Promise.all([
      upsertContact({
        id: SEED_CONTACT_IDS.leadHigh,
        companyId: company.id,
        assignedUserId: operator.id,
        status: ContactStatus.LEAD,
        source: ContactSource.MANUAL,
        priority: ContactPriority.HIGH,
        name: "Anna Nováková",
        phone: "+420601100001",
        email: "anna.novakova@example.local",
        createdAt: daysAgo(3),
      }),
      upsertContact({
        id: SEED_CONTACT_IDS.leadNormal,
        companyId: company.id,
        assignedUserId: operator.id,
        status: ContactStatus.LEAD,
        source: ContactSource.CSV,
        priority: ContactPriority.NORMAL,
        name: "Petr Svoboda",
        phone: "+420601100002",
        email: "petr.svoboda@example.local",
        createdAt: daysAgo(2),
      }),
      upsertContact({
        id: SEED_CONTACT_IDS.withCallback,
        companyId: company.id,
        assignedUserId: operator.id,
        status: ContactStatus.LEAD,
        source: ContactSource.API,
        priority: ContactPriority.HIGH,
        name: "Jana Dvořáková",
        phone: "+420601100003",
        email: "jana.dvorakova@example.local",
        createdAt: daysAgo(1),
      }),
    ]);

  await Promise.all([
    upsertContact({
      id: SEED_CONTACT_IDS.customer,
      companyId: company.id,
      assignedUserId: operator.id,
      status: ContactStatus.CUSTOMER,
      source: ContactSource.MANUAL,
      priority: ContactPriority.NORMAL,
      name: "Martin Černý",
      phone: "+420601100004",
      email: "martin.cerny@example.local",
      createdAt: daysAgo(30),
    }),
    upsertContact({
      id: SEED_CONTACT_IDS.lost,
      companyId: company.id,
      assignedUserId: operator.id,
      status: ContactStatus.LOST,
      source: ContactSource.OTHER,
      priority: ContactPriority.LOW,
      name: "Eva Malá",
      phone: "+420601100005",
      email: "eva.mala@example.local",
      createdAt: daysAgo(14),
    }),
    upsertContact({
      id: SEED_CONTACT_IDS.unassigned,
      companyId: company.id,
      assignedUserId: null,
      status: ContactStatus.LEAD,
      source: ContactSource.MANUAL,
      priority: ContactPriority.NORMAL,
      name: "Tomáš Horák",
      phone: "+420601100006",
      email: "tomas.horak@example.local",
      createdAt: daysAgo(1),
    }),
  ]);

  const customer = await prisma.contact.findUniqueOrThrow({
    where: { id: SEED_CONTACT_IDS.customer },
  });

  await prisma.callback.upsert({
    where: { id: SEED_CALLBACK_DUE_ID },
    update: {
      companyId: company.id,
      contactId: withCallback.id,
      assignedUserId: operator.id,
      scheduledAt: hoursAgo(1),
      status: CallbackStatus.OPEN,
      note: "Customer requested a call back about pricing.",
    },
    create: {
      id: SEED_CALLBACK_DUE_ID,
      companyId: company.id,
      contactId: withCallback.id,
      assignedUserId: operator.id,
      scheduledAt: hoursAgo(1),
      status: CallbackStatus.OPEN,
      note: "Customer requested a call back about pricing.",
    },
  });

  const callSeeds = [
    {
      id: SEED_CALL_IDS.failOne,
      contactId: leadNormal.id,
      outcome: CallOutcome.FAIL,
      note: "No answer on first attempt.",
      createdAt: daysAgo(2),
    },
    {
      id: SEED_CALL_IDS.failTwo,
      contactId: leadNormal.id,
      outcome: CallOutcome.FAIL,
      note: "Voicemail only.",
      createdAt: daysAgo(1),
    },
    {
      id: SEED_CALL_IDS.callLater,
      contactId: leadHigh.id,
      outcome: CallOutcome.CALL_LATER,
      note: "Busy right now, try later.",
      createdAt: hoursAgo(6),
    },
    {
      id: SEED_CALL_IDS.scheduleCall,
      contactId: customer.id,
      outcome: CallOutcome.SCHEDULE_CALL,
      note: "Follow-up on delivery.",
      createdAt: daysAgo(5),
    },
  ] as const;

  for (const call of callSeeds) {
    await prisma.callActivity.upsert({
      where: { id: call.id },
      update: {
        companyId: company.id,
        contactId: call.contactId,
        operatorId: operator.id,
        outcome: call.outcome,
        note: call.note,
        createdAt: call.createdAt,
      },
      create: {
        id: call.id,
        companyId: company.id,
        contactId: call.contactId,
        operatorId: operator.id,
        outcome: call.outcome,
        note: call.note,
        createdAt: call.createdAt,
      },
    });
  }

  await Promise.all([
    prisma.note.upsert({
      where: { id: SEED_NOTE_IDS.leadHigh },
      update: {
        companyId: company.id,
        contactId: leadHigh.id,
        authorId: operator.id,
        body: "Interested in premium package. Mention spring promotion.",
      },
      create: {
        id: SEED_NOTE_IDS.leadHigh,
        companyId: company.id,
        contactId: leadHigh.id,
        authorId: operator.id,
        body: "Interested in premium package. Mention spring promotion.",
      },
    }),
    prisma.note.upsert({
      where: { id: SEED_NOTE_IDS.withCallback },
      update: {
        companyId: company.id,
        contactId: withCallback.id,
        authorId: operator.id,
        body: "Due callback from API lead. Check previous web inquiry.",
      },
      create: {
        id: SEED_NOTE_IDS.withCallback,
        companyId: company.id,
        contactId: withCallback.id,
        authorId: operator.id,
        body: "Due callback from API lead. Check previous web inquiry.",
      },
    }),
  ]);

  console.log("Seed complete:");
  console.log(`  Company: ${company.name} (${company.id})`);
  console.log(`  Admin:    ${admin.email} / ${SEED_ADMIN_PASSWORD}`);
  console.log(`  Manager:  ${manager.email} / ${SEED_MANAGER_PASSWORD}`);
  console.log(`  Operator: ${operator.email} / ${SEED_OPERATOR_PASSWORD}`);
  console.log("");
  console.log("Demo data:");
  console.log(`  Operator queue: callback "${withCallback.name}" + leads "${leadHigh.name}", "${leadNormal.name}"`);
  console.log(`  Fail history: "${leadNormal.name}" has 2 FAIL calls (threshold test)`);
  console.log(`  Callback URL: /contacts/${withCallback.id}?callbackId=${SEED_CALLBACK_DUE_ID}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
