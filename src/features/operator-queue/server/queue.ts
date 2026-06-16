import "server-only";

import {
  CallbackStatus,
  ContactPriority,
  ContactStatus,
  type Contact,
} from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";
import {
  canManageCompanyData,
  requireCurrentUser,
  requireRole,
} from "@/src/server/auth/guards";

const priorityRank: Record<ContactPriority, number> = {
  HIGH: 0,
  NORMAL: 1,
  LOW: 2,
};

type QueueContact = Pick<
  Contact,
  | "id"
  | "name"
  | "phone"
  | "email"
  | "status"
  | "priority"
  | "source"
  | "assignedUserId"
  | "createdAt"
>;

export type OperatorQueueItem =
  | {
      kind: "CALLBACK";
      callbackId: string;
      scheduledAt: Date;
      contact: QueueContact;
    }
  | {
      kind: "LEAD";
      callbackId: null;
      scheduledAt: null;
      contact: QueueContact;
    };

function sortContactsByQueuePriority<T extends { contact: QueueContact }>(
  items: T[],
): T[] {
  return [...items].sort((left, right) => {
    const priorityDiff =
      priorityRank[left.contact.priority] - priorityRank[right.contact.priority];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return left.contact.createdAt.getTime() - right.contact.createdAt.getTime();
  });
}

export async function getOperatorQueue(
  operatorId?: string,
  now = new Date(),
): Promise<OperatorQueueItem[]> {
  const currentUser = await requireCurrentUser();
  const targetOperatorId = operatorId ?? currentUser.id;

  if (targetOperatorId !== currentUser.id && !canManageCompanyData(currentUser.role)) {
    throw new Error("Forbidden");
  }

  const callbacks = await prisma.callback.findMany({
    where: {
      companyId: currentUser.companyId,
      assignedUserId: targetOperatorId,
      status: CallbackStatus.OPEN,
      scheduledAt: {
        lte: now,
      },
    },
    include: {
      contact: true,
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  const leadContacts = await prisma.contact.findMany({
    where: {
      companyId: currentUser.companyId,
      assignedUserId: targetOperatorId,
      status: ContactStatus.LEAD,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const callbackItems = sortContactsByQueuePriority(
    callbacks.map((callback) => ({
      kind: "CALLBACK" as const,
      callbackId: callback.id,
      scheduledAt: callback.scheduledAt,
      contact: callback.contact,
    })),
  );

  const leadItems = sortContactsByQueuePriority(
    leadContacts.map((contact) => ({
      kind: "LEAD" as const,
      callbackId: null,
      scheduledAt: null,
      contact,
    })),
  );

  return [...callbackItems, ...leadItems];
}

export async function getNextCallableContact(
  operatorId?: string,
  now = new Date(),
): Promise<OperatorQueueItem | null> {
  const queue = await getOperatorQueue(operatorId, now);

  return queue[0] ?? null;
}

export async function getUnassignedLeads(): Promise<QueueContact[]> {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  return prisma.contact.findMany({
    where: {
      companyId: currentUser.companyId,
      assignedUserId: null,
      status: ContactStatus.LEAD,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function assignContactToOperator(input: {
  contactId: string;
  operatorId: string;
}): Promise<Contact> {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  const operator = await prisma.user.findFirst({
    where: {
      id: input.operatorId,
      companyId: currentUser.companyId,
      role: "OPERATOR",
    },
    select: {
      id: true,
    },
  });

  if (!operator) {
    throw new Error("Operator not found in current company");
  }

  return prisma.contact.update({
    where: {
      id: input.contactId,
      companyId: currentUser.companyId,
    },
    data: {
      assignedUserId: operator.id,
    },
  });
}
