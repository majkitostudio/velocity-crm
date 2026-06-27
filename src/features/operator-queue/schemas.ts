import { z } from "zod";

export const assignContactSchema = z.object({
  contactId: z.string().min(1, "Kontakt je povinný."),
  operatorId: z.string().min(1, "Vyberte operátora."),
});
