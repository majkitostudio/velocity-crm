import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import {
  ActivitySourceEntity,
  CallOutcome,
  CallbackStatus,
  ContactActivityKind,
  ContactPriority,
  ContactSource,
  ContactStatus,
  OrderStatus,
  PrismaClient,
  UserRole,
} from "../src/generated/prisma/client";

import { TENANT_ISOLATION_SEED } from "./fixtures/tenant-isolation";

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
  withFutureCallback: "seed-contact-with-future-callback",
  customer: "seed-contact-customer",
  lost: "seed-contact-lost",
  failThree: "seed-contact-fail-three",
  unassigned: "seed-contact-unassigned",
} as const;

const SEED_CALLBACK_DUE_ID = "seed-callback-due";
const SEED_CALLBACK_FUTURE_ID = "seed-callback-future";

const SEED_PRODUCT_CATEGORY_IDS = {
  supplements: "seed-product-category-supplements",
  cosmetics: "seed-product-category-cosmetics",
  inactive: "seed-product-category-inactive",
} as const;

const SEED_PRODUCT_IDS = {
  omega3: "seed-product-omega-3",
  vitaminD3: "seed-product-vitamin-d3",
  magnesium: "seed-product-magnesium",
  dayCream: "seed-product-day-cream",
  nightSerum: "seed-product-night-serum",
  freeSample: "seed-product-free-sample",
  inactive: "seed-product-inactive",
} as const;

const SEED_CALL_IDS = {
  failOne: "seed-call-fail-1",
  failTwo: "seed-call-fail-2",
  failThreeOne: "seed-call-fail-three-1",
  failThreeTwo: "seed-call-fail-three-2",
  failThreeThree: "seed-call-fail-three-3",
  callLater: "seed-call-call-later",
  scheduleCall: "seed-call-schedule-call",
} as const;

const SEED_NOTE_IDS = {
  leadHigh: "seed-note-lead-high",
  withCallback: "seed-note-with-callback",
} as const;

const SEED_ORDER_IDS = {
  singleProduct: "seed-order-single-product",
  multiProduct: "seed-order-multi-product",
  freeProduct: "seed-order-free-product",
} as const;

const SEED_ORDER_ITEM_IDS = {
  singleProductOmega3: "seed-order-item-single-omega-3",
  multiProductVitaminD3: "seed-order-item-multi-vitamin-d3",
  multiProductMagnesium: "seed-order-item-multi-magnesium",
  freeProductSample: "seed-order-item-free-sample",
} as const;

function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

