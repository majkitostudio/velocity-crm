import assert from "node:assert/strict";

import { z } from "zod";

import type { AiCacheStore } from "../../src/features/ai/cache/ai-cache-store";
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

const fakeDtoSchema = z.object({ ok: z.literal(true) });
type FakeDto = z.infer<typeof fakeDtoSchema>;

type FakeViewModel = {
  label: string;
  fromCache: boolean;
};

const FAKE_CONTEXT: ContactAiContext = {
  schemaVersion: 1,
  contactId: "contact-fake",
  companyId: "company-fake",
  contact: {
    id: "contact-fake",
    name: "Fake",
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

const stages: string[] = [];

const fakeService: AiTaskService<FakeDto, FakeViewModel> = {
  descriptor: getAiServiceDescriptor("recommendation"),

  getContextOptions() {
    return { includeHistory: true, includeStatistics: true };
  },

  getSanitizeOptions() {
    return { includeSensitiveData: false, profile: "RECOMMENDATION" as const };
  },

  getOutputSchema() {
    return fakeDtoSchema;
  },

  computeContextHash() {
    return "fake-context-hash";
  },

  toViewModel(result) {
    return {
      label: result.dto.ok ? "fake-result" : "invalid",
      fromCache: result.fromCache,
    };
  },
};

function createInMemoryCache(): AiCacheStore<FakeDto> {
  const store = new Map<string, FakeDto>();

  return {
    async find(lookup) {
      const payload = store.get(lookup.cacheKey);
      if (!payload) {
        return null;
      }
      return {
        payload,
        generatedAt: "2024-01-01T00:00:00.000Z",
      };
    },
    async upsert(write) {
      store.set(write.cacheKey, write.payload);
    },
    async invalidate() {
      store.clear();
    },
  };
}

function createPorts(cache: AiCacheStore<FakeDto>): PipelinePorts<FakeDto> {
  let ms = 0;

  return {
    clock: {
      now() {
        return `2024-01-01T00:00:00.${String(ms).padStart(3, "0")}Z`;
      },
      nowMs() {
        return ms;
      },
    },
    correlationId: {
      create() {
        return "correlation-fake-1";
      },
    },
    config: {
      ...defaultAiConfig,
      features: {
        ...defaultAiConfig.features,
        recommendation: true,
      },
    },
    featureFlags: createEnvAiFeatureFlags(),
    contextLoader: {
      async load() {
        stages.push("load");
        return FAKE_CONTEXT;
      },
    },
    authorizer: {
      async authorize() {
        stages.push("authorize");
      },
    },
    cacheStore: cache,
    sanitizer: passthroughAiContextSanitizer,
    promptBuilder: {
      build() {
        stages.push("prompt");
        return {
          messages: [{ role: "user", content: "fake" }],
          promptId: "recommendation",
          promptVersion: 1,
          summary: "recommendation@v1",
        };
      },
    },
    modelResolver: {
      resolve() {
        stages.push("model");
        return {
          model: { vendor: "fake", modelId: "fake-1" },
          reason: "fake",
        };
      },
    },
    capabilityChecker: {
      resolveCompatibleModel(descriptor, policy) {
        stages.push("capability");
        return resolveCompatibleModel(descriptor, policy, resolveModelCapabilities);
      },
    },
    gateway: {
      async completeStructured() {
        stages.push("gateway");
        ms += 5;
        return {
          data: { ok: true },
          raw: {
            content: '{"ok":true}',
            model: { vendor: "fake", modelId: "fake-1" },
            finishReason: "stop",
          },
        };
      },
    },
    auditLogger: {
      async recordSuccess() {
        stages.push("audit-success");
        return { aiLogId: "log-fake-1" };
      },
      async recordFailure() {
        stages.push("audit-failure");
      },
    },
    metricsRecorder: noopPromptMetricsRecorder,
  };
}

async function assertPipelineMissPath() {
  stages.length = 0;
  const cache = createInMemoryCache();
  const ports = createPorts(cache);
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const viewModel = await runAiServicePipeline(
    fakeService,
    {
      companyId: "company-fake",
      userId: "user-fake",
      userRole: "OPERATOR",
      contactId: "contact-fake",
    },
    ports,
  );

  assert.deepEqual(viewModel, { label: "fake-result", fromCache: false });
  assert.deepEqual(stages, [
    "load",
    "authorize",
    "model",
    "capability",
    "prompt",
    "gateway",
    "audit-success",
  ]);
}

async function assertPipelineCacheHit() {
  stages.length = 0;
  const cache = createInMemoryCache();
  const ports = createPorts(cache);
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  await runAiServicePipeline(
    fakeService,
    {
      companyId: "company-fake",
      userId: "user-fake",
      userRole: "OPERATOR",
      contactId: "contact-fake",
    },
    ports,
  );

  stages.length = 0;
  const cachedViewModel = await runAiServicePipeline(
    fakeService,
    {
      companyId: "company-fake",
      userId: "user-fake",
      userRole: "OPERATOR",
      contactId: "contact-fake",
    },
    ports,
  );

  assert.equal(cachedViewModel.fromCache, true);
  assert.deepEqual(stages, ["load", "authorize", "model", "capability"]);
}

async function assertForceBypassesCache() {
  stages.length = 0;
  const cache = createInMemoryCache();
  const ports = createPorts(cache);
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  await runAiServicePipeline(
    fakeService,
    {
      companyId: "company-fake",
      userId: "user-fake",
      userRole: "OPERATOR",
      contactId: "contact-fake",
    },
    ports,
  );

  stages.length = 0;
  await runAiServicePipeline(
    fakeService,
    {
      companyId: "company-fake",
      userId: "user-fake",
      userRole: "OPERATOR",
      contactId: "contact-fake",
      force: true,
    },
    ports,
  );

  assert.ok(stages.includes("gateway"));
}

async function main() {
  await assertPipelineMissPath();
  await assertPipelineCacheHit();
  await assertForceBypassesCache();
  console.log("ai-platform-pipeline: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
