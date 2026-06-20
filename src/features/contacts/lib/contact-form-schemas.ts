import { ContactPriority } from "@/src/generated/prisma/client";
import { z } from "zod";

import { normalizeEmail, isValidEmail } from "./email";
import {
  formatPhoneValidationMessage,
  isValidPhone,
  normalizePhone,
} from "./phone";

export const phoneFieldSchema = z
  .string()
  .trim()
  .min(1, "Telefon je povinný")
  .transform((value, context) => {
    const normalized = normalizePhone(value);

    if (!normalized) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Telefon je povinný",
      });

      return z.NEVER;
    }

    if (!isValidPhone(normalized)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: formatPhoneValidationMessage(),
      });

      return z.NEVER;
    }

    return normalized;
  });

export const optionalEmailFieldSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => normalizeEmail(value))
  .refine((value) => value === null || isValidEmail(value), {
    message: "Neplatný e-mail",
  });

export const createContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Jméno je povinné")
    .max(200, "Jméno je příliš dlouhé"),
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
