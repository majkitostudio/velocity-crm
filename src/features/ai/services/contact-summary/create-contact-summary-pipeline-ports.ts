import "server-only";

import { assertContactAccess } from "@/src/features/contacts/server/contacts.service";
import { buildContactAiContextForTenant } from "@/src/features/ai/context/contact-ai-context.builder";
import { defaultAiContextSanitizer } from "@/src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import { resolveAiConfig } from "@/src/features/ai/config/resolve-ai-config";
import { createEnvAiFeatureFlags } from "@/src/features/ai/flags/env-ai-feature-flags";
import { createCorrelationId } from "@/src/features/ai/llm/gateway/llm-gateway-middleware";
import { resolveModelForTask } from "@/src/features/ai/llm/policy/resolve-model-for-task";
import { noopPromptMetricsRecorder } from "@/src/features/ai/metrics/noop-prompt-metrics-recorder";
import { resolveCompatibleModel } from "@/src/features/ai/registry/ai-capability-matrix";
import { resolveModelCapabilities } from "@/src/features/ai/registry/model-capabilities";
import { buildPrompt } from "@/src/features/ai/prompts/registry";
import { getLlmGateway } from "@/src/features/ai/server/llm-gateway.service";
import type { PipelinePorts } from "@/src/features/ai/services/shared/ai-service-pipeline.types";
import { assertMinimumRole } from "@/src/features/ai/services/shared/ai-service-pipeline";

import type { ContactSummary } from "./contact-summary.schema";
import { createAiLogSummaryPersistence } from "@/src/features/ai/cache/ai-log-summary-cache-store";
import { prisma } from "@/src/server/db";

const systemClock = {
  now() {
    return new Date().toISOString();
  },
  nowMs() {
    return Date.now();
  },
};

export function createContactSummaryPipelinePorts(): PipelinePorts<ContactSummary> {
  const { cacheStore, auditLogger } = createAiLogSummaryPersistence({ prisma });

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
      async load({ companyId, contactId, options }) {
        return buildContactAiContextForTenant({
          companyId,
          contactId,
          options,
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
    cacheStore,
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
    auditLogger,
    metricsRecorder: noopPromptMetricsRecorder,
  };
}
