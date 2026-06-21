import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import type { AuditAction, AuditEntityType } from "@/src/domain/events";
import { insertAuditEvent } from "@/src/server/audit.repository";

type TransactionClient = Prisma.TransactionClient;

export type WriteAuditEventInput = {
  companyId: string;
  actorUserId?: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  contactId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent(
  tx: TransactionClient,
  input: WriteAuditEventInput,
): Promise<void> {
  await insertAuditEvent(
    {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      contactId: input.contactId,
      metadata: input.metadata,
    },
    tx,
  );
}
