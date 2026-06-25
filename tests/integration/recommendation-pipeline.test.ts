import assert from "node:assert/strict";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { defaultAiContextSanitizer } from "../../src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import { LlmSchemaValidationError } from "../../src/features/ai/llm/errors/llm-errors";
import { createLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { registerLlmVendorAdapter } from "../../src/features/ai/llm/adapters/vendor-registry";
import { fakeLlmVendorAdapter } from "../../src/features/ai/llm/adapters/fake/fake-llm-vendor-adapter";
import { noopPromptMetricsRecorder } from "../../src/features/ai/metrics/noop-prompt-metrics-recorder";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { buildFakeRecommendationResponse } from "../../src/features/ai/prompts/recommendation/fake-recommendation-response";
import { contactRecommendationSchema } from "../../src/features/ai/prompts/recommendation/recommendation-output-schema";
import { resolveCompatibleModel } from "../../src/features/ai/registry/ai-capability-matrix";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import { resolveModelForTask } from "../../src/features/ai/llm/policy/resolve-model-for-task";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { generateRecommendation } from "../../src/features/ai/services/recommendation/generate-recommendation";
import { createInMemoryRecommendationCache } from "../../src/features/ai/services/recommendation/ports/in-memory-recommendation-cache";
import { createNoopRecommendationAuditLogger } from "../../src/features/ai/services/recommendation/ports/noop-recommendation-audit-logger";
import type { ContactRecommendation } from "../../src/features/ai/services/recommendation/recommendation.schema";
import type { LlmVendorAdapter } from "../../src/features/ai/llm/adapters/llm-vendor-adapter";

const E2E_CONTEXT: ContactAiContext = {
  schemaVersion: 1,
  contactId: "contact-e2e-recommendation",
  companyId: "company-e2e-recommendation",
  contact: {
    id: "contact-e2e-recommendation",
    name: "E2E Recommendation",
    phone: "+420601000088",
    email: "e2e-rec@example.com",
    address: {
      street: "Test 2",
      city: "Brno",
      zipCode: "60200",
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
    workflow: { failCount: 1, failThreshold: 3, lastCall: null },
    callbacks: { open: [], recentClosed: [] },
    orders: { recent: [] },
    notes: { recent: [] },
    products: { catalog: [], purchased: [], lastPurchased: null },
  },
  history: { activities: [] },
  statistics: {
    totalCalls: 2,
    totalOrders: 0,
    totalOpenCallbacks: 0,
    totalNotes: 0,
    failCount: 1,
    successfulOrderCount: 0,
  },
};

const EXECUTE_INPUT = {
  companyId: E2E_CONTEXT.companyId,
  userId: "user-e2e-recommendation",
  userRole: "OPERATOR" as const,
  contactId: E2E_CONTEXT.contactId,
  locale: "cs" as const,
};

function createE2ePorts(
  options: {
    cache?: ReturnType<typeof createInMemoryRecommendationCache>;
    gateway?: PipelinePorts<ContactRecommendation>["gateway"];
  } = {},
): PipelinePorts<ContactRecommendation> {
  const ms = 2000;

  return {
    clock: {
      now() {
        return `2024-01-04T10:00:00.${String(ms).padStart(3, "0")}Z`;
      },
      nowMs() {
        return ms;
      },
    },
    correlationId: {
      create() {
        return "correlation-e2e-recommendation";
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
        return E2E_CONTEXT;
      },
    },
    authorizer: {
      async authorize() {},
    },
    cacheStore: options.cache ?? createInMemoryRecommendationCache(),
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
    gateway: options.gateway ?? createLlmGateway(),
    auditLogger: createNoopRecommendationAuditLogger(),
    telemetryRecorder: noopPromptMetricsRecorder,
  };
}

async function assertGenerateRecommendationExecutor() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const viewModel = await generateRecommendation(EXECUTE_INPUT, createE2ePorts());

  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.source, "LIVE");
  assert.equal(
    viewModel.primaryAction.title,
    buildFakeRecommendationResponse(E2E_CONTEXT.contactId).primaryAction.title,
  );
}

async function assertSchemaValidationFailure() {
  const invalidAdapter: LlmVendorAdapter = {
    vendor: "fake",
    capabilities: fakeLlmVendorAdapter.capabilities,
    async complete() {
      return {
        vendor: "fake",
        content: JSON.stringify({ invalid: true }),
        finishReason: "stop",
      };
    },
  };

  registerLlmVendorAdapter(invalidAdapter);

  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  try {
    await assert.rejects(
      () => generateRecommendation(EXECUTE_INPUT, createE2ePorts()),
      LlmSchemaValidationError,
    );
  } finally {
    registerLlmVendorAdapter(fakeLlmVendorAdapter);
  }
}

async function assertPromptUsesRecommendationTemplate() {
  const prompt = buildPrompt({
    context: E2E_CONTEXT,
    taskProfile: "RECOMMENDATION",
    locale: "cs",
    redaction: { includeSensitiveData: false },
  });

  assert.equal(prompt.promptId, "recommendation");
  assert.equal(prompt.summary, "recommendation@v1");
  assert.match(prompt.messages[0]?.content ?? "", /primaryAction/i);
}

async function assertSchemaParsesFakeGatewayOutput() {
  const gateway = createLlmGateway();
  const result = await gateway.completeStructured(
    {
      model: { vendor: "fake", modelId: "fake-1" },
      messages: [{ role: "user", content: "recommendation" }],
      responseFormat: { type: "json" },
      metadata: { taskProfile: "RECOMMENDATION", contactId: E2E_CONTEXT.contactId },
    },
    contactRecommendationSchema,
  );

  assert.deepEqual(result.data, buildFakeRecommendationResponse(E2E_CONTEXT.contactId));
}

async function main() {
  await assertPromptUsesRecommendationTemplate();
  await assertGenerateRecommendationExecutor();
  await assertSchemaValidationFailure();
  await assertSchemaParsesFakeGatewayOutput();
  console.log("recommendation-pipeline: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
