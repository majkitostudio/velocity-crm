import assert from "node:assert/strict";

import { z } from "zod";

import type { AiCacheStore } from "../../src/features/ai/cache/ai-cache-store";
import type { CachedAiTelemetryMetadata } from "../../src/features/ai/cache/ai-cache.types";
import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { passthroughAiContextSanitizer } from "../../src/features/ai/context/types/ai-context-sanitizer";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import {
  LlmInvalidResponseError,
  LlmSchemaValidationError,
} from "../../src/features/ai/llm/errors/llm-errors";
import { gatewayTelemetryStore } from "../../src/features/ai/llm/gateway/gateway-telemetry-store";
import {
  createAiTelemetryRecorder,
  type AiTelemetryRecorder,
} from "../../src/features/ai/metrics/ai-telemetry-recorder";
import { createCollectingAiTelemetrySink } from "../../src/features/ai/metrics/ai-telemetry-sink";
import { resolveCompatibleModel } from "../../src/features/ai/registry/ai-capability-matrix";
import { getAiServiceDescriptor } from "../../src/features/ai/registry/ai-service-registry";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import { AiCapabilityError } from "../../src/features/ai/services/shared/ai-platform-errors";
import type { AiTaskService } from "../../src/features/ai/services/shared/ai-task-service";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../../src/features/ai/services/shared/run-ai-service-pipeline";

const fakeDtoSchema = z.object({ ok: z.literal(true) });
type FakeDto = z.infer<typeof fakeDtoSchema>;

type FakeViewModel = {
  fromCache: boolean;
};

const FAKE_CONTEXT: ContactAiContext = {
  schemaVersion: 1,
  contactId: "contact-telemetry",
  companyId: "company-telemetry",
  contact: {
    id: "contact-telemetry",
    name: "Telemetry",
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
    return "telemetry-context-hash";
  },

  toViewModel(result) {
    return { fromCache: result.fromCache };
  },
};

function createTelemetryHarness(options?: {
  cachePayload?: FakeDto;
  cacheMetadata?: CachedAiTelemetryMetadata;
  gatewayError?: Error;
  capabilityError?: boolean;
  featureDisabled?: boolean;
}): {
  sink: ReturnType<typeof createCollectingAiTelemetrySink>;
  recorder: AiTelemetryRecorder;
  ports: PipelinePorts<FakeDto>;
} {
  const sink = createCollectingAiTelemetrySink();
  const recorder = createAiTelemetryRecorder(sink);
  let ms = 0;

  const cacheStore: AiCacheStore<FakeDto> = {
    async find() {
      if (!options?.cachePayload) {
        return null;
      }

      return {
        payload: options.cachePayload,
        generatedAt: "2024-01-01T00:00:00.000Z",
        aiLogId: "ailog-cache-1",
        telemetryMetadata: options.cacheMetadata,
      };
    },
    async upsert() {},
    async invalidate() {},
  };

  const ports: PipelinePorts<FakeDto> = {
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
        return "correlation-telemetry-1";
      },
    },
    config: {
      ...defaultAiConfig,
      features: {
        ...defaultAiConfig.features,
        recommendation: options?.featureDisabled !== true,
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
    sanitizer: passthroughAiContextSanitizer,
    promptBuilder: {
      build() {
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
        return {
          model: { vendor: "fake", modelId: "fake-1" },
          reason: "fake",
        };
      },
    },
    capabilityChecker: {
      resolveCompatibleModel(descriptor, policy) {
        if (options?.capabilityError) {
          throw new AiCapabilityError("Capability mismatch");
        }
        return resolveCompatibleModel(descriptor, policy, resolveModelCapabilities);
      },
    },
    gateway: {
      async completeStructured() {
        ms += 12;
        if (options?.gatewayError) {
          throw options.gatewayError;
        }

        gatewayTelemetryStore.merge("correlation-telemetry-1", {
          provider: "fake",
          modelId: "fake-1",
          promptTokens: 42,
          completionTokens: 17,
          totalTokens: 59,
          estimatedCostUsd: 0.0012,
          gatewayLatencyMs: 12,
        });

        return {
          data: { ok: true },
          raw: {
            content: '{"ok":true}',
            model: { vendor: "fake", modelId: "fake-1" },
            finishReason: "stop",
            usage: {
              inputTokens: 42,
              outputTokens: 17,
              totalTokens: 59,
            },
          },
        };
      },
    },
    auditLogger: {
      async recordSuccess() {
        return { aiLogId: "ailog-live-1" };
      },
      async recordFailure() {},
    },
    telemetryRecorder: recorder,
  };

  return { sink, recorder, ports };
}

