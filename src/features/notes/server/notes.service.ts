import "server-only";

import type { Note } from "@/src/generated/prisma/client";
import { requireCurrentUser } from "@/src/server/auth/guards";

import { assertContactAccess } from "@/src/features/contacts/server/contacts.service";
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

  return createNoteForContact({
    companyId: currentUser.companyId,
    contactId: input.contactId,
    authorId: currentUser.id,
    body: input.body,
  });
}
