import { z } from "zod";

const scheduledAtSchema = z.string().min(1, "Vyberte datum a čas.");

const optionalNoteSchema = z
  .string()
  .trim()
  .max(2000, "Poznámka může mít maximálně 2000 znaků.")
  .optional()
  .nullable()
  .transform((value) => value || null);

const optionalAssignedUserIdSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value && value.length > 0 ? value : null));

export const createCallbackSchema = z.object({
  contactId: z.string().min(1, "Kontakt je povinný."),
  scheduledAt: scheduledAtSchema,
  note: optionalNoteSchema,
  assignedUserId: optionalAssignedUserIdSchema,
});

export const rescheduleCallbackSchema = z.object({
  callbackId: z.string().min(1, "Callback je povinný."),
  scheduledAt: scheduledAtSchema,
  note: optionalNoteSchema,
});

export const cancelCallbackSchema = z.object({
  callbackId: z.string().min(1, "Callback je povinný."),
  reason: optionalNoteSchema,
});
