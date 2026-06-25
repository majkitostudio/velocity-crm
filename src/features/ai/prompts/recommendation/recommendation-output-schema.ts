import { z } from "zod";

import type { JsonSchemaDefinition } from "@/src/features/ai/llm/types/json-schema";

export const recommendedActionTypeSchema = z.enum([
  "CALL",
  "SCHEDULE_CALLBACK",
  "CREATE_ORDER",
  "SEND_EMAIL",
  "SEND_SMS",
  "WAIT",
  "REVIEW_DATA",
  "ESCALATE",
]);

export const recommendedActionPrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const recommendedActionSchema = z.object({
  actionType: recommendedActionTypeSchema,
  title: z.string().min(5).max(120),
  rationale: z.string().min(10).max(500),
  priority: recommendedActionPrioritySchema,
  suggestedContactAt: z.string().datetime().optional(),
});

export type RecommendedAction = z.infer<typeof recommendedActionSchema>;

export const contactRecommendationSchema = z.object({
  primaryAction: recommendedActionSchema,
  alternatives: z.array(recommendedActionSchema).max(3),
  risks: z.array(z.string().min(5).max(300)).max(3),
  followUpTasks: z.array(z.string().min(5).max(300)).max(5),
  confidence: z.number().min(0).max(1),
});

export type ContactRecommendation = z.infer<typeof contactRecommendationSchema>;

const recommendedActionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["actionType", "title", "rationale", "priority"],
  properties: {
    actionType: {
      type: "string",
      enum: [
        "CALL",
        "SCHEDULE_CALLBACK",
        "CREATE_ORDER",
        "SEND_EMAIL",
        "SEND_SMS",
        "WAIT",
        "REVIEW_DATA",
        "ESCALATE",
      ],
      description: "Recommended next action type for the operator.",
    },
    title: {
      type: "string",
      minLength: 5,
      maxLength: 120,
      description: "Operator-facing headline for the recommended action.",
    },
    rationale: {
      type: "string",
      minLength: 10,
      maxLength: 500,
      description: "Why this action should be taken now.",
    },
    priority: {
      type: "string",
      enum: ["HIGH", "MEDIUM", "LOW"],
      description: "Relative priority of the action.",
    },
    suggestedContactAt: {
      type: "string",
      format: "date-time",
      description: "Optional ISO 8601 timing suggestion for outreach.",
    },
  },
} as const;

export const contactRecommendationJsonSchema: JsonSchemaDefinition = {
  type: "object",
  additionalProperties: false,
  required: ["primaryAction", "alternatives", "risks", "followUpTasks", "confidence"],
  properties: {
    primaryAction: recommendedActionJsonSchema,
    alternatives: {
      type: "array",
      maxItems: 3,
      items: recommendedActionJsonSchema,
    },
    risks: {
      type: "array",
      maxItems: 3,
      items: {
        type: "string",
        minLength: 5,
        maxLength: 300,
        description: "Decision risk derived only from the context.",
      },
    },
    followUpTasks: {
      type: "array",
      maxItems: 5,
      items: {
        type: "string",
        minLength: 5,
        maxLength: 300,
        description: "Concrete follow-up checklist item for the operator.",
      },
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Model confidence in the recommendation quality (0–1).",
    },
  },
};

export function formatContactRecommendationOutputSchemaDescription(
  locale: "cs" | "en",
): string {
  if (locale === "en") {
    return [
      "{",
      '  "primaryAction": { actionType, title, rationale, priority, suggestedContactAt? },',
      '  "alternatives": RecommendedAction[] (max 3),',
      '  "risks": string[] (max 3, each 5–300 chars),',
      '  "followUpTasks": string[] (max 5, each 5–300 chars),',
      '  "confidence": number between 0 and 1',
      "}",
    ].join("\n");
  }

  return [
    "{",
    '  "primaryAction": { actionType, title, rationale, priority, suggestedContactAt? },',
    '  "alternatives": pole RecommendedAction (max 3),',
    '  "risks": pole řetězců (max 3, každá 5–300 znaků),',
    '  "followUpTasks": pole řetězců (max 5, každá 5–300 znaků),',
    '  "confidence": číslo mezi 0 a 1',
    "}",
  ].join("\n");
}
