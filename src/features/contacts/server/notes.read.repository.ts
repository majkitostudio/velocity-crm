import "server-only";

import { prisma } from "@/src/server/db";

export async function listNotesForContact(input: {
  companyId: string;
  contactId: string;
  limit?: number;
}) {
  return prisma.note.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit,
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

export async function countNotesForContact(input: {
  companyId: string;
  contactId: string;
}): Promise<number> {
  return prisma.note.count({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
  });
}
