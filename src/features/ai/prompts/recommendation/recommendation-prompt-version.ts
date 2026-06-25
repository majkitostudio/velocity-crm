import type { PromptTemplateId } from "../types/prompt-template";

export const RECOMMENDATION_PROMPT_ID: PromptTemplateId = "recommendation";
export const RECOMMENDATION_PROMPT_VERSION = 1;

export function formatRecommendationPromptLabel(
  version: number = RECOMMENDATION_PROMPT_VERSION,
): string {
  return `${RECOMMENDATION_PROMPT_ID}@v${version}`;
}

export const RECOMMENDATION_PROMPT_LABEL = formatRecommendationPromptLabel(
  RECOMMENDATION_PROMPT_VERSION,
);
