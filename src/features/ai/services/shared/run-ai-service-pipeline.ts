import type { LlmTaskProfile } from "@/src/features/ai/llm/types/llm-model";
import { buildLlmCompletionRequest } from "@/src/features/ai/llm/request/llm-request-builder";
import { isDomainError } from "@/src/domain/errors";
import type { PromptTemplateId } from "@/src/features/ai/prompts/types/prompt-template";

import { AiFeatureDisabledError } from "./ai-platform-errors";
import type { AiServiceExecuteInput, AiServiceExecuteResult, AiTaskService } from "./ai-task-service";
import {
  buildCacheKey,
  shouldUseCache,
  type PipelinePorts,
} from "./ai-service-pipeline.types";

const OUTPUT_SCHEMA_VERSION = 1;

function mapTaskProfileToPromptId(profile: LlmTaskProfile): PromptTemplateId {
  switch (profile) {
    case "SUMMARY":
      return "summary";
    case "RECOMMENDATION":
      return "recommendation";
    case "CALL_PREP":
      return "call-prep";
    case "COPILOT":
      return "copilot";
    case "GENERAL":
      return "general";
    default: {
      const _exhaustive: never = profile;
      return _exhaustive;
    }
  }
}

export async function runAiServicePipeline<TDto, TViewModel>(
  service: AiTaskService<TDto, TViewModel>,
  input: AiServiceExecuteInput,
  ports: PipelinePorts<TDto>,
): Promise<TViewModel> {
  const descriptor = service.descriptor;
  const correlationId = ports.correlationId.create();
  const pipelineStartedAtMs = ports.clock.nowMs();
  const flagContext = {
    companyId: input.companyId,
    userId: input.userId,
    userRole: input.userRole,
  };

  const recordMetric = async (
    outcome: import("@/src/features/ai/metrics/prompt-metrics-recorder").PromptMetricOutcome,
    latencyMs: number,
    extra?: Partial<import("@/src/features/ai/metrics/prompt-metrics-recorder").PromptMetricEvent>,
  ): Promise<void> => {
    await ports.metricsRecorder.record({
      correlationId,
      companyId: input.companyId,
      userId: input.userId,
      serviceId: descriptor.id,
      promptId: mapTaskProfileToPromptId(descriptor.taskProfile),
      promptVersion: descriptor.defaultPromptVersion,
      taskProfile: descriptor.taskProfile,
      model: extra?.model ?? { vendor: "fake", modelId: "fake-1" },
      outcome,
      latencyMs,
      occurredAt: ports.clock.now(),
      ...extra,
    });
  };

  try {
    const aiContext = await ports.contextLoader.load({
      companyId: input.companyId,
      contactId: input.contactId,
      options: service.getContextOptions(),
    });

    await ports.authorizer.authorize({
      companyId: input.companyId,
      userId: input.userId,
      userRole: input.userRole,
      contactId: input.contactId,
      minRole: descriptor.minRole,
    });

    if (!ports.featureFlags.isEnabled("ai.enabled", flagContext)) {
      throw new AiFeatureDisabledError("AI is disabled");
    }

    if (!ports.featureFlags.isEnabled(descriptor.featureFlag, flagContext)) {
      throw new AiFeatureDisabledError(
        ports.featureFlags.getReason(descriptor.featureFlag, flagContext) ??
          `Feature ${descriptor.featureFlag} is disabled`,
      );
    }

    const locale = input.locale ?? ports.config.defaultLocale;
    const contextHash = service.computeContextHash(aiContext);

    const policy = ports.modelResolver.resolve({
      descriptor,
      companyId: input.companyId,
      config: ports.config,
    });

    const { model } = ports.capabilityChecker.resolveCompatibleModel(descriptor, policy);

    const cacheKey = buildCacheKey({
      serviceId: descriptor.id,
      companyId: input.companyId,
      contactId: input.contactId,
      contextHash,
      promptVersion: descriptor.defaultPromptVersion,
      model,
      locale,
      outputSchemaVersion: OUTPUT_SCHEMA_VERSION,
    });

    if (shouldUseCache(descriptor, input.force)) {
      const cached = await ports.cacheStore.find({
        cacheKey,
        companyId: input.companyId,
        contactId: input.contactId,
        serviceId: descriptor.id,
      });

      if (cached) {
        await recordMetric("cache_hit", 0, { model });
        const result: AiServiceExecuteResult<TDto> = {
          dto: cached.payload,
          fromCache: true,
          aiLogId: cached.aiLogId,
          correlationId,
        };
        return service.toViewModel(result);
      }
    }

    const sanitizedContext = ports.sanitizer.sanitize(
      aiContext,
      service.getSanitizeOptions(),
    );

    const prompt = ports.promptBuilder.build({
      context: sanitizedContext,
      taskProfile: descriptor.taskProfile,
      locale,
      contextView: ports.config.tasks[descriptor.taskProfile]?.contextView,
      supplements: input.supplements,
      redaction: {
        includeSensitiveData: ports.config.sanitization.defaultIncludeSensitiveData,
      },
    });

    const llmRequest = buildLlmCompletionRequest({
      prompt,
      model,
      metadata: {
        taskProfile: descriptor.taskProfile,
        companyId: input.companyId,
        contactId: input.contactId,
        correlationId,
      },
    });

    const llmStartedAtMs = ports.clock.nowMs();
    const structured = await ports.gateway.completeStructured(
      llmRequest,
      service.getOutputSchema(),
    );
    const latencyMs = ports.clock.nowMs() - llmStartedAtMs;

    const occurredAt = ports.clock.now();
    const audit = await ports.auditLogger.recordSuccess({
      companyId: input.companyId,
      userId: input.userId,
      contactId: input.contactId,
      descriptor,
      correlationId,
      model,
      outputJson: JSON.stringify(structured.data),
      latencyMs,
      occurredAt,
    });

    if (descriptor.supportsCaching) {
      await ports.cacheStore.upsert({
        cacheKey,
        companyId: input.companyId,
        contactId: input.contactId,
        serviceId: descriptor.id,
        payload: structured.data,
        generatedAt: occurredAt,
        aiLogId: audit.aiLogId,
      });
    }

    await recordMetric("success", ports.clock.nowMs() - pipelineStartedAtMs, {
      model,
      usage: structured.raw.usage
        ? {
            inputTokens: structured.raw.usage.inputTokens,
            outputTokens: structured.raw.usage.outputTokens,
          }
        : undefined,
    });

    const result: AiServiceExecuteResult<TDto> = {
      dto: structured.data,
      fromCache: false,
      aiLogId: audit.aiLogId,
      correlationId,
    };

    return service.toViewModel(result);
  } catch (error) {
    const errorCode = isDomainError(error) ? error.code : "UNKNOWN";
    const occurredAt = ports.clock.now();

    await ports.auditLogger.recordFailure({
      companyId: input.companyId,
      userId: input.userId,
      contactId: input.contactId,
      descriptor,
      correlationId,
      errorCode,
      latencyMs: ports.clock.nowMs() - pipelineStartedAtMs,
      occurredAt,
    });

    const outcome =
      error instanceof AiFeatureDisabledError
        ? "feature_disabled"
        : errorCode === "AI_CAPABILITY_ERROR"
          ? "capability_error"
          : "provider_error";

    await recordMetric(outcome, ports.clock.nowMs() - pipelineStartedAtMs);
    throw error;
  }
}
