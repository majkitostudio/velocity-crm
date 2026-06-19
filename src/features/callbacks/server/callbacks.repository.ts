import "server-only";

import { CallbackStatus, type Callback, type Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

type TransactionClient = Prisma.TransactionClient;

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

export async function markCallbackDoneForCompany(
  tx: TransactionClient,
  input: {
    companyId: string;
    callbackId: string;
  },
): Promise<Callback> {
  return tx.callback.update({
    where: {
      id: input.callbackId,
      companyId: input.companyId,
    },
    data: {
      status: CallbackStatus.DONE,
    },
  });
}
