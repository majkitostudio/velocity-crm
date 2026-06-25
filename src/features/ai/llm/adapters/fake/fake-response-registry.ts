import { buildFakeContactSummaryResponse } from "@/src/features/ai/prompts/summary/fake-contact-summary-response";
import { buildFakeRecommendationResponse } from "@/src/features/ai/prompts/recommendation/fake-recommendation-response";

import type { LlmTaskProfile } from "../../types/llm-model";

export type FakeJsonResponseInput = {
  contactId?: string;
};

export type FakeJsonResponseBuilder = (input: FakeJsonResponseInput) => unknown;

const FAKE_JSON_RESPONSE_BUILDERS: Partial<
  Record<LlmTaskProfile, FakeJsonResponseBuilder>
> = {
  SUMMARY: ({ contactId }) =>
    buildFakeContactSummaryResponse(contactId ?? "unknown-contact"),
  RECOMMENDATION: ({ contactId }) =>
    buildFakeRecommendationResponse(contactId ?? "unknown-contact"),
  CALL_PREP: () => ({
    talkingPoints: ["Deterministic fake call preparation."],
  }),
  COPILOT: () => ({
    message: "Deterministic fake copilot response.",
  }),
  GENERAL: () => ({
    draft: "Deterministic fake general response.",
  }),
};

export const FAKE_TEXT_RESPONSES: Record<LlmTaskProfile, string> = {
  SUMMARY: "Deterministic fake summary for contact.",
  RECOMMENDATION: "Deterministic fake recommendation.",
  CALL_PREP: "Deterministic fake call preparation notes.",
  COPILOT: "Deterministic fake copilot response.",
  GENERAL: "Deterministic fake general response.",
};

export function resolveFakeJsonResponse(
  taskProfile: LlmTaskProfile | undefined,
  input: FakeJsonResponseInput = {},
): string {
  if (taskProfile && taskProfile in FAKE_JSON_RESPONSE_BUILDERS) {
    const builder = FAKE_JSON_RESPONSE_BUILDERS[taskProfile];
    if (builder) {
      return JSON.stringify(builder(input));
    }
  }

  return JSON.stringify({ ok: true });
}

export function resolveFakeTextResponse(
  taskProfile: LlmTaskProfile | undefined,
): string | null {
  if (taskProfile && taskProfile in FAKE_TEXT_RESPONSES) {
    return FAKE_TEXT_RESPONSES[taskProfile];
  }

  return null;
}
