import "server-only";

import { CallbackStatus, type Callback } from "@/src/generated/prisma/client";
import { canManageCompanyData, requireCurrentUser } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

export async function createCallback(input: {
  contactId: string;
  assignedUserId?: string | null;
  scheduledAt: Date;
  note?: string | null;
}): Promise<Callback> {
  const currentUser = await requireCurrentUser();
  const assignedUserId = input.assignedUserId ?? currentUser.id;

  if (assignedUserId !== currentUser.id && !canManageCompanyData(currentUser.role)) {
    throw new Error("Only admins and managers can assign callbacks to another user");
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      companyId: currentUser.companyId,
    },
    select: {
      id: true,
    },
  });

  if (!contact) {
    throw new Error("Contact not found in current company");
  }

  const assignedUser = await prisma.user.findFirst({
    where: {
      id: assignedUserId,
      companyId: currentUser.companyId,
    },
    select: {
      id: true,
    },
  });

  if (!assignedUser) {
    throw new Error("Assigned user not found in current company");
  }

  return prisma.callback.create({
    data: {
      companyId: currentUser.companyId,
      contactId: contact.id,
      assignedUserId: assignedUser.id,
      scheduledAt: input.scheduledAt,
      status: CallbackStatus.OPEN,
      note: input.note ?? null,
    },
  });
}

export async function updateCallbackStatus(input: {
  callbackId: string;
  status: CallbackStatus;
}): Promise<Callback> {
  const currentUser = await requireCurrentUser();

  const callback = await prisma.callback.findFirst({
    where: {
      id: input.callbackId,
      companyId: currentUser.companyId,
    },
    select: {
      assignedUserId: true,
    },
  });

  if (!callback) {
    throw new Error("Callback not found in current company");
  }

  if (
    callback.assignedUserId !== currentUser.id &&
    !canManageCompanyData(currentUser.role)
  ) {
    throw new Error("Forbidden");
  }

  return prisma.callback.update({
    where: {
      id: input.callbackId,
      companyId: currentUser.companyId,
    },
    data: {
      status: input.status,
    },
  });
}