const baseInput = {
  companyId: "company-telemetry",
  userId: "user-telemetry",
  userRole: "OPERATOR" as const,
  contactId: "contact-telemetry",
};

async function assertLiveSuccessEvent() {
  gatewayTelemetryStore.reset();
  const { sink, ports } = createTelemetryHarness();
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  await runAiServicePipeline(fakeService, baseInput, ports);

  assert.equal(sink.events.length, 1);
  const event = sink.events[0]!;
  assert.equal(event.source, "LIVE");
  assert.equal(event.outcome, "success");
  assert.equal(event.serviceId, "recommendation");
  assert.equal(event.taskCategory, "RECOMMENDATION");
  assert.equal(event.provider, "fake");
  assert.equal(event.model, "fake-1");
  assert.equal(event.promptTokens, 42);
  assert.equal(event.completionTokens, 17);
  assert.equal(event.totalTokens, 59);
  assert.equal(event.estimatedCostUsd, 0.0012);
}

async function assertCacheHitEvent() {
  const { sink, ports } = createTelemetryHarness({
    cachePayload: { ok: true },
    cacheMetadata: {
      provider: "openai",
      modelId: "gpt-4o-mini",
      promptVersion: 1,
      promptId: "recommendation",
    },
  });
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  await runAiServicePipeline(fakeService, baseInput, ports);

  assert.equal(sink.events.length, 1);
  const event = sink.events[0]!;
  assert.equal(event.source, "CACHE");
  assert.equal(event.outcome, "success");
  assert.equal(event.provider, "openai");
  assert.equal(event.model, "gpt-4o-mini");
  assert.equal(event.promptVersion, 1);
  assert.equal(event.promptTokens, undefined);
  assert.equal(event.completionTokens, undefined);
  assert.equal(event.totalTokens, undefined);
  assert.equal(event.estimatedCostUsd, undefined);
}

async function assertProviderFailureEvent() {
  gatewayTelemetryStore.reset();
  const { sink, ports } = createTelemetryHarness({
    gatewayError: new LlmInvalidResponseError("bad json", "fake"),
  });
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  await assert.rejects(() => runAiServicePipeline(fakeService, baseInput, ports));

  assert.equal(sink.events.length, 1);
  const event = sink.events[0]!;
  assert.equal(event.source, "LIVE");
  assert.equal(event.outcome, "json_failure");
  assert.equal(event.provider, undefined);
  assert.equal(event.promptTokens, undefined);
}

async function assertSchemaFailureEvent() {
  const { sink, ports } = createTelemetryHarness({
    gatewayError: new LlmSchemaValidationError("schema mismatch", "fake"),
  });
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  await assert.rejects(() => runAiServicePipeline(fakeService, baseInput, ports));

  assert.equal(sink.events[0]?.outcome, "schema_failure");
}

async function assertCapabilityFailureEvent() {
  const { sink, ports } = createTelemetryHarness({ capabilityError: true });
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  await assert.rejects(() => runAiServicePipeline(fakeService, baseInput, ports));

  assert.equal(sink.events[0]?.outcome, "capability_error");
}

async function assertFeatureDisabledEvent() {
  const { sink, ports } = createTelemetryHarness({ featureDisabled: true });
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "false";

  await assert.rejects(() => runAiServicePipeline(fakeService, baseInput, ports));

  assert.equal(sink.events[0]?.outcome, "feature_disabled");
  assert.equal(sink.events[0]?.source, "LIVE");
}

async function main() {
  await assertLiveSuccessEvent();
  await assertCacheHitEvent();
  await assertProviderFailureEvent();
  await assertSchemaFailureEvent();
  await assertCapabilityFailureEvent();
  await assertFeatureDisabledEvent();
  console.log("ai-platform-telemetry-pipeline: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
