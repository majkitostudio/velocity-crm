import { z } from "zod";

import {
  ContactActivityKind,
  ContactCreationSource,
} from "@/src/domain/activity";

const payloadEnvelopeSchema = z.object({
  version: z.literal(1),
  summary: z.string().min(1),
});

const contactCreatedDataV1Schema = z.object({
  source: z.enum([
    ContactCreationSource.MANUAL,
    ContactCreationSource.CSV,
    ContactCreationSource.API,
  ]),
  importBatchId: z.string().optional(),
  fileName: z.string().optional(),
  rowNumber: z.number().int().positive().optional(),
});

const contactStatusChangedDataV1Schema = z.object({
  from: z.string(),
  to: z.string(),
});

const contactAssignedDataV1Schema = z.object({
  fromUserId: z.string().nullable().optional(),
  fromUserName: z.string().nullable().optional(),
  toUserId: z.string().nullable().optional(),
  toUserName: z.string().nullable().optional(),
});

const contactUpdatedChangeV1Schema = z.object({
  field: z.string(),
  from: z.string().nullable().optional(),
  to: z.string().nullable().optional(),
});

const contactUpdatedDataV1Schema = z.object({
  changes: z.array(contactUpdatedChangeV1Schema).min(1),
});

const noteCreatedDataV1Schema = z.object({
  bodyPreview: z.string(),
  authorName: z.string().nullable().optional(),
});

const callbackCreatedDataV1Schema = z.object({
  scheduledAt: z.string(),
  assigneeName: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

const callbackCompletedDataV1Schema = z.object({
  status: z.string(),
  assigneeName: z.string().nullable().optional(),
});

const callFinishedOrderSummaryV1Schema = z.object({
  id: z.string(),
  total: z.string(),
  itemCount: z.number().int().nonnegative(),
});

const callFinishedDataV1Schema = z.object({
  outcome: z.string(),
  operatorName: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  order: callFinishedOrderSummaryV1Schema.optional(),
});

const orderCreatedDataV1Schema = z.object({
  orderId: z.string(),
  total: z.string(),
  itemCount: z.number().int().nonnegative(),
  operatorName: z.string().nullable().optional(),
  status: z.string(),
});

export const contactActivityPayloadSchemasV1 = {
  [ContactActivityKind.CONTACT_CREATED]: payloadEnvelopeSchema.extend({
    data: contactCreatedDataV1Schema,
  }),
  [ContactActivityKind.CONTACT_STATUS_CHANGED]: payloadEnvelopeSchema.extend({
    data: contactStatusChangedDataV1Schema,
  }),
  [ContactActivityKind.CONTACT_ASSIGNED]: payloadEnvelopeSchema.extend({
    data: contactAssignedDataV1Schema,
  }),
  [ContactActivityKind.CONTACT_UPDATED]: payloadEnvelopeSchema.extend({
    data: contactUpdatedDataV1Schema,
  }),
  [ContactActivityKind.NOTE_CREATED]: payloadEnvelopeSchema.extend({
    data: noteCreatedDataV1Schema,
  }),
  [ContactActivityKind.CALLBACK_CREATED]: payloadEnvelopeSchema.extend({
    data: callbackCreatedDataV1Schema,
  }),
  [ContactActivityKind.CALLBACK_COMPLETED]: payloadEnvelopeSchema.extend({
    data: callbackCompletedDataV1Schema,
  }),
  [ContactActivityKind.CALL_FINISHED]: payloadEnvelopeSchema.extend({
    data: callFinishedDataV1Schema,
  }),
  [ContactActivityKind.ORDER_CREATED]: payloadEnvelopeSchema.extend({
    data: orderCreatedDataV1Schema,
  }),
} as const;

export type ContactActivityPayloadByKind = {
  [K in keyof typeof contactActivityPayloadSchemasV1]: z.infer<
    (typeof contactActivityPayloadSchemasV1)[K]
  >;
};

export type ContactActivityPayload =
  ContactActivityPayloadByKind[keyof ContactActivityPayloadByKind];

export function validateContactActivityPayload(
  kind: ContactActivityKind,
  payload: unknown,
): ContactActivityPayload {
  const schema = contactActivityPayloadSchemasV1[kind];
  return schema.parse(payload) as ContactActivityPayload;
}

/** Max note body length stored in timeline payload (ADR-009 OD-10). */
export const ACTIVITY_NOTE_BODY_PREVIEW_MAX_LENGTH = 2000;

export function truncateForActivityPreview(
  text: string,
  maxLength = ACTIVITY_NOTE_BODY_PREVIEW_MAX_LENGTH,
): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}
