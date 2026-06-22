import { z } from "zod";

export const contactSummarySchema = z.object({
  summary: z.string().min(20).max(2000),
  recommendations: z.array(z.string().min(5).max(500)).max(5),
  warnings: z.array(z.string().min(5).max(500)).max(5),
  confidence: z.number().min(0).max(1),
});

export type ContactSummary = z.infer<typeof contactSummarySchema>;
