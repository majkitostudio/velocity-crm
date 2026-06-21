import { z } from "zod";

export const CONTACT_LIST_DEFAULT_LIMIT = 50;
export const CONTACT_LIST_MAX_LIMIT = 100;
export const CONTACT_LIST_MIN_SEARCH_LENGTH = 2;

export const listContactsSortValues = [
  "priority_desc",
  "created_asc",
  "created_desc",
  "updated_desc",
] as const;

export const listContactsStatusValues = [
  "ALL",
  "LEAD",
  "CUSTOMER",
  "VIP",
  "LOST",
] as const;

export const listContactsSourceValues = [
  "ALL",
  "CSV",
  "MANUAL",
  "API",
  "OTHER",
] as const;

export const listContactsPriorityValues = ["ALL", "HIGH", "NORMAL", "LOW"] as const;

export type ListContactsSort = (typeof listContactsSortValues)[number];

export const listContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(CONTACT_LIST_MAX_LIMIT)
    .default(CONTACT_LIST_DEFAULT_LIMIT),
  sort: z.enum(listContactsSortValues).default("priority_desc"),
  status: z.enum(listContactsStatusValues).default("ALL"),
  source: z.enum(listContactsSourceValues).default("ALL"),
  priority: z.enum(listContactsPriorityValues).default("ALL"),
  operator: z.string().trim().optional(),
  q: z.string().trim().optional(),
  importBatch: z.string().trim().min(1).optional(),
});

export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;

export const createNoteSchema = z.object({
  contactId: z.string().min(1),
  body: z
    .string()
    .trim()
    .min(1, "Note cannot be empty")
    .max(5000, "Note is too long"),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export {
  createContactSchema,
  optionalEmailFieldSchema,
  phoneFieldSchema,
  type CreateContactInput,
} from "./lib/contact-form-schemas";

export {
  executeImportSchema,
  importColumnMappingSchema,
  parseImportSchema,
  validateImportSchema,
  type ExecuteImportInput,
  type ImportColumnMappingInput,
  type ParseImportInput,
  type ValidateImportInput,
} from "./lib/import-schemas";
