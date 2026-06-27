import "server-only";

import {
  CallbackStatus,
  ContactStatus,
  type Contact,
  type Prisma,
} from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

import type { QueueContact } from "../types";

type TransactionClient = Prisma.TransactionClient;

const queueContactSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  status: true,
  priority: true,
  source: true,
  assignedUserId: true,
  createdAt: true,
} as const;

export type DueCallbackRow = {
  id: string;
  scheduledAt: Date;
  contact: QueueContact;
};

export async function findDueCallbacksForOperator(input: {
  companyId: string;
  operatorId: string;
  now: Date;
}): Promise<DueCallbackRow[]> {
  const callbacks = await prisma.callback.findMany({
    where: {
      companyId: input.companyId,
      assignedUserId: input.operatorId,
      status: CallbackStatus.OPEN,
      scheduledAt: {
        lte: input.now,
      },
    },
    select: {
      id: true,
      scheduledAt: true,
      contact: {
        select: queueContactSelect,
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  return callbacks.map((callback) => ({
    id: callback.id,
    scheduledAt: callback.scheduledAt,
    contact: callback.contact,
  }));
}

export async function findAssignedLeadsForOperator(input: {
  companyId: string;
  operatorId: string;
}): Promise<QueueContact[]> {
  return prisma.contact.findMany({
    where: {
      companyId: input.companyId,
      assignedUserId: input.operatorId,
      status: ContactStatus.LEAD,
    },
    select: queueContactSelect,
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function findUnassignedLeadsForCompany(
  companyId: string,
): Promise<QueueContact[]> {
  return prisma.contact.findMany({
    where: {
      companyId,
      assignedUserId: null,
      status: ContactStatus.LEAD,
    },
    select: queueContactSelect,
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function findOperatorsForCompany(companyId: string) {
  return prisma.user.findMany({
    where: {
      companyId,
      role: "OPERATOR",
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function findOperatorInCompany(input: {
  companyId: string;
  operatorId: string;
}): Promise<{ id: string; name: string | null; email: string } | null> {
  return prisma.user.findFirst({
    where: {
      id: input.operatorId,
      companyId: input.companyId,
      role: "OPERATOR",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function assignContactToOperatorInCompany(
  client: typeof prisma | TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    operatorId: string;
  },
): Promise<Contact> {
  return client.contact.update({
    where: {
      id: input.contactId,
      companyId: input.companyId,
    },
    data: {
      assignedUserId: input.operatorId,
    },
  });
}
