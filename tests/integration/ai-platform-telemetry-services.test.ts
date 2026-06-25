import assert from "node:assert/strict";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { defaultAiContextSanitizer } from "../../src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import { createLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { createGatewayTelemetryCostRecorder } from "../../src/features/ai/llm/gateway/gateway-telemetry-cost-recorder";
import { createCostAccountingMiddleware } from "../../src/features/ai/llm/gateway/middleware/cost-accounting-middleware";
import { createGatewayTelemetryMiddleware } from "../../src/features/ai/llm/gateway/middleware/gateway-telemetry-middleware";
import { resolveModelForTask } from "../../src/features/ai/llm/policy/resolve-model-for-task";
import { createAiTelemetryRecorder } from "../../src/features/ai/metrics/ai-telemetry-recorder";
import { createCollectingAiTelemetrySink } from "../../src/features/ai/metrics/ai-telemetry-sink";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { resolveCompatibleModel } from "../../src/features/ai/registry/ai-capability-matrix";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import { createContactSummaryService } from "../../src/features/ai/services/contact-summary/get-contact-summary-service";
import type { ContactSummary } from "../../src/features/ai/services/contact-summary/contact-summary.schema";
import { createInMemoryContactSummaryCache } from "../../src/features/ai/services/contact-summary/ports/in-memory-contact-summary-cache";
import { createNoopContactSummaryAuditLogger } from "../../src/features/ai/services/contact-summary/ports/noop-contact-summary-audit-logger";
import { createRecommendationService } from "../../src/features/ai/services/recommendation/get-recommendation-service";
import type { ContactRecommendation } from "../../src/features/ai/services/recommendation/recommendation.schema";
import { createInMemoryRecommendationCache } from "../../src/features/ai/services/recommendation/ports/in-memory-recommendation-cache";
import { createNoopRecommendationAuditLogger } from "../../src/features/ai/services/recommendation/ports/noop-recommendation-audit-logger";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../../src/features/ai/services/shared/run-ai-service-pipeline";

const FAKE_CONTEXT: ContactAiContext = {
  schemaVersion: 1,
  contactId: "contact-telemetry-services",
  companyId: "company-telemetry-services",
  contact: {
    id: "contact-telemetry-services",
    name: "Telemetry Services",
    phone: null,
    email: null,
    address: { street: null, city: null, zipCode: null, country: null },
    status: "LEAD",
    source: "MANUAL",
    priority: "NORMAL",
    assignedUser: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
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

function createGatewayWithTelemetry() {
  return createLlmGateway({
    middleware: [
      createGatewayTelemetryMiddleware(),
      createCostAccountingMiddleware(createGatewayTelemetryCostRecorder()),
    ],
  });
}

function createSharedPorts<TPayload>(
  sink: ReturnType<typeof createCollectingAiTelemetrySink>,
  cacheStore: PipelinePorts<TPayload>["cacheStore"],
  auditLogger: PipelinePorts<TPayload>["auditLogger"],
): PipelinePorts<TPayload> {
  return {
    clock: {
      now: () => "2024-01-01T00:00:00.000Z",
      nowMs: () => 0,
    },
    correlationId: {
      create: () => "correlation-services-telemetry",
    },
    config: {
      ...defaultAiConfig,
      features: {
        ...defaultAiConfig.features,
        contactSummary: true,
        recommendation: true,
      },
      tasks: {
        ...defaultAiConfig.tasks,
        SUMMARY: {
          ...defaultAiConfig.tasks.SUMMARY,
          modelPolicyHints: { requireStructuredOutput: true, preferLowCost: true },
        },
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
      async authorize() {},
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
    gateway: createGatewayWithTelemetry(),
    auditLogger,
    telemetryRecorder: createAiTelemetryRecorder(sink),
  };
}

async function assertSummaryTelemetry() {
  const sink = createCollectingAiTelemetrySink();
  const service = createContactSummaryService({
    clock: {
      now: () => "2024-01-01T00:00:00.000Z",
      nowMs: () => 0,
    },
  });

  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  await runAiServicePipeline(
    service,
    {
      companyId: FAKE_CONTEXT.companyId,
      userId: "user-telemetry",
      userRole: "OPERATOR",
      contactId: FAKE_CONTEXT.contactId,
    },
    createSharedPorts<ContactSummary>(
      sink,
      createInMemoryContactSummaryCache(),
      createNoopContactSummaryAuditLogger(),
    ),
  );

  assert.equal(sink.events.length, 1);
  const event = sink.events[0]!;
  assert.equal(event.serviceId, "contact-summary");
  assert.equal(event.taskCategory, "SUMMARY");
  assert.equal(event.promptId, "summary");
  assert.equal(event.source, "LIVE");
  assert.equal(event.outcome, "success");
  assert.equal(event.provider, "fake");
  assert.ok(event.promptTokens !== undefined);
}

async function assertRecommendationTelemetry() {
  const sink = createCollectingAiTelemetrySink();
  const service = createRecommendationService({
    clock: {
      now: () => "2024-01-01T00:00:00.000Z",
      nowMs: () => 0,
    },
  });

  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  await runAiServicePipeline(
    service,
    {
      companyId: FAKE_CONTEXT.companyId,
      userId: "user-telemetry",
      userRole: "OPERATOR",
      contactId: FAKE_CONTEXT.contactId,
    },
    createSharedPorts<ContactRecommendation>(
      sink,
      createInMemoryRecommendationCache(),
      createNoopRecommendationAuditLogger(),
    ),
  );

  assert.equal(sink.events.length, 1);
  const event = sink.events[0]!;
  assert.equal(event.serviceId, "recommendation");
  assert.equal(event.taskCategory, "RECOMMENDATION");
  assert.equal(event.promptId, "recommendation");
  assert.equal(event.source, "LIVE");
  assert.equal(event.outcome, "success");
}

async function assertSharedTelemetryModel() {
  const summarySink = createCollectingAiTelemetrySink();
  const recommendationSink = createCollectingAiTelemetrySink();

  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  await runAiServicePipeline(
    createContactSummaryService({
      clock: { now: () => "2024-01-01T00:00:00.000Z", nowMs: () => 0 },
    }),
    {
      companyId: FAKE_CONTEXT.companyId,
      userId: "user-telemetry",
      userRole: "OPERATOR",
      contactId: FAKE_CONTEXT.contactId,
    },
    createSharedPorts<ContactSummary>(
      summarySink,
      createInMemoryContactSummaryCache(),
      createNoopContactSummaryAuditLogger(),
    ),
  );

  await runAiServicePipeline(
    createRecommendationService({
      clock: { now: () => "2024-01-01T00:00:00.000Z", nowMs: () => 0 },
    }),
    {
      companyId: FAKE_CONTEXT.companyId,
      userId: "user-telemetry",
      userRole: "OPERATOR",
      contactId: FAKE_CONTEXT.contactId,
    },
    createSharedPorts<ContactRecommendation>(
      recommendationSink,
      createInMemoryRecommendationCache(),
      createNoopRecommendationAuditLogger(),
    ),
  );

  const summaryKeys = Object.keys(summarySink.events[0]!).sort();
  const recommendationKeys = Object.keys(recommendationSink.events[0]!).sort();
  assert.deepEqual(summaryKeys, recommendationKeys);
}

async function main() {
  await assertSummaryTelemetry();
  await assertRecommendationTelemetry();
  await assertSharedTelemetryModel();
  console.log("ai-platform-telemetry-services: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
