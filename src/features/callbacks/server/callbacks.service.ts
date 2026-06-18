import "server-only";

import type { Callback, Prisma } from "@/src/generated/prisma/client";
import { NotFoundError, ValidationError } from "@/src/domain/errors";
import { canManageCompanyData, type CurrentUser } from "@/src/server/auth/guards";

import {
  createCallbackForCompany,
  findCallbackByIdForCompany,
  markCallbackDoneForCompany,
} from "./callbacks.repository";

type TransactionClient = Prisma.TransactionClient;

export async function assertSourceCallbackForCall(input: {
  currentUser: CurrentUser;
  contactId: string;
  sourceCallbackId?: string | null;
}) {
  if (!input.sourceCallbackId) {
    return null;
  }

  const callback = await findCallbackByIdForCompany({
    companyId: input.currentUser.companyId,
    callbackId: input.sourceCallbackId,
    contactId: input.contactId,
  });

  if (!callback) {
    throw new ValidationError("Callback not found for this contact");
  }

  if (
    callback.assignedUserId !== input.currentUser.id &&
    !canManageCompanyData(input.currentUser.role)
  ) {
    throw new NotFoundError("Contact not found");
  }

  if (callback.status !== "OPEN") {
    throw new ValidationError("Callback is no longer open");
  }

  return callback;
}

export async function createCallbackInTransaction(
  tx: TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    assignedUserId: string;
    scheduledAt: Date;
    note?: string | null;
  },
): Promise<Callback> {
  return createCallbackForCompany(tx, input);
}

export async function completeSourceCallbackInTransaction(
  tx: TransactionClient,
  input: {
    companyId: string;
    callbackId: string;
  },
): Promise<Callback> {
  return markCallbackDoneForCompany(tx, input);
}
