import "server-only";

import type { Contact } from "@/src/generated/prisma/client";
import { NotFoundError } from "@/src/domain/errors";
import { requireCurrentUser } from "@/src/server/auth/guards";
import type { CurrentUser } from "@/src/server/auth/guards";

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

export async function createContact(input: {
  assignedUserId?: string | null;
  status?: Contact["status"];
  source?: Contact["source"];
  priority?: Contact["priority"];
  name: string;
  phone?: string | null;
  email?: string | null;
  street?: string | null;
  city?: string | null;
  zipCode?: string | null;
  country?: string | null;
}): Promise<Contact> {
  const currentUser = await requireCurrentUser();

  const duplicate = await findContactDuplicateInCompany({
    companyId: currentUser.companyId,
    phone: input.phone,
    email: input.email,
  });

  if (duplicate) {
    throw new Error("Contact with the same phone or email already exists");
  }

  return createContactForCompany({
    companyId: currentUser.companyId,
    data: input,
  });
}
