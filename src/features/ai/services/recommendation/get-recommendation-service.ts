import type { PipelineClock } from "../shared/ai-service-pipeline.types";

import { AiRecommendationService } from "./recommendation.service";

const systemClock: PipelineClock = {
  now() {
    return new Date().toISOString();
  },
  nowMs() {
    return Date.now();
  },
};

let recommendationService: AiRecommendationService | null = null;

export function getRecommendationService(): AiRecommendationService {
  if (!recommendationService) {
    recommendationService = new AiRecommendationService({ clock: systemClock });
  }
  return recommendationService;
}

export function createRecommendationService(deps: {
  clock: PipelineClock;
}): AiRecommendationService {
  return new AiRecommendationService(deps);
}
