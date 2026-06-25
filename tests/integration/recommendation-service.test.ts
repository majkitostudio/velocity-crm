import assert from "node:assert/strict";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { computeContactContextHash } from "../../src/features/ai/context/context-hash/compute-contact-context-hash";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import { defaultLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { noopPromptMetricsRecorder } from "../../src/features/ai/metrics/noop-prompt-metrics-recorder";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { buildFakeRecommendationResponse } from "../../src/features/ai/prompts/recommendation/fake-recommendation-response";
import { resolveCompatibleModel } from "../../src/features/ai/registry/ai-capability-matrix";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import { resolveModelForTask } from "../../src/features/ai/llm/policy/resolve-model-for-task";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../../src/features/ai/services/shared/run-ai-service-pipeline";
import { defaultAiContextSanitizer } from "../../src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import {
  createRecommendationService,
  getRecommendationService,
} from "../../src/features/ai/services/recommendation/get-recommendation-service";
import { createInMemoryRecommendationCache } from "../../src/features/ai/services/recommendation/ports/in-memory-recommendation-cache";
import { createNoopRecommendationAuditLogger } from "../../src/features/ai/services/recommendation/ports/noop-recommendation-audit-logger";
import type { ContactRecommendation } from "../../src/features/ai/services/recommendation/recommendation.schema";

const FAKE_CONTEXT: ContactAiContext = {
  schemaVersion: 1,
  contactId: "contact-recommendation-test",
  companyId: "company-recommendation-test",
  contact: {
    id: "contact-recommendation-test",
    name: "Jan Novák",
    phone: "+420123456789",
    email: "jan@example.com",
    address: {
      street: "Hlavní 1",
      city: "Praha",
      zipCode: "11000",
      country: "CZ",
    },
    status: "LEAD",
    source: "MANUAL",
    priority: "NORMAL",
    assignedUser: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
  snapshot: {
    workflow: { failCount: 2, failThreshold: 3, lastCall: null },
    callbacks: { open: [], recentClosed: [] },
    orders: { recent: [] },
    notes: { recent: [] },
    products: { catalog: [], purchased: [], lastPurchased: null },
  },
  history: { activities: [] },
  statistics: {
    totalCalls: 5,
    totalOrders: 0,
    totalOpenCallbacks: 0,
    totalNotes: 1,
    failCount: 2,
    successfulOrderCount: 0,
  },
};

const EXPECTED_RECOMMENDATION = buildFakeRecommendationResponse(FAKE_CONTEXT.contactId);

function createPorts(cache = createInMemoryRecommendationCache()): PipelinePorts<ContactRecommendation> {
  const ms = 1000;

  return {
    clock: {
      now() {
        return `2024-01-03T12:00:00.${String(ms).padStart(3, "0")}Z`;
      },
      nowMs() {
        return ms;
      },
    },
    correlationId: {
      create() {
        return "correlation-recommendation-test";
      },
    },
    config: {
      ...defaultAiConfig,
      features: {
        ...defaultAiConfig.features,
        recommendation: true,
      },
      tasks: {
        ...defaultAiConfig.tasks,
        RECOMMENDATION: {
          ...defaultAiConfig.tasks.RECOMMENDATION,
          modelPolicyHints: { requireStructuredOutput: true, preferLowCost: true },
        },
      },
    },
    featureFlags: createEnvAiFeatureFlags(),
    contextLoader: {
      async load() {
        return FAKE_CONTEXT;
      },
    },
    authorizer: {
      async authorize() {
        // no-op for isolated service test
      },
    },
    cacheStore: cache,
    sanitizer: defaultAiContextSanitizer,
    promptBuilder: {
      build(input) {
        return buildPrompt(input);
      },
    },
    modelResolver: {
      resolve({ descriptor, companyId, config }) {
        return resolveModelForTask({
          taskProfile: descriptor.taskProfile,
          companyId,
          hints: config.tasks[descriptor.taskProfile]?.modelPolicyHints,
        });
      },
    },
    capabilityChecker: {
      resolveCompatibleModel(descriptor, policy) {
        return resolveCompatibleModel(descriptor, policy, resolveModelCapabilities);
      },
    },
    gateway: defaultLlmGateway,
    auditLogger: createNoopRecommendationAuditLogger(),
    metricsRecorder: noopPromptMetricsRecorder,
  };
}

async function assertServiceContract() {
  const service = getRecommendationService();
  assert.equal(service.descriptor.id, "recommendation");
  assert.equal(service.descriptor.taskType, "NEXT_ACTION");
  assert.equal(service.getSanitizeOptions().profile, "RECOMMENDATION");
  assert.equal(service.computeContextHash(FAKE_CONTEXT), computeContactContextHash(FAKE_CONTEXT));
  assert.equal(service.getLlmResponseFormat?.()?.type, "json");
}

async function assertLiveGeneration() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const service = createRecommendationService({
    clock: {
      now: () => "2024-01-03T12:00:00.100Z",
      nowMs: () => 100,
    },
  });

  const viewModel = await runAiServicePipeline(
    service,
    {
      companyId: FAKE_CONTEXT.companyId,
      userId: "user-recommendation-test",
      userRole: "OPERATOR",
      contactId: FAKE_CONTEXT.contactId,
    },
    createPorts(),
  );

  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.source, "LIVE");
  assert.equal(viewModel.primaryAction.title, EXPECTED_RECOMMENDATION.primaryAction.title);
  assert.equal(viewModel.confidence, EXPECTED_RECOMMENDATION.confidence);
  assert.equal(viewModel.metadata.promptLabel, "recommendation@v1");
  assert.equal(viewModel.metadata.correlationId, "correlation-recommendation-test");
}

