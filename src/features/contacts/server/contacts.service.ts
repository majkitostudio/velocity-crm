import "server-only";

import {
  ContactSource,
  ContactStatus,
  type Contact,
} from "@/src/generated/prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "@/src/domain/errors";
import {
  canManageCompanyData,
  requireCurrentUser,
} from "@/src/server/auth/guards";
import type { CurrentUser } from "@/src/server/auth/guards";
import { findAssignableOperatorsForCompany } from "@/src/features/callbacks/server/callbacks.repository";

import type { CreateContactInput } from "../schemas";
import {
  createContactForCompany,
  findContactByIdForCompany,
  findContactDetailByIdForCompany,
  findContactDuplicateInCompany,
} from "./contacts.repository";

export async function assertContactAccess(input: {
  currentUser: CurrentUser;
  contactId: string;
}): Promise<Contact> {
  const contact = await findContactByIdForCompany({
    companyId: input.currentUser.companyId,
    contactId: input.contactId,
  });

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  if (
    input.currentUser.role === "OPERATOR" &&
    contact.assignedUserId !== input.currentUser.id
  ) {
    throw new NotFoundError("Contact not found");
  }

  return contact;
}

export async function getContactById(contactId: string): Promise<Contact | null> {
  const currentUser = await requireCurrentUser();

  try {
    return await assertContactAccess({
      currentUser,
      contactId,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
}

export async function getContactDetailById(contactId: string) {
  const currentUser = await requireCurrentUser();

  await assertContactAccess({
    currentUser,
    contactId,
  });

  return findContactDetailByIdForCompany({
    companyId: currentUser.companyId,
    contactId,
  });
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const currentUser = await requireCurrentUser();

  const assignedUserId = await resolveAssignedUserId({
    currentUser,
    requestedAssigneeId: input.assignedUserId,
  });

  const duplicate = await findContactDuplicateInCompany({
    companyId: currentUser.companyId,
    phone: input.phone,
    email: input.email,
  });

  if (duplicate) {
    throw new ConflictError(
      "Kontakt se stejným telefonem nebo e-mailem již existuje.",
    );
  }

  return createContactForCompany({
    companyId: currentUser.companyId,
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      assignedUserId,
      status: ContactStatus.LEAD,
      source: ContactSource.MANUAL,
      priority: input.priority,
    },
  });
}

async function resolveAssignedUserId(input: {
  currentUser: CurrentUser;
  requestedAssigneeId?: string;
}): Promise<string | null> {
  if (input.currentUser.role === "OPERATOR") {
    return input.currentUser.id;
  }

  if (!canManageCompanyData(input.currentUser.role)) {
    return input.currentUser.id;
  }

  const requestedAssigneeId = input.requestedAssigneeId?.trim();

  if (!requestedAssigneeId) {
    return null;
  }

  const operator = (await findAssignableOperatorsForCompany(input.currentUser.companyId)).find(
    (user) => user.id === requestedAssigneeId,
  );

  if (!operator) {
    throw new ValidationError("Operátor nebyl nalezen.");
  }

  return operator.id;
}
