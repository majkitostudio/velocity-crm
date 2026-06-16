import "server-only";

import {
  ContactPriority,
  ContactSource,
  ContactStatus,
  type Contact,
} from "@/src/generated/prisma/client";
import { canManageCompanyData, requireCurrentUser } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

export type CreateContactInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  street?: string | null;
  city?: string | null;
  zipCode?: string | null;
  country?: string | null;
  source?: ContactSource;
  priority?: ContactPriority;
  assignedUserId?: string | null;
};

export async function findContactDuplicate(input: {
  phone?: string | null;
  email?: string | null;
}): Promise<Contact | null> {
  const currentUser = await requireCurrentUser();
  const duplicateConditions = [
    input.phone ? { phone: input.phone } : null,
    input.email ? { email: input.email.toLowerCase() } : null,
  ].filter((condition): condition is { phone: string } | { email: string } =>
    Boolean(condition),
  );

  if (duplicateConditions.length === 0) {
    return null;
  }

  return prisma.contact.findFirst({
    where: {
      companyId: currentUser.companyId,
      OR: duplicateConditions,
    },
  });
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const currentUser = await requireCurrentUser();

  if (input.assignedUserId && !canManageCompanyData(currentUser.role)) {
    throw new Error("Only admins and managers can assign leads");
  }

  const duplicate = await findContactDuplicate({
    phone: input.phone,
    email: input.email,
  });

  if (duplicate) {
    throw new Error("Duplicate contact found in current company");
  }

  return prisma.contact.create({
    data: {
      companyId: currentUser.companyId,
      assignedUserId: input.assignedUserId ?? null,
      status: ContactStatus.LEAD,
      source: input.source ?? ContactSource.MANUAL,
      priority: input.priority ?? ContactPriority.NORMAL,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ? input.email.toLowerCase() : null,
      street: input.street ?? null,
      city: input.city ?? null,
      zipCode: input.zipCode ?? null,
      country: input.country ?? null,
    },
  });
}

export async function getContactById(contactId: string): Promise<Contact | null> {
  const currentUser = await requireCurrentUser();

  return prisma.contact.findFirst({
    where: {
      id: contactId,
      companyId: currentUser.companyId,
    },
  });
}
