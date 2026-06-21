import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import type {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/domain/activity";
import type { AuditAction, AuditEntityType } from "@/src/domain/events";
import type { ContactActivityPayload } from "@/src/features/contacts/lib/activity-payloads";

import { writeAuditEvent } from "./audit-event.writer";
import { writeContactActivity } from "./contact-activity.writer";

type TransactionClient = Prisma.TransactionClient;

export type RecordContactBusinessEventInput = {
  tx: TransactionClient;
  companyId: string;
  contactId: string;
  actorUserId?: string | null;
  correlationId?: string | null;
  occurredAt: Date;
  activity: {
    kind: ContactActivityKind;
    payload: ContactActivityPayload;
    sourceEntity?: {
      type: ActivitySourceEntity;
      id: string;
    };
  };
  audit?: {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    metadata?: Record<string, unknown>;
  };
};

/**
 * Atomically records a contact-scoped business event into projections.
 * Business decisions must be made before calling this function.
 * Returns nothing — workflows must not depend on the return value.
 */
export async function recordContactBusinessEvent(
  input: RecordContactBusinessEventInput,
): Promise<void> {
  await writeContactActivity(input.tx, {
    companyId: input.companyId,
    contactId: input.contactId,
    actorUserId: input.actorUserId,
    kind: input.activity.kind,
    occurredAt: input.occurredAt,
    payload: input.activity.payload,
    sourceEntity: input.activity.sourceEntity,
    correlationId: input.correlationId,
  });

  if (input.audit) {
    await writeAuditEvent(input.tx, {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      action: input.audit.action,
      entityType: input.audit.entityType,
      entityId: input.audit.entityId,
      contactId: input.contactId,
      metadata: input.audit.metadata,
    });
  }
}
