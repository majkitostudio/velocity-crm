import { buildLlmCompletionRequest } from "@/src/features/ai/llm/request/llm-request-builder";
import { gatewayTelemetryStore } from "@/src/features/ai/llm/gateway/gateway-telemetry-store";
import { isDomainError } from "@/src/domain/errors";
import { isLlmError } from "@/src/features/ai/llm/errors/llm-errors";
import type { AiTelemetryOutcome } from "@/src/features/ai/metrics/ai-task-telemetry-event";
import type { AiTaskTelemetryEvent } from "@/src/features/ai/metrics/ai-task-telemetry-event";
import { mapTaskProfileToPromptId } from "@/src/features/ai/metrics/map-task-profile-to-prompt-id";

import { AiFeatureDisabledError } from "./ai-platform-errors";
import type { AiServiceExecuteInput, AiServiceExecuteResult, AiTaskService } from "./ai-task-service";
import {
  buildCacheKey,
  shouldUseCache,
  type PipelinePorts,
} from "./ai-service-pipeline.types";

const OUTPUT_SCHEMA_VERSION = 1;

function mapErrorToTelemetryOutcome(error: unknown, errorCode: string): AiTelemetryOutcome {
  if (error instanceof AiFeatureDisabledError) {
    return "feature_disabled";
  }

  if (errorCode === "AI_CAPABILITY_ERROR") {
    return "capability_error";
  }

  if (errorCode === "LLM_SCHEMA_VALIDATION") {
    return "schema_failure";
  }

  if (errorCode === "LLM_INVALID_RESPONSE") {
    return "json_failure";
  }

  if (errorCode === "LLM_TIMEOUT") {
    return "timeout";
  }

  if (isLlmError(error)) {
    return "provider_error";
  }

  return "provider_error";
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

  const emitTelemetry = async (
    partial: Pick<AiTaskTelemetryEvent, "source" | "outcome" | "latencyMs"> &
      Partial<
        Pick<
          AiTaskTelemetryEvent,
          | "provider"
          | "model"
          | "promptVersion"
          | "promptId"
          | "promptTokens"
          | "completionTokens"
          | "totalTokens"
          | "estimatedCostUsd"
        >
      >,
  ): Promise<void> => {
    const event: AiTaskTelemetryEvent = {
      correlationId,
      companyId: input.companyId,
      userId: input.userId,
      serviceId: descriptor.id,
      taskCategory: descriptor.taskCategory,
      promptId: partial.promptId ?? mapTaskProfileToPromptId(descriptor.taskProfile),
      promptVersion: partial.promptVersion ?? descriptor.defaultPromptVersion,
      source: partial.source,
      outcome: partial.outcome,
      latencyMs: partial.latencyMs,
      occurredAt: ports.clock.now(),
      provider: partial.provider,
      model: partial.model,
      promptTokens: partial.promptTokens,
      completionTokens: partial.completionTokens,
      totalTokens: partial.totalTokens,
      estimatedCostUsd: partial.estimatedCostUsd,
    };

    await ports.telemetryRecorder.record(event);
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
        const metadata = cached.telemetryMetadata;

        await emitTelemetry({
          source: "CACHE",
          outcome: "success",
          latencyMs: ports.clock.nowMs() - pipelineStartedAtMs,
          provider: metadata?.provider,
          model: metadata?.modelId,
          promptVersion: metadata?.promptVersion,
          promptId: metadata?.promptId,
        });

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
      responseFormat: service.getLlmResponseFormat?.(),
      metadata: {
        taskProfile: descriptor.taskProfile,
        companyId: input.companyId,
        contactId: input.contactId,
        correlationId,
      },
    });

    const structured = await ports.gateway.completeStructured(
      llmRequest,
      service.getOutputSchema(),
    );

    const gatewayTelemetry = gatewayTelemetryStore.take(correlationId);

    const occurredAt = ports.clock.now();
    const audit = await ports.auditLogger.recordSuccess({
      companyId: input.companyId,
      userId: input.userId,
      contactId: input.contactId,
      descriptor,
      correlationId,
      model,
      outputJson: JSON.stringify(structured.data),
      latencyMs: gatewayTelemetry?.gatewayLatencyMs ?? 0,
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

    await emitTelemetry({
      source: "LIVE",
      outcome: "success",
      latencyMs: ports.clock.nowMs() - pipelineStartedAtMs,
      provider: gatewayTelemetry?.provider ?? structured.raw.model.vendor,
      model: gatewayTelemetry?.modelId ?? structured.raw.model.modelId,
      promptTokens: gatewayTelemetry?.promptTokens ?? structured.raw.usage?.inputTokens,
      completionTokens:
        gatewayTelemetry?.completionTokens ?? structured.raw.usage?.outputTokens,
      totalTokens: gatewayTelemetry?.totalTokens ?? structured.raw.usage?.totalTokens,
      estimatedCostUsd: gatewayTelemetry?.estimatedCostUsd,
    });

    const result: AiServiceExecuteResult<TDto> = {
      dto: structured.data,
      fromCache: false,
      aiLogId: audit.aiLogId,
      correlationId,
    };

    return service.toViewModel(result);
  } catch (error) {
    gatewayTelemetryStore.clear(correlationId);

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

    const outcome = mapErrorToTelemetryOutcome(error, errorCode);

    await emitTelemetry({
      source: "LIVE",
      outcome,
      latencyMs: ports.clock.nowMs() - pipelineStartedAtMs,
    });

    throw error;
  }
}
