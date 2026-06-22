import type { AiServiceId } from "../registry/ai-service-id";
import type { LlmModelRef, LlmTaskProfile } from "../llm/types/llm-model";
import type { PromptTemplateId } from "../prompts/types/prompt-template";

export type PromptMetricOutcome =
  | "success"
  | "schema_failure"
  | "json_failure"
  | "provider_error"
  | "timeout"
  | "cache_hit"
  | "feature_disabled"
  | "capability_error";

export type PromptMetricEvent = {
  correlationId: string;
  companyId: string;
  userId?: string;
  serviceId: AiServiceId;
  promptId: PromptTemplateId;
  promptVersion: number;
  taskProfile: LlmTaskProfile;
  model: LlmModelRef;
  outcome: PromptMetricOutcome;
  latencyMs: number;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd?: number;
  };
  outputCharCount?: number;
  recommendationCount?: number;
  warningCount?: number;
  confidence?: number;
  retryAttempt?: number;
  occurredAt: string;
};

export type PromptMetricsRecorder = {
  record(event: PromptMetricEvent): Promise<void>;
};
