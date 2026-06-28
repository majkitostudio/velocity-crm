import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

type TransactionClient = Prisma.TransactionClient;

export async function findTagsForCompany(companyId: string) {
  return prisma.tag.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function findTagsForContact(input: {
  companyId: string;
  contactId: string;
}) {
  return prisma.contactTag.findMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
    },
    select: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      tag: {
        name: "asc",
      },
    },
  });
}

export async function findTagByIdForCompany(input: {
  companyId: string;
  tagId: string;
}) {
  return prisma.tag.findFirst({
    where: {
      id: input.tagId,
      companyId: input.companyId,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function findTagByNameForCompany(input: {
  companyId: string;
  name: string;
}) {
  return prisma.tag.findFirst({
    where: {
      companyId: input.companyId,
      name: {
        equals: input.name,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function createTagForCompany(
  tx: TransactionClient,
  input: {
    companyId: string;
    name: string;
  },
) {
  return tx.tag.create({
    data: {
      companyId: input.companyId,
      name: input.name,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function createContactTagAssignment(
  tx: TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    tagId: string;
  },
) {
  return tx.contactTag.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      tagId: input.tagId,
    },
    select: { id: true },
  });
}

export async function deleteContactTagAssignment(input: {
  companyId: string;
  contactId: string;
  tagId: string;
}) {
  return prisma.contactTag.deleteMany({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
      tagId: input.tagId,
    },
  });
}

export async function findContactIdsForTag(input: {
  companyId: string;
  tagId: string;
}) {
  const rows = await prisma.contactTag.findMany({
    where: {
      companyId: input.companyId,
      tagId: input.tagId,
    },
    select: { contactId: true },
  });

  return rows.map((row) => row.contactId);
}
