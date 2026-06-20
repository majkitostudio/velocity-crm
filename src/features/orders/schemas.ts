import { z } from "zod";

const orderUnitPriceSchema = z
  .string()
  .trim()
  .regex(/^\d+([.,]\d{1,2})?$/, "Cena musí být číslo s max. 2 desetinnými místy")
  .transform((value) => value.replace(",", "."));

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Produkt je povinný"),
  quantity: z.coerce.number().int().min(1, "Množství musí být alespoň 1"),
  unitPrice: orderUnitPriceSchema,
});

export const orderItemsSchema = z
  .array(orderItemSchema)
  .min(1, "Objednávka musí obsahovat alespoň jednu položku")
  .superRefine((items, context) => {
    const seenProductIds = new Set<string>();

    items.forEach((item, index) => {
      if (seenProductIds.has(item.productId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stejný produkt může být v objednávce pouze jednou",
          path: [index, "productId"],
        });
      }

      seenProductIds.add(item.productId);
    });
  });

export const orderNoteSchema = z
  .string()
  .trim()
  .max(5000, "Poznámka může mít maximálně 5000 znaků")
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const createOrderDraftSchema = z.object({
  note: orderNoteSchema,
  items: orderItemsSchema,
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderDraftInput = z.infer<typeof createOrderDraftSchema>;
