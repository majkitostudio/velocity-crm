import "server-only";

import { prisma } from "@/src/server/db";

export async function listCallActivitiesForContact(input: {
  companyId: string;
  contactId: string;
}) {
  return prisma.callActivity.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      outcome: true,
      note: true,
      createdAt: true,
      operator: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function listNotesForContact(input: {
  companyId: string;
  contactId: string;
}) {
  return prisma.note.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function listCallbacksForContact(input: {
  companyId: string;
  contactId: string;
}) {
  return prisma.callback.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      note: true,
      createdAt: true,
      assignedUser: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function listOrdersForContact(input: {
  companyId: string;
  contactId: string;
}) {
  return prisma.order.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      operator: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
        },
      },
    },
  });
}
