import "server-only";

import {
  CallOutcome,
  type CallActivity,
  type Prisma,
} from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

type TransactionClient = Prisma.TransactionClient;

export async function createCallActivityForCompany(
  tx: TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    operatorId: string;
    outcome: CallOutcome;
    note?: string | null;
    callbackId?: string | null;
    orderId?: string | null;
    idempotencyKey: string;
  },
): Promise<CallActivity> {
  return tx.callActivity.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      operatorId: input.operatorId,
      outcome: input.outcome,
      note: input.note ?? null,
      callbackId: input.callbackId ?? null,
      orderId: input.orderId ?? null,
      idempotencyKey: input.idempotencyKey,
    },
  });
}

export async function findCallActivityByIdempotencyKeyForOperator(input: {
  companyId: string;
  operatorId: string;
  idempotencyKey: string;
}) {
  return prisma.callActivity.findFirst({
    where: {
      companyId: input.companyId,
      operatorId: input.operatorId,
      idempotencyKey: input.idempotencyKey,
    },
  });
}

export async function findRecentCallActivityForOperator(input: {
  companyId: string;
  contactId: string;
  operatorId: string;
  outcome: CallOutcome;
  since: Date;
}) {
  return prisma.callActivity.findFirst({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
      operatorId: input.operatorId,
      outcome: input.outcome,
      createdAt: {
        gte: input.since,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
