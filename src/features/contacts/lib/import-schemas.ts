import { z } from "zod";

import { CONTACT_FIELD_KEYS } from "./contact-fields";
import {
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_ROWS,
} from "./import-limits";

const importFieldMappingShape = Object.fromEntries(
  CONTACT_FIELD_KEYS.map((key) => [key, z.string().trim().optional()]),
) as Record<(typeof CONTACT_FIELD_KEYS)[number], z.ZodOptional<z.ZodString>>;

export const importColumnMappingSchema = z
  .object(importFieldMappingShape)
  .superRefine((mapping, context) => {
    if (!mapping.name?.trim() || !mapping.phone?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mapování jména a telefonu je povinné.",
        path: ["name"],
      });
    }
  });

export type ImportColumnMappingInput = z.infer<typeof importColumnMappingSchema>;

function enforceImportContentLimits(content: string, context: z.RefinementCtx): void {
  const byteLength = Buffer.byteLength(content, "utf8");

  if (byteLength === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Soubor je prázdný.",
    });
    return;
  }

  if (byteLength > IMPORT_MAX_FILE_BYTES) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Soubor je příliš velký. Maximum je 5 MB.",
    });
  }

  const lineCount = content
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length;

  const dataRowCount = Math.max(0, lineCount - 1);

  if (dataRowCount > IMPORT_MAX_ROWS) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Soubor obsahuje příliš mnoho řádků. Maximum je 5 000.",
    });
  }
}

export const parseImportSchema = z
  .object({
    content: z.string(),
    fileName: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    enforceImportContentLimits(value.content, context);
  });

export type ParseImportInput = z.infer<typeof parseImportSchema>;

export const validateImportSchema = z
  .object({
    content: z.string(),
    mapping: importColumnMappingSchema,
  })
  .superRefine((value, context) => {
    enforceImportContentLimits(value.content, context);
  });

export type ValidateImportInput = z.infer<typeof validateImportSchema>;

export const executeImportSchema = z
  .object({
    content: z.string(),
    mapping: importColumnMappingSchema,
    assignedUserId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    fileName: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    enforceImportContentLimits(value.content, context);
  });

export type ExecuteImportInput = z.infer<typeof executeImportSchema>;
