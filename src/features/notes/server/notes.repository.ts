import "server-only";

import type { Note, Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

type TransactionClient = Prisma.TransactionClient;

export async function createNoteForContact(
  client: typeof prisma | TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    authorId: string;
    body: string;
  },
): Promise<Note> {
  return client.note.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      authorId: input.authorId,
      body: input.body,
    },
  });
}
