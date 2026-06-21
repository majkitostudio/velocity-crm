import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import type { AuditAction } from "@/src/domain/events";
import { prisma } from "@/src/server/db";

import { insertAuditEvent } from "./audit.repository";

type TransactionClient = Prisma.TransactionClient;

export type AuditEventInput = {
  tx?: TransactionClient;
  companyId: string;
  actorUserId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  contactId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  const client = input.tx ?? prisma;

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
    client,
  );

  if (process.env.NODE_ENV === "development" && !input.tx) {
    console.debug("[audit]", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      contactId: input.contactId,
    });
  }
}