function hoursFromNow(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

const SEED_TAG_IDS = {
  campaignSpring: "seed-tag-campaign-spring",
  vipFollowUp: "seed-tag-vip-follow-up",
} as const;

async function upsertTag(input: {
  id: string;
  companyId: string;
  name: string;
}) {
  return prisma.tag.upsert({
    where: { id: input.id },
    update: {
      companyId: input.companyId,
      name: input.name,
    },
    create: {
      id: input.id,
      companyId: input.companyId,
      name: input.name,
    },
  });
}

async function upsertContactTag(input: {
  id: string;
  companyId: string;
  contactId: string;
  tagId: string;
}) {
  return prisma.contactTag.upsert({
    where: { id: input.id },
    update: {
      companyId: input.companyId,
      contactId: input.contactId,
      tagId: input.tagId,
    },
    create: {
      id: input.id,
      companyId: input.companyId,
      contactId: input.contactId,
      tagId: input.tagId,
    },
  });
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

async function upsertProductCategory(input: {
  id: string;
  companyId: string;
  name: string;
  isActive?: boolean;
}) {
  const isActive = input.isActive ?? true;

  return prisma.productCategory.upsert({
    where: { id: input.id },
    update: {
      companyId: input.companyId,
      name: input.name,
      isActive,
    },
    create: {
      id: input.id,
      companyId: input.companyId,
      name: input.name,
      isActive,
    },
  });
}

async function upsertProduct(input: {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  price: string;
  isActive?: boolean;
}) {
  const isActive = input.isActive ?? true;

  return prisma.product.upsert({
    where: { id: input.id },
    update: {
      companyId: input.companyId,
      categoryId: input.categoryId,
      name: input.name,
      price: input.price,
      isActive,
    },
    create: {
      id: input.id,
      companyId: input.companyId,
      categoryId: input.categoryId,
      name: input.name,
      price: input.price,
      isActive,
    },
  });
}

async function upsertOrder(input: {
  id: string;
  companyId: string;
  contactId: string;
  operatorId: string;
  status: OrderStatus;
  note: string;
  createdAt: Date;
}) {
  return prisma.order.upsert({
    where: { id: input.id },
    update: {
      companyId: input.companyId,
      contactId: input.contactId,
      operatorId: input.operatorId,
      status: input.status,
      note: input.note,
      createdAt: input.createdAt,
    },
    create: {
      id: input.id,
      companyId: input.companyId,
      contactId: input.contactId,
      operatorId: input.operatorId,
      status: input.status,
      note: input.note,
      createdAt: input.createdAt,
    },
  });
}

async function upsertOrderItem(input: {
  id: string;
  companyId: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
}) {
  return prisma.orderItem.upsert({
    where: { id: input.id },
    update: {
      companyId: input.companyId,
      orderId: input.orderId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
    },
    create: {
      id: input.id,
      companyId: input.companyId,
      orderId: input.orderId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
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

  await prisma.contactActivity.deleteMany({
    where: {
      companyId: {
        in: [company.id, TENANT_ISOLATION_SEED.otherCompanyId],
      },
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

  const [supplementsCategory, cosmeticsCategory, inactiveCategory] = await Promise.all([
    upsertProductCategory({
      id: SEED_PRODUCT_CATEGORY_IDS.supplements,
      companyId: company.id,
      name: "Doplňky stravy",
    }),
    upsertProductCategory({
      id: SEED_PRODUCT_CATEGORY_IDS.cosmetics,
      companyId: company.id,
      name: "Kosmetika",
    }),
    upsertProductCategory({
      id: SEED_PRODUCT_CATEGORY_IDS.inactive,
      companyId: company.id,
      name: "Archivní kategorie",
      isActive: false,
    }),
  ]);

  const [omega3, vitaminD3, magnesium, , , freeSample] = await Promise.all([
    upsertProduct({
      id: SEED_PRODUCT_IDS.omega3,
      companyId: company.id,
      categoryId: supplementsCategory.id,
      name: "Omega 3",
      price: "499.00",
    }),
    upsertProduct({
      id: SEED_PRODUCT_IDS.vitaminD3,
      companyId: company.id,
      categoryId: supplementsCategory.id,
      name: "Vitamin D3",
      price: "249.00",
    }),
    upsertProduct({
      id: SEED_PRODUCT_IDS.magnesium,
      companyId: company.id,
      categoryId: supplementsCategory.id,
      name: "Magnesium",
      price: "329.00",
    }),
    upsertProduct({
      id: SEED_PRODUCT_IDS.dayCream,
      companyId: company.id,
      categoryId: cosmeticsCategory.id,
      name: "Denní krém",
      price: "599.00",
    }),
    upsertProduct({
      id: SEED_PRODUCT_IDS.nightSerum,
      companyId: company.id,
      categoryId: cosmeticsCategory.id,
      name: "Noční sérum",
      price: "899.00",
    }),
    upsertProduct({
      id: SEED_PRODUCT_IDS.freeSample,
      companyId: company.id,
      categoryId: supplementsCategory.id,
      name: "Vzorek zdarma",
      price: "0.00",
    }),
    upsertProduct({
      id: SEED_PRODUCT_IDS.inactive,
      companyId: company.id,
      categoryId: inactiveCategory.id,
      name: "Archivní produkt",
      price: "199.00",
      isActive: false,
    }),
  ]);

  const [leadHigh, leadNormal, withCallback, withFutureCallback, failThree] =
    await Promise.all([
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
      upsertContact({
        id: SEED_CONTACT_IDS.withFutureCallback,
        companyId: company.id,
        assignedUserId: operator.id,
        status: ContactStatus.LEAD,
        source: ContactSource.API,
        priority: ContactPriority.NORMAL,
        name: "Lukáš Procházka",
        phone: "+420601100007",
        email: "lukas.prochazka@example.local",
        createdAt: daysAgo(1),
      }),
      upsertContact({
        id: SEED_CONTACT_IDS.failThree,
        companyId: company.id,
        assignedUserId: operator.id,
        status: ContactStatus.LOST,
        source: ContactSource.CSV,
        priority: ContactPriority.LOW,
        name: "Klára Veselá",
        phone: "+420601100008",
        email: "klara.vesela@example.local",
        createdAt: daysAgo(7),
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

  await prisma.callback.upsert({
    where: { id: SEED_CALLBACK_FUTURE_ID },
    update: {
      companyId: company.id,
      contactId: withFutureCallback.id,
      assignedUserId: operator.id,
      scheduledAt: hoursFromNow(24),
      status: CallbackStatus.OPEN,
      note: "Future callback for tomorrow morning.",
    },
    create: {
      id: SEED_CALLBACK_FUTURE_ID,
      companyId: company.id,
      contactId: withFutureCallback.id,
      assignedUserId: operator.id,
      scheduledAt: hoursFromNow(24),
      status: CallbackStatus.OPEN,
      note: "Future callback for tomorrow morning.",
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
      id: SEED_CALL_IDS.failThreeOne,
      contactId: failThree.id,
      outcome: CallOutcome.FAIL,
      note: "No answer on first threshold scenario attempt.",
      createdAt: daysAgo(5),
    },
    {
      id: SEED_CALL_IDS.failThreeTwo,
      contactId: failThree.id,
      outcome: CallOutcome.FAIL,
      note: "No answer on second threshold scenario attempt.",
      createdAt: daysAgo(4),
    },
    {
      id: SEED_CALL_IDS.failThreeThree,
      contactId: failThree.id,
      outcome: CallOutcome.FAIL,
      note: "Third failed attempt for lost threshold scenario.",
      createdAt: daysAgo(3),
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

  const [singleProductOrder, multiProductOrder, freeProductOrder] = await Promise.all([
    upsertOrder({
      id: SEED_ORDER_IDS.singleProduct,
      companyId: company.id,
      contactId: customer.id,
      operatorId: operator.id,
      status: OrderStatus.CREATED,
      note: "Seed order with one product.",
      createdAt: daysAgo(4),
    }),
    upsertOrder({
      id: SEED_ORDER_IDS.multiProduct,
      companyId: company.id,
      contactId: leadHigh.id,
      operatorId: operator.id,
      status: OrderStatus.PROCESSING,
      note: "Seed order with multiple products.",
      createdAt: daysAgo(2),
    }),
    upsertOrder({
      id: SEED_ORDER_IDS.freeProduct,
      companyId: company.id,
      contactId: leadNormal.id,
      operatorId: operator.id,
      status: OrderStatus.CREATED,
      note: "Seed order containing a free product.",
      createdAt: daysAgo(1),
    }),
  ]);

  await Promise.all([
    upsertOrderItem({
      id: SEED_ORDER_ITEM_IDS.singleProductOmega3,
      companyId: company.id,
      orderId: singleProductOrder.id,
      productId: omega3.id,
      quantity: 1,
      unitPrice: "499.00",
    }),
    upsertOrderItem({
      id: SEED_ORDER_ITEM_IDS.multiProductVitaminD3,
      companyId: company.id,
      orderId: multiProductOrder.id,
      productId: vitaminD3.id,
      quantity: 2,
      unitPrice: "249.00",
    }),
    upsertOrderItem({
      id: SEED_ORDER_ITEM_IDS.multiProductMagnesium,
      companyId: company.id,
      orderId: multiProductOrder.id,
      productId: magnesium.id,
      quantity: 1,
      unitPrice: "329.00",
    }),
    upsertOrderItem({
      id: SEED_ORDER_ITEM_IDS.freeProductSample,
      companyId: company.id,
      orderId: freeProductOrder.id,
      productId: freeSample.id,
      quantity: 1,
      unitPrice: "0.00",
    }),
  ]);

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

  const [campaignTag, vipTag] = await Promise.all([
    upsertTag({
      id: SEED_TAG_IDS.campaignSpring,
      companyId: company.id,
      name: "Kampaň Jaro 2026",
    }),
    upsertTag({
      id: SEED_TAG_IDS.vipFollowUp,
      companyId: company.id,
      name: "VIP follow-up",
    }),
  ]);

  await Promise.all([
    upsertContactTag({
      id: "seed-contact-tag-lead-high-campaign",
      companyId: company.id,
      contactId: leadHigh.id,
      tagId: campaignTag.id,
    }),
    upsertContactTag({
      id: "seed-contact-tag-customer-vip",
      companyId: company.id,
      contactId: customer.id,
      tagId: vipTag.id,
    }),
  ]);

  await seedTenantIsolationFixture();

  console.log("Seed complete:");
  console.log(`  Company: ${company.name} (${company.id})`);
  console.log(`  Admin:    ${admin.email} / ${SEED_ADMIN_PASSWORD}`);
  console.log(`  Manager:  ${manager.email} / ${SEED_MANAGER_PASSWORD}`);
  console.log(`  Operator: ${operator.email} / ${SEED_OPERATOR_PASSWORD}`);
  console.log("");
  console.log("Demo data:");
  console.log(
    `  Operator queue: callback "${withCallback.name}" + leads "${leadHigh.name}", "${leadNormal.name}"`,
  );
  console.log(`  Future callback: "${withFutureCallback.name}" is scheduled for tomorrow`);
  console.log(`  Fail history: "${leadNormal.name}" has 2 FAIL calls (threshold test)`);
  console.log(`  Lost threshold history: "${failThree.name}" has 3 FAIL calls`);
  console.log(
    "  Product catalog: Omega 3, Vitamin D3, Magnesium, Denní krém, Noční sérum, Vzorek zdarma",
  );
  console.log("  Inactive catalog: Archivní kategorie + Archivní produkt");
  console.log("  Orders: single product, multi product, free product");
  console.log(`  Callback URL: /contacts/${withCallback.id}?callback=${SEED_CALLBACK_DUE_ID}`);
  console.log(
    `  Tenant isolation: /contacts/${TENANT_ISOLATION_SEED.otherContactId} (other company)`,
  );
}

async function seedTenantIsolationFixture() {
  const otherCompany = await prisma.company.upsert({
    where: { id: TENANT_ISOLATION_SEED.otherCompanyId },
    update: { name: TENANT_ISOLATION_SEED.otherCompanyName },
    create: {
      id: TENANT_ISOLATION_SEED.otherCompanyId,
      name: TENANT_ISOLATION_SEED.otherCompanyName,
    },
  });

  const otherOperator = await upsertUser({
    email: TENANT_ISOLATION_SEED.otherOperatorEmail,
    password: TENANT_ISOLATION_SEED.otherOperatorPassword,
    name: "Other Tenant Operator",
    role: UserRole.OPERATOR,
    companyId: otherCompany.id,
  });

  const otherContact = await upsertContact({
    id: TENANT_ISOLATION_SEED.otherContactId,
    companyId: otherCompany.id,
    assignedUserId: otherOperator.id,
    status: ContactStatus.LEAD,
    source: ContactSource.MANUAL,
    priority: ContactPriority.NORMAL,
    name: "Other Tenant Contact",
    phone: "+420601999999",
    email: "other-tenant@example.local",
  });

  await prisma.contactActivity.upsert({
    where: { id: TENANT_ISOLATION_SEED.otherActivityId },
    update: {
      companyId: otherCompany.id,
      contactId: otherContact.id,
      actorUserId: otherOperator.id,
      kind: ContactActivityKind.CONTACT_CREATED,
      occurredAt: hoursAgo(2),
      sourceEntityType: ActivitySourceEntity.CONTACT,
      sourceEntityId: otherContact.id,
      payload: {
        version: 1,
        summary: "Kontakt vytvořen — ruční vytvoření",
        data: {
          source: "MANUAL",
        },
      },
    },
    create: {
      id: TENANT_ISOLATION_SEED.otherActivityId,
      companyId: otherCompany.id,
      contactId: otherContact.id,
      actorUserId: otherOperator.id,
      kind: ContactActivityKind.CONTACT_CREATED,
      occurredAt: hoursAgo(2),
      sourceEntityType: ActivitySourceEntity.CONTACT,
      sourceEntityId: otherContact.id,
      payload: {
        version: 1,
        summary: "Kontakt vytvořen — ruční vytvoření",
        data: {
          source: "MANUAL",
        },
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
