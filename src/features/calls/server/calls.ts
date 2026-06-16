import "server-only";

import {
  CallOutcome,
  CallbackStatus,
  ContactStatus,
  type CallActivity,
} from "@/src/generated/prisma/client";
import { canManageCompanyData, requireCurrentUser } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

export type CompleteCallInput = {
  contactId: string;
  outcome: CallOutcome;
  note?: string | null;
  callbackId?: string | null;
  orderId?: string | null;
};

export async function completeCall(input: CompleteCallInput): Promise<CallActivity> {
  const currentUser = await requireCurrentUser();

  if (!Object.values(CallOutcome).includes(input.outcome)) {
    throw new Error("Call outcome is required");
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      companyId: currentUser.companyId,
    },
    select: {
      id: true,
      assignedUserId: true,
    },
  });

  if (!contact) {
    throw new Error("Contact not found in current company");
  }

  if (
    !canManageCompanyData(currentUser.role) &&
    contact.assignedUserId !== currentUser.id
  ) {
    throw new Error("Operators can only call assigned contacts");
  }

  return prisma.$transaction(async (tx) => {
    const callActivity = await tx.callActivity.create({
      data: {
        companyId: currentUser.companyId,
        contactId: contact.id,
        operatorId: currentUser.id,
        outcome: input.outcome,
        note: input.note ?? null,
        callbackId: input.callbackId ?? null,
        orderId: input.orderId ?? null,
      },
    });

    if (input.outcome === CallOutcome.ORDER) {
      await tx.contact.update({
        where: {
          id: contact.id,
          companyId: currentUser.companyId,
        },
        data: {
          status: ContactStatus.CUSTOMER,
        },
      });
    }

    if (input.callbackId) {
      await tx.callback.update({
        where: {
          id: input.callbackId,
          companyId: currentUser.companyId,
        },
        data: {
          status: CallbackStatus.DONE,
        },
      });
    }

    return callActivity;
  });
}
