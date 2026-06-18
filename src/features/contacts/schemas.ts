import { z } from "zod";

export const createNoteSchema = z.object({
  contactId: z.string().min(1),
  body: z
    .string()
    .trim()
    .min(1, "Note cannot be empty")
    .max(5000, "Note is too long"),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
