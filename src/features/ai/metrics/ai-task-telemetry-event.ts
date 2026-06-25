import type { AiServiceId } from "../registry/ai-service-id";
import type { AiTaskCategory } from "../registry/ai-task-category";
import type { LlmVendor } from "../llm/types/llm-vendor";
import type { PromptTemplateId } from "../prompts/types/prompt-template";

export const AI_TELEMETRY_SOURCES = ["LIVE", "CACHE"] as const;

export type AiTelemetrySource = (typeof AI_TELEMETRY_SOURCES)[number];

export const AI_TELEMETRY_OUTCOMES = [
  "success",
  "schema_failure",
  "json_failure",
  "provider_error",
  "timeout",
  "feature_disabled",
  "capability_error",
] as const;

export type AiTelemetryOutcome = (typeof AI_TELEMETRY_OUTCOMES)[number];

export type AiTaskTelemetryEvent = {
  correlationId: string;
  companyId: string;
  userId?: string;
  serviceId: AiServiceId;
  taskCategory: AiTaskCategory;
  provider?: LlmVendor;
  model?: string;
  promptId: PromptTemplateId;
  promptVersion: number;
  source: AiTelemetrySource;
  outcome: AiTelemetryOutcome;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  occurredAt: string;
};
