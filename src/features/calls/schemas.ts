import { CallOutcome } from "@/src/generated/prisma/client";
import { orderItemsSchema, orderNoteSchema } from "@/src/features/orders/schemas";
import { z } from "zod";

const completeCallBaseSchema = z.object({
  contactId: z.string().min(1),
  sourceCallbackId: z.string().min(1).optional().nullable(),
  note: z.string().trim().max(5000).optional().nullable(),
  idempotencyKey: z.string().uuid(),
});

export const completeCallLaterSchema = completeCallBaseSchema.extend({
  outcome: z.literal(CallOutcome.CALL_LATER),
});

export const completeScheduleCallSchema = completeCallBaseSchema.extend({
  outcome: z.literal(CallOutcome.SCHEDULE_CALL),
  scheduledAt: z.string().min(1, "Date and time is required"),
});

export const completeFailSchema = completeCallBaseSchema.extend({
  outcome: z.literal(CallOutcome.FAIL),
});

export const completeOrderSchema = completeCallBaseSchema.extend({
  outcome: z.literal(CallOutcome.ORDER),
  orderNote: orderNoteSchema,
  orderItems: orderItemsSchema,
});

export const completeCallSchema = z.discriminatedUnion("outcome", [
  completeOrderSchema,
  completeCallLaterSchema,
  completeScheduleCallSchema,
  completeFailSchema,
]);

export type CompleteCallFormInput = z.infer<typeof completeCallSchema>;
