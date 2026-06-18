import "server-only";

import type { Note } from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

export async function createNoteForContact(input: {
  companyId: string;
  contactId: string;
  authorId: string;
  body: string;
}): Promise<Note> {
  return prisma.note.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      authorId: input.authorId,
      body: input.body,
    },
  });
}
