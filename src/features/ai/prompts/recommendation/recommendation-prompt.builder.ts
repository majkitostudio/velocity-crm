import type { PromptBuildInput, PromptBuildResult } from "../types/prompt-template";
import { buildRecommendationSystemPrompt } from "./recommendation-system-prompt";
import { buildRecommendationUserPrompt } from "./recommendation-user-prompt";
import {
  formatRecommendationPromptLabel,
  RECOMMENDATION_PROMPT_ID,
  RECOMMENDATION_PROMPT_VERSION,
} from "./recommendation-prompt-version";

export function buildRecommendationPrompt(input: PromptBuildInput): PromptBuildResult {
  const locale = input.locale ?? "cs";

  return {
    messages: [
      { role: "system", content: buildRecommendationSystemPrompt(locale) },
      { role: "user", content: buildRecommendationUserPrompt(input) },
    ],
    promptId: RECOMMENDATION_PROMPT_ID,
    promptVersion: RECOMMENDATION_PROMPT_VERSION,
    summary: formatRecommendationPromptLabel(RECOMMENDATION_PROMPT_VERSION),
  };
}
