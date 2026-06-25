import "server-only";

import { assertContactAccess } from "@/src/features/contacts/server/contacts.service";
import { buildContactAiContextForTenant } from "@/src/features/ai/context/contact-ai-context.builder";
import { defaultAiContextSanitizer } from "@/src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import { resolveAiConfig } from "@/src/features/ai/config/resolve-ai-config";
import { createEnvAiFeatureFlags } from "@/src/features/ai/flags/env-ai-feature-flags";
import { createCorrelationId } from "@/src/features/ai/llm/gateway/llm-gateway-middleware";
import { resolveModelForTask } from "@/src/features/ai/llm/policy/resolve-model-for-task";
import { createAiTelemetryRecorder } from "@/src/features/ai/metrics/ai-telemetry-recorder";
import { resolveAiTelemetrySink } from "@/src/features/ai/metrics/resolve-ai-telemetry-sink";
import { resolveCompatibleModel } from "@/src/features/ai/registry/ai-capability-matrix";
import { resolveModelCapabilities } from "@/src/features/ai/registry/model-capabilities";
import { buildPrompt } from "@/src/features/ai/prompts/registry";
import { getLlmGateway } from "@/src/features/ai/server/llm-gateway.service";
import type { PipelineAuditLogger } from "./ai-service-pipeline.types";
import type { PipelinePorts } from "./ai-service-pipeline.types";
import { assertMinimumRole } from "./ai-service-pipeline";

import type { AiCacheStore } from "../../cache/ai-cache-store";

const systemClock = {
  now() {
    return new Date().toISOString();
  },
  nowMs() {
    return Date.now();
  },
};

export type CreateAiPipelinePortsOptions<TDto> = {
  cacheStore: AiCacheStore<TDto>;
  auditLogger: PipelineAuditLogger;
};

export function createAiPipelinePorts<TDto>(
  options: CreateAiPipelinePortsOptions<TDto>,
): PipelinePorts<TDto> {
  return {
    clock: systemClock,
    correlationId: {
      create() {
        return createCorrelationId();
      },
    },
    config: resolveAiConfig(),
    featureFlags: createEnvAiFeatureFlags(),
    contextLoader: {
      async load({ companyId, contactId, options: contextOptions }) {
        return buildContactAiContextForTenant({
          companyId,
          contactId,
          options: contextOptions,
        });
      },
    },
    authorizer: {
      async authorize({ companyId, userId, userRole, contactId, minRole }) {
        assertMinimumRole(userRole, minRole);
        await assertContactAccess({
          currentUser: {
            id: userId,
            companyId,
            role: userRole,
          },
          contactId,
        });
      },
    },
    cacheStore: options.cacheStore,
    sanitizer: defaultAiContextSanitizer,
    promptBuilder: {
      build(input) {
        return buildPrompt(input);
      },
    },
    modelResolver: {
      resolve({ descriptor, companyId, config }) {
        const taskConfig = config.tasks[descriptor.taskProfile];
        return resolveModelForTask({
          taskProfile: descriptor.taskProfile,
          companyId,
          hints: taskConfig?.modelPolicyHints,
        });
      },
    },
    capabilityChecker: {
      resolveCompatibleModel(descriptor, policy) {
        return resolveCompatibleModel(descriptor, policy, resolveModelCapabilities);
      },
    },
    gateway: getLlmGateway(),
    auditLogger: options.auditLogger,
    telemetryRecorder: createAiTelemetryRecorder(resolveAiTelemetrySink()),
  };
}
