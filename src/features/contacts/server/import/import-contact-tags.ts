import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/domain/activity";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import { buildContactTagAddedPayload } from "@/src/features/tags/lib/tag-activity-payload-builders";
import {
  createContactTagAssignment,
  createTagForCompany,
  findTagByNameForCompany,
} from "@/src/features/tags/server/tags.repository";

import { recordContactBusinessEvent } from "../record-contact-business-event";

type TransactionClient = Prisma.TransactionClient;

export async function assignImportedContactTags(
  tx: TransactionClient,
  input: {
    companyId: string;
    contactId: string;
    actorUserId: string;
    tagNames: readonly string[];
    correlationId: string;
  },
): Promise<void> {
  if (input.tagNames.length === 0) {
    return;
  }

  for (const tagName of input.tagNames) {
    const existing = await findTagByNameForCompany(
      {
        companyId: input.companyId,
        name: tagName,
      },
      tx,
    );

    const tag =
      existing ??
      (await createTagForCompany(tx, {
        companyId: input.companyId,
        name: tagName,
      }));

    try {
      await createContactTagAssignment(tx, {
        companyId: input.companyId,
        contactId: input.contactId,
        tagId: tag.id,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        continue;
      }

      throw error;
    }

    await recordContactBusinessEvent({
      tx,
      companyId: input.companyId,
      contactId: input.contactId,
      actorUserId: input.actorUserId,
      correlationId: input.correlationId,
      occurredAt: new Date(),
      activity: {
        kind: ContactActivityKind.CONTACT_TAG_ADDED,
        payload: buildContactTagAddedPayload({
          tagId: tag.id,
          tagName: tag.name,
        }),
        sourceEntity: {
          type: ActivitySourceEntity.TAG,
          id: tag.id,
        },
      },
      audit: {
        action: AuditActions.CONTACT_UPDATED,
        entityType: AuditEntityTypes.CONTACT,
        entityId: input.contactId,
        metadata: {
          tagId: tag.id,
          tagName: tag.name,
          change: "tag_added",
          source: "csv_import",
        },
      },
    });
  }
}
