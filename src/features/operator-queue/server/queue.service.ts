import "server-only";

import { ContactPriority } from "@/src/generated/prisma/client";
import { ForbiddenError } from "@/src/domain/errors";
import {
  canManageCompanyData,
  requireCurrentUser,
  requireRole,
} from "@/src/server/auth/guards";
import type { CurrentUser } from "@/src/server/auth/guards";

import type {
  OperatorQueueCallbackItem,
  OperatorQueueItem,
  OperatorQueueLeadItem,
  OperatorQueueSnapshot,
  QueueContact,
} from "../types";

import {
  assignContactToOperatorInCompany,
  findAssignedLeadsForOperator,
  findDueCallbacksForOperator,
  findOperatorInCompany,
  findUnassignedLeadsForCompany,
} from "./queue.repository";

const priorityRank: Record<ContactPriority, number> = {
  HIGH: 0,
  NORMAL: 1,
  LOW: 2,
};

function sortByQueuePriority<T extends { contact: QueueContact }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const priorityDiff =
      priorityRank[left.contact.priority] - priorityRank[right.contact.priority];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return left.contact.createdAt.getTime() - right.contact.createdAt.getTime();
  });
}

function assertQueueAccess(currentUser: CurrentUser, targetOperatorId: string): void {
  if (targetOperatorId !== currentUser.id && !canManageCompanyData(currentUser.role)) {
    throw new ForbiddenError();
  }
}

function buildSnapshot(
  callbackItems: OperatorQueueCallbackItem[],
  leadItems: OperatorQueueLeadItem[],
): OperatorQueueSnapshot {
  const items: OperatorQueueItem[] = [...callbackItems, ...leadItems];

  return {
    items,
    callbacks: callbackItems,
    leads: leadItems,
    counts: {
      callbacks: callbackItems.length,
      leads: leadItems.length,
      total: items.length,
    },
  };
}

export async function getOperatorQueueSnapshot(
  operatorId?: string,
  now = new Date(),
): Promise<OperatorQueueSnapshot> {
  const currentUser = await requireCurrentUser();
  const targetOperatorId = operatorId ?? currentUser.id;

  assertQueueAccess(currentUser, targetOperatorId);

  const [callbacks, leads] = await Promise.all([
    findDueCallbacksForOperator({
      companyId: currentUser.companyId,
      operatorId: targetOperatorId,
      now,
    }),
    findAssignedLeadsForOperator({
      companyId: currentUser.companyId,
      operatorId: targetOperatorId,
    }),
  ]);

  const callbackItems = sortByQueuePriority(
    callbacks.map((callback) => ({
      kind: "CALLBACK" as const,
      callbackId: callback.id,
      scheduledAt: callback.scheduledAt,
      contact: callback.contact,
    })),
  );

  const leadItems = sortByQueuePriority(
    leads.map((contact) => ({
      kind: "LEAD" as const,
      callbackId: null,
      scheduledAt: null,
      contact,
    })),
  );

  return buildSnapshot(callbackItems, leadItems);
}

export async function getOperatorQueue(
  operatorId?: string,
  now = new Date(),
): Promise<OperatorQueueItem[]> {
  const snapshot = await getOperatorQueueSnapshot(operatorId, now);
  return snapshot.items;
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

  return findUnassignedLeadsForCompany(currentUser.companyId);
}

export async function assignContactToOperator(input: {
  contactId: string;
  operatorId: string;
}): Promise<QueueContact> {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  const operator = await findOperatorInCompany({
    companyId: currentUser.companyId,
    operatorId: input.operatorId,
  });

  if (!operator) {
    throw new ForbiddenError("Operator not found in current company");
  }

  const contact = await assignContactToOperatorInCompany({
    companyId: currentUser.companyId,
    contactId: input.contactId,
    operatorId: operator.id,
  });

  return {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    status: contact.status,
    priority: contact.priority,
    source: contact.source,
    assignedUserId: contact.assignedUserId,
    createdAt: contact.createdAt,
  };
}
