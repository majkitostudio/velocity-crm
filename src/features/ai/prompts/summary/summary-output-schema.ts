import { z } from "zod";

import type { JsonSchemaDefinition } from "@/src/features/ai/llm/types/json-schema";

export const contactSummarySchema = z.object({
  summary: z.string().min(20).max(2000),
  recommendations: z.array(z.string().min(5).max(500)).max(5),
  warnings: z.array(z.string().min(5).max(500)).max(5),
  confidence: z.number().min(0).max(1),
});

export type ContactSummary = z.infer<typeof contactSummarySchema>;

export const contactSummaryJsonSchema: JsonSchemaDefinition = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "recommendations", "warnings", "confidence"],
  properties: {
    summary: {
      type: "string",
      minLength: 20,
      maxLength: 2000,
      description: "Concise operator-facing summary of the contact situation.",
    },
    recommendations: {
      type: "array",
      maxItems: 5,
      items: {
        type: "string",
        minLength: 5,
        maxLength: 500,
        description: "Concrete next-step recommendation for the operator.",
      },
    },
    warnings: {
      type: "array",
      maxItems: 5,
      items: {
        type: "string",
        minLength: 5,
        maxLength: 500,
        description: "Risk or data-gap warning derived only from the context.",
      },
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Model confidence in the summary quality (0–1).",
    },
  },
};

export function formatContactSummaryOutputSchemaDescription(locale: "cs" | "en"): string {
  if (locale === "en") {
    return [
      "{",
      '  "summary": string (20–2000 chars),',
      '  "recommendations": string[] (max 5 items, each 5–500 chars),',
      '  "warnings": string[] (max 5 items, each 5–500 chars),',
      '  "confidence": number between 0 and 1',
      "}",
    ].join("\n");
  }

  return [
    "{",
    '  "summary": řetězec (20–2000 znaků),',
    '  "recommendations": pole řetězců (max 5 položek, každá 5–500 znaků),',
    '  "warnings": pole řetězců (max 5 položek, každá 5–500 znaků),',
    '  "confidence": číslo mezi 0 a 1',
    "}",
  ].join("\n");
}
