import "server-only";

import { prisma } from "@/src/server/db";

export async function listNotesForContact(input: {
  companyId: string;
  contactId: string;
}) {
  return prisma.note.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
  });
}
