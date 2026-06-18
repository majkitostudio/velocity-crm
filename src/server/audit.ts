import "server-only";

import type { AuditAction } from "@/src/domain/events";

export type AuditEventInput = {
  companyId: string;
  actorUserId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

/** Slice 9 will persist AuditEvent records. Slice 4 records in-process only. */
export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.debug("[audit]", input);
  }
}
