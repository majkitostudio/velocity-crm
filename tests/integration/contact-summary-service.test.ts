import assert from "node:assert/strict";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { computeContactContextHash } from "../../src/features/ai/context/context-hash/compute-contact-context-hash";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import { defaultLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { noopPromptMetricsRecorder } from "../../src/features/ai/metrics/noop-prompt-metrics-recorder";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { buildFakeContactSummaryResponse } from "../../src/features/ai/prompts/summary/fake-contact-summary-response";
import { resolveCompatibleModel } from "../../src/features/ai/registry/ai-capability-matrix";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import { resolveModelForTask } from "../../src/features/ai/llm/policy/resolve-model-for-task";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../../src/features/ai/services/shared/run-ai-service-pipeline";
import { defaultAiContextSanitizer } from "../../src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import {
  createContactSummaryService,
  getContactSummaryService,
} from "../../src/features/ai/services/contact-summary/get-contact-summary-service";
import { createInMemoryContactSummaryCache } from "../../src/features/ai/services/contact-summary/ports/in-memory-contact-summary-cache";
import { createNoopContactSummaryAuditLogger } from "../../src/features/ai/services/contact-summary/ports/noop-contact-summary-audit-logger";
import type { ContactSummary } from "../../src/features/ai/services/contact-summary/contact-summary.schema";

const FAKE_CONTEXT: ContactAiContext = {
  schemaVersion: 1,
  contactId: "contact-summary-test",
  companyId: "company-summary-test",
  contact: {
    id: "contact-summary-test",
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

const EXPECTED_SUMMARY = buildFakeContactSummaryResponse(FAKE_CONTEXT.contactId);

function createPorts(cache = createInMemoryContactSummaryCache()): PipelinePorts<ContactSummary> {
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
        return "correlation-summary-test";
      },
    },
    config: {
      ...defaultAiConfig,
      features: {
        ...defaultAiConfig.features,
        contactSummary: true,
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
    auditLogger: createNoopContactSummaryAuditLogger(),
    metricsRecorder: noopPromptMetricsRecorder,
  };
}

async function assertServiceContract() {
  const service = getContactSummaryService();
  assert.equal(service.descriptor.id, "contact-summary");
  assert.equal(service.getSanitizeOptions().profile, "SUMMARY");
  assert.equal(service.computeContextHash(FAKE_CONTEXT), computeContactContextHash(FAKE_CONTEXT));
  assert.equal(service.getLlmResponseFormat?.()?.type, "json");
}

async function assertLiveGeneration() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  const service = createContactSummaryService({
    clock: {
      now: () => "2024-01-03T12:00:00.100Z",
      nowMs: () => 100,
    },
  });

  const viewModel = await runAiServicePipeline(
    service,
    {
      companyId: FAKE_CONTEXT.companyId,
      userId: "user-summary-test",
      userRole: "OPERATOR",
      contactId: FAKE_CONTEXT.contactId,
    },
    createPorts(),
  );

  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.source, "LIVE");
  assert.equal(viewModel.summary, EXPECTED_SUMMARY.summary);
  assert.equal(viewModel.confidence, EXPECTED_SUMMARY.confidence);
  assert.equal(viewModel.metadata.promptLabel, "summary@v1");
  assert.equal(viewModel.metadata.correlationId, "correlation-summary-test");
}

async function assertCacheHitUsesSourceCache() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  const cache = createInMemoryContactSummaryCache();
  const ports = createPorts(cache);
  const service = createContactSummaryService({
    clock: {
      now: () => "2024-01-03T12:00:00.200Z",
      nowMs: () => 200,
    },
  });

  const input = {
    companyId: FAKE_CONTEXT.companyId,
    userId: "user-summary-test",
    userRole: "OPERATOR" as const,
    contactId: FAKE_CONTEXT.contactId,
  };

  await runAiServicePipeline(service, input, ports);

  const cachedViewModel = await runAiServicePipeline(service, input, ports);
  assert.equal(cachedViewModel.source, "CACHE");
  assert.equal(cachedViewModel.summary, EXPECTED_SUMMARY.summary);
}

async function assertContextHashIgnoresPii() {
  const hash = computeContactContextHash(FAKE_CONTEXT);
  const mutated = {
    ...FAKE_CONTEXT,
    contact: {
      ...FAKE_CONTEXT.contact,
      phone: "+999",
      email: "other@example.com",
      name: "Different Name",
    },
  };
  assert.equal(computeContactContextHash(mutated), hash);
}

async function main() {
  await assertServiceContract();
  await assertContextHashIgnoresPii();
  await assertLiveGeneration();
  await assertCacheHitUsesSourceCache();
  console.log("contact-summary-service: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
