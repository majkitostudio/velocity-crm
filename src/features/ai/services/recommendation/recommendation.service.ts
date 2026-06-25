import type { PipelineClock } from "../shared/ai-service-pipeline.types";
import type { AiTaskService, AiServiceExecuteResult } from "../shared/ai-task-service";
import { computeContactContextHash } from "../../context/context-hash/compute-contact-context-hash";
import { getAiTaskConfig } from "../../config/resolve-ai-config";
import { getAiServiceDescriptor } from "../../registry/ai-service-registry";
import { formatRecommendationPromptLabel } from "../../prompts/recommendation/recommendation-prompt-version";

import {
  contactRecommendationSchema,
  contactRecommendationJsonSchema,
  type ContactRecommendation,
} from "./recommendation.schema";
import {
  mapContactRecommendationToViewModel,
  type RecommendationViewModel,
} from "./recommendation.types";

export type AiRecommendationServiceDeps = {
  clock: PipelineClock;
};

export class AiRecommendationService
  implements AiTaskService<ContactRecommendation, RecommendationViewModel>
{
  readonly descriptor = getAiServiceDescriptor("recommendation");

  constructor(private readonly deps: AiRecommendationServiceDeps) {}

  getContextOptions() {
    const taskConfig = getAiTaskConfig("RECOMMENDATION");

    return {
      includeHistory: true,
      includeStatistics: true,
      limits: {
        activity: taskConfig.contextView?.maxHistoryItems ?? 30,
      },
      includeSensitiveData: false,
    };
  }

  getSanitizeOptions() {
    return {
      profile: this.descriptor.sanitizerProfile,
      includeSensitiveData: false,
    };
  }

  getOutputSchema() {
    return contactRecommendationSchema;
  }

  getLlmResponseFormat() {
    return {
      type: "json" as const,
      schema: contactRecommendationJsonSchema,
    };
  }

  computeContextHash(context: Parameters<typeof computeContactContextHash>[0]) {
    return computeContactContextHash(context);
  }

  toViewModel(
    result: AiServiceExecuteResult<ContactRecommendation>,
  ): RecommendationViewModel {
    return mapContactRecommendationToViewModel(result, {
      generatedAt: this.deps.clock.now(),
      promptLabel: formatRecommendationPromptLabel(this.descriptor.defaultPromptVersion),
    });
  }
}
