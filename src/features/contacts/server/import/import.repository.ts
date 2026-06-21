import "server-only";

import {
  ContactSource,
  ImportBatchStatus,
  type ContactImportBatch,
} from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

import type { ImportBatchStats, NormalizedContactDraft } from "./import.types";

export async function createImportBatchRecord(input: {
  companyId: string;
  actorUserId: string;
  fileName?: string | null;
  status: ImportBatchStatus;
  stats: ImportBatchStats;
}): Promise<ContactImportBatch> {
  return prisma.contactImportBatch.create({
    data: {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      fileName: input.fileName ?? null,
      status: input.status,
      stats: input.stats,
    },
  });
}

export async function createImportedContactsChunk(input: {
  companyId: string;
  assignedUserId: string | null;
  drafts: NormalizedContactDraft[];
}): Promise<string[]> {
  if (input.drafts.length === 0) {
    return [];
  }

  return prisma.$transaction(async (transaction) => {
    const createdIds: string[] = [];

    for (const draft of input.drafts) {
      const contact = await transaction.contact.create({
        data: {
          companyId: input.companyId,
          assignedUserId: input.assignedUserId,
          name: draft.name,
          phone: draft.phone,
          email: draft.email,
          status: draft.status,
          priority: draft.priority,
          street: draft.street,
          city: draft.city,
          zipCode: draft.zipCode,
          country: draft.country,
          source: ContactSource.CSV,
        },
        select: { id: true },
      });

      createdIds.push(contact.id);
    }

    return createdIds;
  });
}
