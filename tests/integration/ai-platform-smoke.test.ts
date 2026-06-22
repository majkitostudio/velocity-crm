import assert from "node:assert/strict";

import { z } from "zod";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { passthroughAiContextSanitizer } from "../../src/features/ai/context/types/ai-context-sanitizer";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import { noopPromptMetricsRecorder } from "../../src/features/ai/metrics/noop-prompt-metrics-recorder";
import { resolveCompatibleModel } from "../../src/features/ai/registry/ai-capability-matrix";
import { getAiServiceDescriptor } from "../../src/features/ai/registry/ai-service-registry";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import type { AiTaskService } from "../../src/features/ai/services/shared/ai-task-service";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../../src/features/ai/services/shared/run-ai-service-pipeline";

const schema = z.object({ ok: z.literal(true) });

const minimalContext: ContactAiContext = {
  schemaVersion: 1,
  contactId: "c1",
  companyId: "co1",
  contact: {
    id: "c1",
    name: "X",
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

const fakeTaskService: AiTaskService<{ ok: true }, { label: string }> = {
  descriptor: getAiServiceDescriptor("recommendation"),
  getContextOptions: () => ({}),
  getSanitizeOptions: () => ({ includeSensitiveData: false }),
  getOutputSchema: () => schema,
  computeContextHash: () => "hash-smoke",
  toViewModel: (result) => ({ label: result.dto.ok ? "fake-result" : "bad" }),
};

async function main() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const ports: PipelinePorts<{ ok: true }> = {
    clock: { now: () => "2024-01-01T00:00:00.000Z", nowMs: () => 0 },
    correlationId: { create: () => "smoke-correlation" },
    config: {
      ...defaultAiConfig,
      features: { ...defaultAiConfig.features, recommendation: true },
    },
    featureFlags: createEnvAiFeatureFlags(),
    contextLoader: {
      async load() {
        return minimalContext;
      },
    },
    authorizer: {
      async authorize() {
        return undefined;
      },
    },
    cacheStore: {
      async find() {
        return null;
      },
      async upsert() {
        return undefined;
      },
      async invalidate() {
        return undefined;
      },
    },
    sanitizer: passthroughAiContextSanitizer,
    promptBuilder: {
      build: () => ({
        messages: [{ role: "user", content: "x" }],
        promptId: "recommendation",
        promptVersion: 1,
        summary: "recommendation@v1",
      }),
    },
    modelResolver: {
      resolve: () => ({ model: { vendor: "fake", modelId: "fake-1" }, reason: "smoke" }),
    },
    capabilityChecker: {
      resolveCompatibleModel: (descriptor, policy) =>
        resolveCompatibleModel(descriptor, policy, resolveModelCapabilities),
    },
    gateway: {
      completeStructured: async () => ({
        data: { ok: true },
        raw: {
          content: "{}",
          model: { vendor: "fake", modelId: "fake-1" },
          finishReason: "stop",
        },
      }),
    },
    auditLogger: {
      recordSuccess: async () => ({ aiLogId: "smoke-log" }),
      recordFailure: async () => undefined,
    },
    metricsRecorder: noopPromptMetricsRecorder,
  };

  const viewModel = await runAiServicePipeline(
    fakeTaskService,
    {
      companyId: "co1",
      userId: "u1",
      userRole: "OPERATOR",
      contactId: "c1",
    },
    ports,
  );

  assert.deepEqual(viewModel, { label: "fake-result" });
  console.log("ai-platform-smoke: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
