import type { z } from "zod";

import type { AppUserRole } from "@/src/domain/auth";
import type { ContactAiContext } from "@/src/features/ai/context/types/contact-ai-context";
import type { AiConfiguration } from "@/src/features/ai/config/ai-config.types";
import type { AiCacheStore } from "@/src/features/ai/cache/ai-cache-store";
import type { AiFeatureFlags } from "@/src/features/ai/flags/ai-feature-flag.types";
import type { LlmCompletionRequest } from "@/src/features/ai/llm/types/llm-request";
import type { LlmStructuredResponse } from "@/src/features/ai/llm/types/llm-response";
import type { LlmModelRef } from "@/src/features/ai/llm/types/llm-model";
import type { ModelPolicyResult } from "@/src/features/ai/llm/policy/resolve-model-for-task";
import type { AiTelemetryRecorder } from "@/src/features/ai/metrics/ai-telemetry-recorder";
import type { PromptBuildInput, PromptBuildResult } from "@/src/features/ai/prompts/types/prompt-template";
import type { CompatibleModelResult } from "@/src/features/ai/registry/ai-capability-matrix";
import type { AiServiceDescriptor } from "@/src/features/ai/registry/ai-service-descriptor";

import type { AiServiceExecuteInput } from "./ai-task-service";

export type PipelineClock = {
  now(): string;
  nowMs(): number;
};

export type PipelineCorrelationId = {
  create(): string;
};

export type PipelineContextLoader = {
  load(input: {
    companyId: string;
    contactId: string;
    options: ReturnType<
      import("./ai-task-service").AiTaskService<unknown, unknown>["getContextOptions"]
    >;
  }): Promise<ContactAiContext>;
};

export type PipelineAuthorizer = {
  authorize(input: {
    companyId: string;
    userId: string;
    userRole: AppUserRole;
    contactId: string;
    minRole: AiServiceDescriptor["minRole"];
  }): Promise<void>;
};

export type PipelineSanitizer = {
  sanitize(
    context: ContactAiContext,
    options: import("@/src/features/ai/context/types/ai-context-sanitizer").AiContextSanitizeOptions,
  ): ContactAiContext;
};

export type PipelinePromptBuilder = {
  build(input: PromptBuildInput): PromptBuildResult;
};

export type PipelineModelResolver = {
  resolve(input: {
    descriptor: AiServiceDescriptor;
    companyId: string;
    config: AiConfiguration;
  }): ModelPolicyResult;
};

export type PipelineCapabilityChecker = {
  resolveCompatibleModel(
    descriptor: AiServiceDescriptor,
    policy: ModelPolicyResult,
  ): CompatibleModelResult;
};

export type PipelineGateway = {
  completeStructured<T>(
    request: LlmCompletionRequest,
    schema: z.ZodSchema<T>,
  ): Promise<LlmStructuredResponse<T>>;
};

export type PipelineAuditLogger = {
  recordSuccess(input: {
    companyId: string;
    userId: string;
    contactId: string;
    descriptor: AiServiceDescriptor;
    correlationId: string;
    model: LlmModelRef;
    outputJson: string;
    latencyMs: number;
    occurredAt: string;
  }): Promise<{ aiLogId: string }>;

  recordFailure(input: {
    companyId: string;
    userId: string;
    contactId: string;
    descriptor: AiServiceDescriptor;
    correlationId: string;
    errorCode: string;
    latencyMs: number;
    occurredAt: string;
  }): Promise<void>;
};

export type PipelinePorts<TDto> = {
  clock: PipelineClock;
  correlationId: PipelineCorrelationId;
  config: AiConfiguration;
  featureFlags: AiFeatureFlags;
  contextLoader: PipelineContextLoader;
  authorizer: PipelineAuthorizer;
  cacheStore: AiCacheStore<TDto>;
  sanitizer: PipelineSanitizer;
  promptBuilder: PipelinePromptBuilder;
  modelResolver: PipelineModelResolver;
  capabilityChecker: PipelineCapabilityChecker;
  gateway: PipelineGateway;
  auditLogger: PipelineAuditLogger;
  telemetryRecorder: AiTelemetryRecorder;
};

export type PipelineExecutionContext = {
  input: AiServiceExecuteInput;
  correlationId: string;
  startedAtMs: number;
};

export type BuildCacheLookupInput = {
  serviceId: AiServiceDescriptor["id"];
  companyId: string;
  contactId: string;
  contextHash: string;
  promptVersion: number;
  model: LlmModelRef;
  locale: string;
  outputSchemaVersion: number;
};

export function buildCacheKey(input: BuildCacheLookupInput): string {
  const parts = [
    input.companyId,
    input.contactId,
    input.serviceId,
    input.contextHash,
    String(input.promptVersion),
    input.model.vendor,
    input.model.modelId,
    input.locale,
    String(input.outputSchemaVersion),
  ];
  return parts.join(":");
}

export type ParsedCacheKey = {
  companyId: string;
  contactId: string;
  serviceId: string;
  contextHash: string;
  promptVersion: number;
  modelVendor: string;
  modelId: string;
  locale: string;
  outputSchemaVersion: number;
};

export function parseCacheKey(cacheKey: string): ParsedCacheKey {
  const parts = cacheKey.split(":");
  if (parts.length !== 9) {
    throw new Error(`Invalid cache key format: expected 9 segments, got ${parts.length}`);
  }

  const [
    companyId,
    contactId,
    serviceId,
    contextHash,
    promptVersionRaw,
    modelVendor,
    modelId,
    locale,
    outputSchemaVersionRaw,
  ] = parts;

  const promptVersion = Number(promptVersionRaw);
  const outputSchemaVersion = Number(outputSchemaVersionRaw);

  if (!Number.isFinite(promptVersion) || !Number.isFinite(outputSchemaVersion)) {
    throw new Error("Invalid cache key format: promptVersion or outputSchemaVersion is not numeric");
  }

  return {
    companyId,
    contactId,
    serviceId,
    contextHash,
    promptVersion,
    modelVendor,
    modelId,
    locale,
    outputSchemaVersion,
  };
}

export function shouldUseCache(descriptor: AiServiceDescriptor, force?: boolean): boolean {
  return descriptor.supportsCaching && force !== true;
}

export function shouldSkipStreamingPath(descriptor: AiServiceDescriptor): boolean {
  return !descriptor.supportsStreaming;
}