async function assertCacheHitUsesSourceCache() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const cache = createInMemoryRecommendationCache();
  const ports = createPorts(cache);
  const service = createRecommendationService({
    clock: {
      now: () => "2024-01-03T12:00:00.200Z",
      nowMs: () => 200,
    },
  });

  const input = {
    companyId: FAKE_CONTEXT.companyId,
    userId: "user-recommendation-test",
    userRole: "OPERATOR" as const,
    contactId: FAKE_CONTEXT.contactId,
  };

  await runAiServicePipeline(service, input, ports);

  const cachedViewModel = await runAiServicePipeline(service, input, ports);
  assert.equal(cachedViewModel.source, "CACHE");
  assert.equal(
    cachedViewModel.primaryAction.actionType,
    EXPECTED_RECOMMENDATION.primaryAction.actionType,
  );
}

async function assertCacheMissAfterForce() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const cache = createInMemoryRecommendationCache();
  const ports = createPorts(cache);
  const service = createRecommendationService({
    clock: {
      now: () => "2024-01-03T12:00:00.300Z",
      nowMs: () => 300,
    },
  });

  const input = {
    companyId: FAKE_CONTEXT.companyId,
    userId: "user-recommendation-test",
    userRole: "OPERATOR" as const,
    contactId: FAKE_CONTEXT.contactId,
  };

  await runAiServicePipeline(service, input, ports);
  const forcedViewModel = await runAiServicePipeline(service, { ...input, force: true }, ports);
  assert.equal(forcedViewModel.source, "LIVE");
}

async function assertRecommendationSanitizerProfile() {
  const sanitized = defaultAiContextSanitizer.sanitize(FAKE_CONTEXT, {
    profile: "RECOMMENDATION",
    includeSensitiveData: false,
  });

  assert.equal(sanitized.contact.phone, null);
  assert.equal(sanitized.contact.email, null);
}

async function main() {
  await assertServiceContract();
  await assertRecommendationSanitizerProfile();
  await assertLiveGeneration();
  await assertCacheHitUsesSourceCache();
  await assertCacheMissAfterForce();
  console.log("recommendation-service: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
