import { z } from "zod";

const decimalPriceSchema = z
  .string()
  .trim()
  .regex(/^\d+([.,]\d{1,2})?$/, "Cena musí být kladné číslo s max. 2 desetinnými místy")
  .transform((value) => value.replace(",", "."))
  .refine((value) => Number(value) > 0, "Cena musí být vyšší než 0");

const optionalCategoryIdSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const createProductCategorySchema = z.object({
  name: z.string().trim().min(1, "Název kategorie je povinný").max(120),
});

export const updateProductCategorySchema = createProductCategorySchema.extend({
  categoryId: z.string().min(1),
});

export const setProductCategoryActiveSchema = z.object({
  categoryId: z.string().min(1),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Název produktu je povinný").max(160),
  price: decimalPriceSchema,
  categoryId: optionalCategoryIdSchema,
});

export const updateProductSchema = createProductSchema.extend({
  productId: z.string().min(1),
});

export const setProductActiveSchema = z.object({
  productId: z.string().min(1),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
export type SetProductCategoryActiveInput = z.infer<
  typeof setProductCategoryActiveSchema
>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SetProductActiveInput = z.infer<typeof setProductActiveSchema>;
