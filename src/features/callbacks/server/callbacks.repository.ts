import "server-only";

import {
  CallbackStatus,
  UserRole,
  type Callback,
  type Prisma,
} from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

type TransactionClient = Prisma.TransactionClient;

const callbackListSelect = {
  id: true,
  contactId: true,
  assignedUserId: true,
  status: true,
  scheduledAt: true,
  note: true,
  contact: {
    select: {
      name: true,
      phone: true,
    },
  },
  assignedUser: {
    select: {
      name: true,
      email: true,
    },
  },
} as const;

export async function findCallbackByIdForCompany(input: {
  companyId: string;
  callbackId: string;
  contactId?: string;
}) {
  return prisma.callback.findFirst({
    where: {
      id: input.callbackId,
      companyId: input.companyId,
      ...(input.contactId ? { contactId: input.contactId } : {}),
    },
    select: {
      id: true,
      contactId: true,
      assignedUserId: true,
      status: true,
      scheduledAt: true,
      note: true,
    },
  });
}

export async function countOpenCallbacksForContact(input: {
  companyId: string;
  contactId: string;
  tx?: TransactionClient;
}) {
  const client = input.tx ?? prisma;

  return client.callback.count({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
      status: CallbackStatus.OPEN,
    },
  });
}

export async function listOpenCallbacksForContact(input: {
  companyId: string;
  contactId: string;
}) {
  return prisma.callback.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
      status: CallbackStatus.OPEN,
    },
    orderBy: {
      scheduledAt: "asc",
    },
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      note: true,
      assignedUser: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function listCallbacksForOperator(input: {
  companyId: string;
  operatorId: string;
  status: CallbackStatus;
  since?: Date;
}) {
  return prisma.callback.findMany({
    where: {
      companyId: input.companyId,
      assignedUserId: input.operatorId,
      status: input.status,
      ...(input.since ? { scheduledAt: { gte: input.since } } : {}),
    },
    orderBy: {
      scheduledAt: "asc",
    },
    select: callbackListSelect,
  });
}

export async function findAssignableOperatorsForCompany(companyId: string) {
  return prisma.user.findMany({
    where: {
      companyId,
      role: {
        in: [UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN],
      },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function findContactByIdForCompany(input: {
  companyId: string;
  contactId: string;
  tx?: TransactionClient;
}) {
  const client = input.tx ?? prisma;

  return client.contact.findFirst({
    where: {
      id: input.contactId,
      companyId: input.companyId,
    },
    select: {
      id: true,
    },
  });
}

export async function findUserByIdForCompany(input: {
  companyId: string;
  userId: string;
  tx?: TransactionClient;
}) {
  const client = input.tx ?? prisma;

  return client.user.findFirst({
    where: {
      id: input.userId,
      companyId: input.companyId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function createCallbackForCompany(
  tx: TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    assignedUserId: string;
    scheduledAt: Date;
    note?: string | null;
  },
): Promise<Callback> {
  return tx.callback.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      assignedUserId: input.assignedUserId,
      scheduledAt: input.scheduledAt,
      status: CallbackStatus.OPEN,
      note: input.note ?? null,
    },
  });
}

/**
 * Batch insert for future bulk scheduling. Slice 7 uses single-item create only.
 */
export async function createCallbacksForCompany(
  tx: TransactionClient,
  items: {
    companyId: string;
    contactId: string;
    assignedUserId: string;
    scheduledAt: Date;
    note?: string | null;
  }[],
): Promise<Callback[]> {
  if (items.length === 0) {
    return [];
  }

  return Promise.all(items.map((item) => createCallbackForCompany(tx, item)));
}

export async function updateCallbackForCompany(
  tx: TransactionClient,
  input: {
    companyId: string;
    callbackId: string;
    scheduledAt?: Date;
    note?: string | null;
    status?: CallbackStatus;
    assignedUserId?: string;
  },
): Promise<Callback> {
  return tx.callback.update({
    where: {
      id: input.callbackId,
      companyId: input.companyId,
    },
    data: {
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.assignedUserId !== undefined
        ? { assignedUserId: input.assignedUserId }
        : {}),
    },
  });
}

export async function markCallbackDoneForCompany(
  tx: TransactionClient,
  input: {
    companyId: string;
    callbackId: string;
  },
): Promise<Callback> {
  return updateCallbackForCompany(tx, {
    companyId: input.companyId,
    callbackId: input.callbackId,
    status: CallbackStatus.DONE,
  });
}
