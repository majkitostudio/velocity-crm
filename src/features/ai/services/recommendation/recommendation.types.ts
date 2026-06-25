import type { AiServiceExecuteResult } from "../shared/ai-task-service";

import type { ContactRecommendation, RecommendedAction } from "./recommendation.schema";

export type { RecommendedAction };

export const AI_RESULT_SOURCES = ["LIVE", "CACHE"] as const;

export type AiResultSource = (typeof AI_RESULT_SOURCES)[number];

export type RecommendationViewModelStatus = "ready";

export type RecommendationViewModel = {
  status: RecommendationViewModelStatus;
  source: AiResultSource;
  primaryAction: RecommendedAction;
  alternatives: readonly RecommendedAction[];
  risks: readonly string[];
  followUpTasks: readonly string[];
  confidence: number;
  metadata: {
    generatedAt: string;
    promptLabel: string;
    correlationId: string;
    aiLogId?: string;
  };
};

export function mapContactRecommendationToViewModel(
  result: AiServiceExecuteResult<ContactRecommendation>,
  options: {
    generatedAt: string;
    promptLabel: string;
  },
): RecommendationViewModel {
  return {
    status: "ready",
    source: result.fromCache ? "CACHE" : "LIVE",
    primaryAction: result.dto.primaryAction,
    alternatives: result.dto.alternatives,
    risks: result.dto.risks,
    followUpTasks: result.dto.followUpTasks,
    confidence: result.dto.confidence,
    metadata: {
      generatedAt: options.generatedAt,
      promptLabel: options.promptLabel,
      correlationId: result.correlationId,
      aiLogId: result.aiLogId,
    },
  };
}
