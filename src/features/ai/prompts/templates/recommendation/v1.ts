import type { PromptTemplate } from "../../types/prompt-template";
import { buildRecommendationPrompt } from "../../recommendation/recommendation-prompt.builder";
import {
  RECOMMENDATION_PROMPT_ID,
  RECOMMENDATION_PROMPT_VERSION,
} from "../../recommendation/recommendation-prompt-version";

export const recommendationPromptTemplateV1: PromptTemplate = {
  id: RECOMMENDATION_PROMPT_ID,
  version: RECOMMENDATION_PROMPT_VERSION,
  build: buildRecommendationPrompt,
};
