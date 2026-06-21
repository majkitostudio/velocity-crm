import { ContactPriority } from "@/src/generated/prisma/client";
import { z } from "zod";

import {
  validateContactName,
  validateContactPhone,
  validateOptionalContactEmail,
} from "./contact-field-validation";

export const phoneFieldSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const result = validateContactPhone(value);
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
    }
  })
  .transform((value) => {
    const result = validateContactPhone(value);
    if (!result.ok) {
      throw new Error(result.message);
    }
    return result.value;
  });

export const optionalEmailFieldSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => validateOptionalContactEmail(value))
  .superRefine((result, ctx) => {
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
    }
  })
  .transform((result) => {
    if (!result.ok) {
      throw new Error(result.message);
    }
    return result.value;
  });

export const createContactSchema = z.object({
  name: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const result = validateContactName(value);
      if (!result.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
      }
    })
    .transform((value) => {
      const result = validateContactName(value);
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result.value;
    }),
  phone: phoneFieldSchema,
  email: optionalEmailFieldSchema,
  priority: z.nativeEnum(ContactPriority).default(ContactPriority.NORMAL),
  assignedUserId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  returnTo: z.string().trim().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
