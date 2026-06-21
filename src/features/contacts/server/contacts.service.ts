import "server-only";

import {
  ContactSource,
  ContactStatus,
  type Contact,
} from "@/src/generated/prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "@/src/domain/errors";
import {
  ActivitySourceEntity,
  ContactActivityKind,
  ContactCreationSource,
} from "@/src/domain/activity";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import {
  canManageCompanyData,
  requireCurrentUser,
} from "@/src/server/auth/guards";
import type { CurrentUser } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";
import { findAssignableOperatorsForCompany } from "@/src/features/callbacks/server/callbacks.repository";

import type { CreateContactInput } from "../schemas";
import { buildContactCreatedPayload } from "../lib/activity-payload-builders";
import { recordContactBusinessEvent } from "./record-contact-business-event";
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

  return prisma.$transaction(async (tx) => {
    const contact = await createContactForCompany(tx, {
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

    await recordContactBusinessEvent({
      tx,
      companyId: currentUser.companyId,
      contactId: contact.id,
      actorUserId: currentUser.id,
      occurredAt: contact.createdAt,
      activity: {
        kind: ContactActivityKind.CONTACT_CREATED,
        payload: buildContactCreatedPayload({
          source: ContactCreationSource.MANUAL,
          contactName: contact.name,
        }),
        sourceEntity: {
          type: ActivitySourceEntity.CONTACT,
          id: contact.id,
        },
      },
      audit: {
        action: AuditActions.CONTACT_CREATED,
        entityType: AuditEntityTypes.CONTACT,
        entityId: contact.id,
        metadata: {
          source: ContactSource.MANUAL,
          assignedUserId,
        },
      },
    });

    return contact;
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
