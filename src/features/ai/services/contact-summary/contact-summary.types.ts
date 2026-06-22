import type { AiServiceExecuteResult } from "../shared/ai-task-service";

import type { ContactSummary } from "./contact-summary.schema";

export const AI_RESULT_SOURCES = ["LIVE", "CACHE"] as const;

export type AiResultSource = (typeof AI_RESULT_SOURCES)[number];

export type SummaryViewModelStatus = "ready";

export type SummaryViewModel = {
  status: SummaryViewModelStatus;
  source: AiResultSource;
  summary: string;
  recommendations: readonly string[];
  warnings: readonly string[];
  confidence: number;
  metadata: {
    generatedAt: string;
    promptLabel: string;
    correlationId: string;
    aiLogId?: string;
  };
};

export function mapContactSummaryToViewModel(
  result: AiServiceExecuteResult<ContactSummary>,
  options: {
    generatedAt: string;
    promptLabel: string;
  },
): SummaryViewModel {
  return {
    status: "ready",
    source: result.fromCache ? "CACHE" : "LIVE",
    summary: result.dto.summary,
    recommendations: result.dto.recommendations,
    warnings: result.dto.warnings,
    confidence: result.dto.confidence,
    metadata: {
      generatedAt: options.generatedAt,
      promptLabel: options.promptLabel,
      correlationId: result.correlationId,
      aiLogId: result.aiLogId,
    },
  };
}
