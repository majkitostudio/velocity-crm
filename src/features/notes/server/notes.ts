import "server-only";

import type { Note } from "@/src/generated/prisma/client";
import { requireCurrentUser } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

export async function createNote(input: {
  contactId: string;
  body: string;
}): Promise<Note> {
  const currentUser = await requireCurrentUser();

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

  return prisma.note.create({
    data: {
      companyId: currentUser.companyId,
      contactId: contact.id,
      authorId: currentUser.id,
      body: input.body,
    },
  });
}
