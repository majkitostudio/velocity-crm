import assert from "node:assert/strict";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { defaultAiContextSanitizer } from "../../src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import { defaultLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { noopPromptMetricsRecorder } from "../../src/features/ai/metrics/noop-prompt-metrics-recorder";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { resolveCompatibleModel } from "../../src/features/ai/registry/ai-capability-matrix";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import { resolveModelForTask } from "../../src/features/ai/llm/policy/resolve-model-for-task";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../../src/features/ai/services/shared/run-ai-service-pipeline";
import { createContactSummaryService } from "../../src/features/ai/services/contact-summary/get-contact-summary-service";
import { createInMemoryContactSummaryCache } from "../../src/features/ai/services/contact-summary/ports/in-memory-contact-summary-cache";
import { createNoopContactSummaryAuditLogger } from "../../src/features/ai/services/contact-summary/ports/noop-contact-summary-audit-logger";
import type { ContactSummary } from "../../src/features/ai/services/contact-summary/contact-summary.schema";

const REFRESH_CONTEXT: ContactAiContext = {
  schemaVersion: 1,
  contactId: "contact-refresh-test",
  companyId: "company-refresh-test",
  contact: {
    id: "contact-refresh-test",
    name: "Refresh Test",
    phone: "+420601000001",
    email: "refresh@example.com",
    address: {
      street: "Refresh 1",
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
    workflow: { failCount: 0, failThreshold: 3, lastCall: null },
    callbacks: { open: [], recentClosed: [] },
    orders: { recent: [] },
    notes: { recent: [] },
    products: { catalog: [], purchased: [], lastPurchased: null },
  },
  history: { activities: [] },
  statistics: {
    totalCalls: 0,
    totalOrders: 0,
    totalOpenCallbacks: 0,
    totalNotes: 0,
    failCount: 0,
    successfulOrderCount: 0,
  },
};

const EXECUTE_INPUT = {
  companyId: REFRESH_CONTEXT.companyId,
  userId: "user-refresh-test",
  userRole: "OPERATOR" as const,
  contactId: REFRESH_CONTEXT.contactId,
  locale: "cs" as const,
};

function createPorts(gatewayCallCounter: { count: number }): PipelinePorts<ContactSummary> {
  const cache = createInMemoryContactSummaryCache();

  return {
    clock: {
      now() {
        return "2024-06-25T14:00:00.100Z";
      },
      nowMs() {
        return 100;
      },
    },
    correlationId: {
      create() {
        return "correlation-refresh-test";
      },
    },
    config: {
      ...defaultAiConfig,
      features: {
        ...defaultAiConfig.features,
        contactSummary: true,
        contactSummaryRefresh: true,
      },
      tasks: {
        ...defaultAiConfig.tasks,
        SUMMARY: {
          ...defaultAiConfig.tasks.SUMMARY,
          modelPolicyHints: { requireStructuredOutput: true, preferLowCost: true },
        },
      },
    },
    featureFlags: createEnvAiFeatureFlags(),
    contextLoader: {
      async load() {
        return REFRESH_CONTEXT;
      },
    },
    authorizer: {
      async authorize() {
        // isolated refresh flow test
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
    gateway: {
      async completeStructured(request, schema) {
        gatewayCallCounter.count += 1;
        return defaultLlmGateway.completeStructured(request, schema);
      },
    },
    auditLogger: createNoopContactSummaryAuditLogger(),
    telemetryRecorder: noopPromptMetricsRecorder,
  };
}

async function assertGenerateCacheRefreshCacheFlow() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY_REFRESH = "true";

  const gatewayCallCounter = { count: 0 };
  const ports = createPorts(gatewayCallCounter);

  const service = createContactSummaryService({
    clock: {
      now: () => "2024-06-25T14:00:00.100Z",
      nowMs: () => 100,
    },
  });

  const first = await runAiServicePipeline(service, EXECUTE_INPUT, ports);
  assert.equal(first.source, "LIVE");
  assert.equal(gatewayCallCounter.count, 1);

  const cached = await runAiServicePipeline(service, EXECUTE_INPUT, ports);
  assert.equal(cached.source, "CACHE");
  assert.equal(gatewayCallCounter.count, 1, "cache hit must skip gateway");

  const refreshed = await runAiServicePipeline(service, { ...EXECUTE_INPUT, force: true }, ports);
  assert.equal(refreshed.source, "LIVE");
  assert.equal(gatewayCallCounter.count, 2, "refresh must call gateway");

  const cachedAfterRefresh = await runAiServicePipeline(service, EXECUTE_INPUT, ports);
  assert.equal(cachedAfterRefresh.source, "CACHE");
  assert.equal(gatewayCallCounter.count, 2, "post-refresh cache hit must skip gateway");
}

async function assertRefreshFeatureFlagEnvOverride() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY_REFRESH = "false";

  const flags = createEnvAiFeatureFlags();
  const ctx = {
    companyId: EXECUTE_INPUT.companyId,
    userId: EXECUTE_INPUT.userId,
    userRole: EXECUTE_INPUT.userRole,
  };

  assert.equal(flags.isEnabled("ai.contact_summary.refresh", ctx), false);
}

async function main() {
  await assertGenerateCacheRefreshCacheFlow();
  await assertRefreshFeatureFlagEnvOverride();
  console.log("contact-summary-refresh: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
