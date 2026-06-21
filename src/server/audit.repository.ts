import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/server/db";

type TransactionClient = Prisma.TransactionClient;

export type InsertAuditEventInput = {
  companyId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  contactId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function insertAuditEvent(
  input: InsertAuditEventInput,
  client: TransactionClient | typeof prisma = prisma,
): Promise<void> {
  await client.auditEvent.create({
    data: {
      companyId: input.companyId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      contactId: input.contactId ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
