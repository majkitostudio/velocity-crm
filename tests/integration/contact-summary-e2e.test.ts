import assert from "node:assert/strict";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { defaultAiContextSanitizer } from "../../src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import {
  LlmInvalidResponseError,
  LlmSchemaValidationError,
} from "../../src/features/ai/llm/errors/llm-errors";
import { createLlmGateway, defaultLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { registerLlmVendorAdapter } from "../../src/features/ai/llm/adapters/vendor-registry";
import { fakeLlmVendorAdapter } from "../../src/features/ai/llm/adapters/fake/fake-llm-vendor-adapter";
import { buildLlmCompletionRequest } from "../../src/features/ai/llm/request/llm-request-builder";
import { resolveModelForTask } from "../../src/features/ai/llm/policy/resolve-model-for-task";
import { noopPromptMetricsRecorder } from "../../src/features/ai/metrics/noop-prompt-metrics-recorder";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { buildFakeContactSummaryResponse } from "../../src/features/ai/prompts/summary/fake-contact-summary-response";
import { contactSummarySchema } from "../../src/features/ai/prompts/summary/summary-output-schema";
import { AiCapabilityError } from "../../src/features/ai/services/shared/ai-platform-errors";
import { resolveCompatibleModel } from "../../src/features/ai/registry/ai-capability-matrix";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../../src/features/ai/services/shared/run-ai-service-pipeline";
import { generateContactSummary } from "../../src/features/ai/services/contact-summary/generate-contact-summary";
import { createContactSummaryService } from "../../src/features/ai/services/contact-summary/get-contact-summary-service";
import { createInMemoryContactSummaryCache } from "../../src/features/ai/services/contact-summary/ports/in-memory-contact-summary-cache";
import { createNoopContactSummaryAuditLogger } from "../../src/features/ai/services/contact-summary/ports/noop-contact-summary-audit-logger";
import type { ContactSummary } from "../../src/features/ai/services/contact-summary/contact-summary.schema";

const E2E_CONTEXT: ContactAiContext = {
  schemaVersion: 1,
  contactId: "contact-e2e-summary",
  companyId: "company-e2e-summary",
  contact: {
    id: "contact-e2e-summary",
    name: "E2E Contact",
    phone: "+420601000099",
    email: "e2e@example.com",
    address: {
      street: "Test 1",
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
  userId: "user-e2e-summary",
  userRole: "OPERATOR" as const,
  contactId: E2E_CONTEXT.contactId,
  locale: "cs" as const,
};

function createE2ePorts(
  options: {
    cache?: ReturnType<typeof createInMemoryContactSummaryCache>;
    gateway?: PipelinePorts<ContactSummary>["gateway"];
    modelResolver?: PipelinePorts<ContactSummary>["modelResolver"];
  } = {},
): PipelinePorts<ContactSummary> {
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
        return "correlation-e2e-summary";
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
        return E2E_CONTEXT;
      },
    },
    authorizer: {
      async authorize() {
        // isolated e2e — no database
      },
    },
    cacheStore: options.cache ?? createInMemoryContactSummaryCache(),
    sanitizer: defaultAiContextSanitizer,
    promptBuilder: {
      build(input) {
        return buildPrompt(input);
      },
    },
    modelResolver:
      options.modelResolver ??
      {
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
    gateway: options.gateway ?? defaultLlmGateway,
    auditLogger: createNoopContactSummaryAuditLogger(),
    telemetryRecorder: noopPromptMetricsRecorder,
  };
}

async function assertGenerateContactSummaryEndToEnd() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  const expected = buildFakeContactSummaryResponse(E2E_CONTEXT.contactId);
  const viewModel = await generateContactSummary(EXECUTE_INPUT, createE2ePorts());

  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.source, "LIVE");
  assert.equal(viewModel.summary, expected.summary);
  assert.equal(viewModel.confidence, expected.confidence);
  assert.deepEqual(viewModel.recommendations, expected.recommendations);
  assert.deepEqual(viewModel.warnings, expected.warnings);
}

async function assertStructuredOutputPath() {
  const gateway = createLlmGateway();
  const service = createContactSummaryService({
    clock: { now: () => "2024-01-04T10:00:00.000Z", nowMs: () => 0 },
  });
  const prompt = buildPrompt({
    context: E2E_CONTEXT,
    taskProfile: "SUMMARY",
    locale: "cs",
    redaction: { includeSensitiveData: false },
  });
  const policy = resolveModelForTask({
    taskProfile: "SUMMARY",
    companyId: E2E_CONTEXT.companyId,
    hints: { requireStructuredOutput: true, preferLowCost: true },
  });

  const request = buildLlmCompletionRequest({
    prompt,
    model: policy.model,
    responseFormat: service.getLlmResponseFormat?.(),
    metadata: {
      taskProfile: "SUMMARY",
      companyId: E2E_CONTEXT.companyId,
      contactId: E2E_CONTEXT.contactId,
      correlationId: "structured-output-test",
    },
  });

  const structured = await gateway.completeStructured(request, contactSummarySchema);
  const parsed = contactSummarySchema.parse(structured.data);

  assert.equal(parsed.summary, buildFakeContactSummaryResponse(E2E_CONTEXT.contactId).summary);
}

