import type { AiServiceId } from "../registry/ai-service-id";
import type { LlmVendor } from "../llm/types/llm-vendor";
import type { PromptTemplateId } from "../prompts/types/prompt-template";

export type CachedAiTelemetryMetadata = {
  provider: LlmVendor;
  modelId: string;
  promptVersion: number;
  promptId: PromptTemplateId;
};

export type AiCacheLookup = {
  cacheKey: string;
  companyId: string;
  contactId: string;
  serviceId: AiServiceId;
};

export type CachedAiPayload<TPayload> = {
  payload: TPayload;
  generatedAt: string;
  aiLogId?: string;
  telemetryMetadata?: CachedAiTelemetryMetadata;
};

export type AiCacheWrite<TPayload> = AiCacheLookup & {
  payload: TPayload;
  generatedAt: string;
  aiLogId?: string;
};

export type AiCacheInvalidateScope = {
  companyId: string;
  contactId: string;
  serviceId?: AiServiceId;
};
