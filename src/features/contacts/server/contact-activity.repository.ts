import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import type {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/domain/activity";
import type { ContactActivityPayload } from "@/src/features/contacts/lib/activity-payloads";

type TransactionClient = Prisma.TransactionClient;

export type InsertContactActivityInput = {
  companyId: string;
  contactId: string;
  actorUserId?: string | null;
  kind: ContactActivityKind;
  occurredAt: Date;
  sourceEntityType?: ActivitySourceEntity | null;
  sourceEntityId?: string | null;
  correlationId?: string | null;
  payload: ContactActivityPayload;
};

export async function insertContactActivity(
  input: InsertContactActivityInput,
  client: TransactionClient,
): Promise<void> {
  await client.contactActivity.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      actorUserId: input.actorUserId ?? null,
      kind: input.kind,
      occurredAt: input.occurredAt,
      sourceEntityType: input.sourceEntityType ?? null,
      sourceEntityId: input.sourceEntityId ?? null,
      correlationId: input.correlationId ?? null,
      payload: input.payload as Prisma.InputJsonValue,
    },
  });
}
