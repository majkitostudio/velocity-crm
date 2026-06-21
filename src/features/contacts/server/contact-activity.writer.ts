import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import type {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/domain/activity";
import {
  type ContactActivityPayload,
  validateContactActivityPayload,
} from "@/src/features/contacts/lib/activity-payloads";

import { insertContactActivity } from "./contact-activity.repository";

type TransactionClient = Prisma.TransactionClient;

export type WriteContactActivityInput = {
  companyId: string;
  contactId: string;
  actorUserId?: string | null;
  kind: ContactActivityKind;
  occurredAt: Date;
  payload: ContactActivityPayload;
  sourceEntity?: {
    type: ActivitySourceEntity;
    id: string;
  };
  correlationId?: string | null;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function writeContactActivity(
  tx: TransactionClient,
  input: WriteContactActivityInput,
): Promise<void> {
  const payload = validateContactActivityPayload(input.kind, input.payload);

  try {
    await insertContactActivity(
      {
        companyId: input.companyId,
        contactId: input.contactId,
        actorUserId: input.actorUserId,
        kind: input.kind,
        occurredAt: input.occurredAt,
        sourceEntityType: input.sourceEntity?.type ?? null,
        sourceEntityId: input.sourceEntity?.id ?? null,
        correlationId: input.correlationId ?? null,
        payload,
      },
      tx,
    );
  } catch (error) {
    if (
      isUniqueConstraintError(error) &&
      input.sourceEntity?.type &&
      input.sourceEntity.id
    ) {
      return;
    }

    throw error;
  }
}
