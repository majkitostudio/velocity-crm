import { z } from "zod";

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Název tagu je povinný")
  .max(64, "Název tagu je příliš dlouhý");

export const assignContactTagSchema = z.object({
  contactId: z.string().min(1),
  tagId: z.string().min(1),
});

export const createContactTagSchema = z.object({
  contactId: z.string().min(1),
  name: tagNameSchema,
});

export const removeContactTagSchema = z.object({
  contactId: z.string().min(1),
  tagId: z.string().min(1),
});