async function assertCapabilityFailureBeforeGateway() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  let gatewayCalls = 0;
  const ports = createE2ePorts({
    gateway: {
      async completeStructured() {
        gatewayCalls += 1;
        throw new Error("Gateway must not be called on capability failure");
      },
    },
    modelResolver: {
      resolve() {
        return {
          model: { vendor: "ollama", modelId: "llama3" },
          reason: "incompatible model for test",
        };
      },
    },
  });

  await assert.rejects(
    () =>
      generateContactSummary(EXECUTE_INPUT, ports),
    AiCapabilityError,
  );
  assert.equal(gatewayCalls, 0);
}

async function assertInvalidJsonMapsToLlmError() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  registerLlmVendorAdapter({
    ...fakeLlmVendorAdapter,
    async complete() {
      return {
        vendor: "fake",
        content: "not-valid-json",
        finishReason: "stop",
      };
    },
  });

  try {
    await assert.rejects(
      () => generateContactSummary(EXECUTE_INPUT, createE2ePorts()),
      LlmInvalidResponseError,
    );
  } finally {
    registerLlmVendorAdapter(fakeLlmVendorAdapter);
  }
}

async function assertInvalidSchemaMapsToLlmError() {
  const gateway = createLlmGateway();

  await assert.rejects(
    () =>
      gateway.completeStructured(
        {
          model: { vendor: "fake", modelId: "fake-1" },
          messages: [{ role: "user", content: "test" }],
          responseFormat: { type: "json" },
          metadata: { taskProfile: "GENERAL" },
        },
        contactSummarySchema,
      ),
    LlmSchemaValidationError,
  );
}

async function assertCacheSkipsGateway() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  let gatewayCalls = 0;
  const realGateway = defaultLlmGateway;
  const cache = createInMemoryContactSummaryCache();
  const ports = createE2ePorts({
    cache,
    gateway: {
      async completeStructured(request, schema) {
        gatewayCalls += 1;
        return realGateway.completeStructured(request, schema);
      },
    },
  });

  const first = await generateContactSummary(EXECUTE_INPUT, ports);
  const second = await generateContactSummary(EXECUTE_INPUT, ports);

  assert.equal(first.source, "LIVE");
  assert.equal(second.source, "CACHE");
  assert.equal(gatewayCalls, 1);
}

async function assertForceBypassesCache() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  let gatewayCalls = 0;
  const realGateway = defaultLlmGateway;
  const cache = createInMemoryContactSummaryCache();
  const ports = createE2ePorts({
    cache,
    gateway: {
      async completeStructured(request, schema) {
        gatewayCalls += 1;
        return realGateway.completeStructured(request, schema);
      },
    },
  });

  await generateContactSummary(EXECUTE_INPUT, ports);
  await generateContactSummary({ ...EXECUTE_INPUT, force: true }, ports);

  assert.equal(gatewayCalls, 2);
}

async function assertModelResolutionUsesPolicy() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  let resolvedModel: { vendor: string; modelId: string } | null = null;
  const realGateway = defaultLlmGateway;
  const ports = createE2ePorts({
    gateway: {
      async completeStructured(request, schema) {
        resolvedModel = request.model;
        return realGateway.completeStructured(request, schema);
      },
    },
  });

  await generateContactSummary(EXECUTE_INPUT, ports);

  const policy = resolveModelForTask({
    taskProfile: "SUMMARY",
    companyId: E2E_CONTEXT.companyId,
    hints: { requireStructuredOutput: true, preferLowCost: true },
  });

  assert.deepEqual(resolvedModel, policy.model);
}

async function assertPipelineUsesRealGatewayPort() {
  const service = createContactSummaryService({
    clock: { now: () => "2024-01-04T10:00:00.000Z", nowMs: () => 0 },
  });

  const viewModel = await runAiServicePipeline(
    service,
    EXECUTE_INPUT,
    createE2ePorts(),
  );

  assert.equal(viewModel.source, "LIVE");
  assert.equal(
    viewModel.summary,
    buildFakeContactSummaryResponse(E2E_CONTEXT.contactId).summary,
  );
}

async function main() {
  await assertStructuredOutputPath();
  await assertInvalidSchemaMapsToLlmError();
  await assertInvalidJsonMapsToLlmError();
  await assertCapabilityFailureBeforeGateway();
  await assertModelResolutionUsesPolicy();
  await assertPipelineUsesRealGatewayPort();
  await assertGenerateContactSummaryEndToEnd();
  await assertCacheSkipsGateway();
  await assertForceBypassesCache();
  console.log("contact-summary-e2e: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
