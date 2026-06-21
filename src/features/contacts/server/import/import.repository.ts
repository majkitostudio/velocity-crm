import "server-only";

import {
  ContactSource,
  ImportBatchStatus,
  type ContactImportBatch,
} from "@/src/generated/prisma/client";
import {
  ActivitySourceEntity,
  ContactActivityKind,
  ContactCreationSource,
} from "@/src/domain/activity";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import { prisma } from "@/src/server/db";

import { buildContactCreatedPayload } from "../../lib/activity-payload-builders";
import { recordContactBusinessEvent } from "../record-contact-business-event";
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

export async function findImportBatchByIdForCompany(input: {
  companyId: string;
  batchId: string;
}) {
  return prisma.contactImportBatch.findFirst({
    where: {
      id: input.batchId,
      companyId: input.companyId,
    },
  });
}

export async function updateImportBatchRecord(input: {
  batchId: string;
  companyId: string;
  status: ImportBatchStatus;
  stats: ImportBatchStats;
}): Promise<ContactImportBatch> {
  return prisma.contactImportBatch.update({
    where: {
      id: input.batchId,
      companyId: input.companyId,
    },
    data: {
      status: input.status,
      stats: input.stats,
    },
  });
}

export async function createImportedContactsChunk(input: {
  companyId: string;
  assignedUserId: string | null;
  actorUserId: string;
  importBatchId: string;
  fileName?: string | null;
  correlationId: string;
  rowOffset: number;
  drafts: NormalizedContactDraft[];
}): Promise<string[]> {
  if (input.drafts.length === 0) {
    return [];
  }

  return prisma.$transaction(async (transaction) => {
    const createdIds: string[] = [];

    for (const [index, draft] of input.drafts.entries()) {
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
      });

      createdIds.push(contact.id);

      await recordContactBusinessEvent({
        tx: transaction,
        companyId: input.companyId,
        contactId: contact.id,
        actorUserId: input.actorUserId,
        correlationId: input.correlationId,
        occurredAt: contact.createdAt,
        activity: {
          kind: ContactActivityKind.CONTACT_CREATED,
          payload: buildContactCreatedPayload({
            source: ContactCreationSource.CSV,
            contactName: contact.name,
            importBatchId: input.importBatchId,
            fileName: input.fileName ?? undefined,
            rowNumber: input.rowOffset + index + 1,
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
            source: ContactSource.CSV,
            importBatchId: input.importBatchId,
            rowNumber: input.rowOffset + index + 1,
          },
        },
      });
    }

    return createdIds;
  });
}
