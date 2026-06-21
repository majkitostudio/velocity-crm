import "server-only";

import type { Note } from "@/src/generated/prisma/client";
import {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/domain/activity";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import { requireCurrentUser } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

import { assertContactAccess } from "@/src/features/contacts/server/contacts.service";
import { buildNoteCreatedPayload } from "@/src/features/contacts/lib/activity-payload-builders";
import { recordContactBusinessEvent } from "@/src/features/contacts/server/record-contact-business-event";

import { createNoteForContact } from "./notes.repository";

export async function createNote(input: {
  contactId: string;
  body: string;
}): Promise<Note> {
  const currentUser = await requireCurrentUser();

  await assertContactAccess({
    currentUser,
    contactId: input.contactId,
  });

  return prisma.$transaction(async (tx) => {
    const note = await createNoteForContact(tx, {
      companyId: currentUser.companyId,
      contactId: input.contactId,
      authorId: currentUser.id,
      body: input.body,
    });

    await recordContactBusinessEvent({
      tx,
      companyId: currentUser.companyId,
      contactId: input.contactId,
      actorUserId: currentUser.id,
      occurredAt: note.createdAt,
      activity: {
        kind: ContactActivityKind.NOTE_CREATED,
        payload: buildNoteCreatedPayload({
          body: input.body,
          authorName: currentUser.name ?? currentUser.email ?? null,
        }),
        sourceEntity: {
          type: ActivitySourceEntity.NOTE,
          id: note.id,
        },
      },
      audit: {
        action: AuditActions.NOTE_CREATED,
        entityType: AuditEntityTypes.NOTE,
        entityId: note.id,
      },
    });

    return note;
  });
}
