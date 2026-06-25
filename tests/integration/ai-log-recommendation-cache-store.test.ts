import assert from "node:assert/strict";

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { computeContactContextHash } from "../../src/features/ai/context/context-hash/compute-contact-context-hash";
import { defaultAiContextSanitizer } from "../../src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import { createAiLogRecommendationPersistence } from "../../src/features/ai/cache/ai-log-recommendation-cache-persistence";
import { resolveCacheTtlForTask } from "../../src/features/ai/config/resolve-ai-config";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import { defaultLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { noopPromptMetricsRecorder } from "../../src/features/ai/metrics/noop-prompt-metrics-recorder";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { buildFakeRecommendationResponse } from "../../src/features/ai/prompts/recommendation/fake-recommendation-response";
import { contactRecommendationSchema } from "../../src/features/ai/prompts/recommendation/recommendation-output-schema";
import { resolveCompatibleModel } from "../../src/features/ai/registry/ai-capability-matrix";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import { resolveModelForTask } from "../../src/features/ai/llm/policy/resolve-model-for-task";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { buildCacheKey } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../../src/features/ai/services/shared/run-ai-service-pipeline";
import { createRecommendationService } from "../../src/features/ai/services/recommendation/get-recommendation-service";
import type { ContactRecommendation } from "../../src/features/ai/services/recommendation/recommendation.schema";
import { PrismaClient } from "../../src/generated/prisma/client";

const SEED_COMPANY_ID = "seed-company-velocity";
const SEED_CONTACT_ID = "seed-contact-lead-normal";
const SEED_OPERATOR_EMAIL = "operator@velocity.local";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function buildBaseContext(): ContactAiContext {
  return {
    schemaVersion: 1,
    contactId: SEED_CONTACT_ID,
    companyId: SEED_COMPANY_ID,
    contact: {
      id: SEED_CONTACT_ID,
      name: "Seed Lead Normal",
      phone: "+420601111111",
      email: "lead-normal@example.com",
      address: {
        street: "Seed Street 1",
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
}

function createPorts(options: {
  context: ContactAiContext;
  persistence: ReturnType<typeof createAiLogRecommendationPersistence>;
  gatewayCallCounter: { count: number };
  correlationId: string;
  clockMs: number;
}): PipelinePorts<ContactRecommendation> {
  return {
    clock: {
      now() {
        return `2024-06-25T12:00:00.${String(options.clockMs).padStart(3, "0")}Z`;
      },
      nowMs() {
        return options.clockMs;
      },
    },
    correlationId: {
      create() {
        return options.correlationId;
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
        return options.context;
      },
    },
    authorizer: {
      async authorize() {},
    },
    cacheStore: options.persistence.cacheStore,
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
        options.gatewayCallCounter.count += 1;
        return defaultLlmGateway.completeStructured(request, schema);
      },
    },
    auditLogger: options.persistence.auditLogger,
    telemetryRecorder: noopPromptMetricsRecorder,
  };
}

async function resolveOperatorUserId(): Promise<string> {
  const operator = await prisma.user.findFirst({
    where: { email: SEED_OPERATOR_EMAIL },
    select: { id: true },
  });

  if (!operator) {
    throw new Error(`Seed operator not found: ${SEED_OPERATOR_EMAIL}`);
  }

  return operator.id;
}

async function deleteAiLogs(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await prisma.aiLog.deleteMany({
    where: {
      id: { in: [...ids] },
      companyId: SEED_COMPANY_ID,
      taskType: "NEXT_ACTION",
    },
  });
}

async function assertRecommendationCacheTtlConfig() {
  const ttl = resolveCacheTtlForTask("RECOMMENDATION");
  assert.equal(ttl.ttlMs, defaultAiConfig.cache.defaultCacheTtlMs);
  assert.ok(ttl.hardExpireMs > ttl.ttlMs);
}

async function assertCacheMissThenHit() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const operatorUserId = await resolveOperatorUserId();
  const createdLogIds: string[] = [];
  const gatewayCallCounter = { count: 0 };
  const context = buildBaseContext();
  const persistence = createAiLogRecommendationPersistence({ prisma });
  const service = createRecommendationService({
    clock: {
      now: () => "2024-06-25T12:00:00.100Z",
      nowMs: () => 100,
    },
  });

  const input = {
    companyId: SEED_COMPANY_ID,
    userId: operatorUserId,
    userRole: "OPERATOR" as const,
    contactId: SEED_CONTACT_ID,
    locale: "cs" as const,
  };

  const ports = createPorts({
    context,
    persistence,
    gatewayCallCounter,
    correlationId: "ailog-rec-cache-test-miss-hit",
    clockMs: 100,
  });

  const liveViewModel = await runAiServicePipeline(service, input, ports);
  assert.equal(liveViewModel.source, "LIVE");
  assert.equal(gatewayCallCounter.count, 1);
  if (liveViewModel.metadata.aiLogId) {
    createdLogIds.push(liveViewModel.metadata.aiLogId);
  }

  const row = await prisma.aiLog.findUnique({
    where: { id: liveViewModel.metadata.aiLogId! },
    select: { taskType: true, output: true, status: true },
  });
  assert.equal(row?.taskType, "NEXT_ACTION");
  assert.equal(row?.status, "SUCCESS");
  contactRecommendationSchema.parse(JSON.parse(row!.output));

  const cachedViewModel = await runAiServicePipeline(service, input, ports);
  assert.equal(cachedViewModel.source, "CACHE");
  assert.equal(gatewayCallCounter.count, 1, "gateway must not be called on cache hit");
  assert.equal(
    cachedViewModel.primaryAction.title,
    liveViewModel.primaryAction.title,
  );

  await deleteAiLogs(createdLogIds);
}

async function assertContextHashChangeCreatesNewRecord() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const operatorUserId = await resolveOperatorUserId();
  const createdLogIds: string[] = [];
  const gatewayCallCounter = { count: 0 };
  const context = buildBaseContext();
  const persistence = createAiLogRecommendationPersistence({ prisma });
  const service = createRecommendationService({
    clock: {
      now: () => "2024-06-25T12:00:00.200Z",
      nowMs: () => 200,
    },
  });

  const input = {
    companyId: SEED_COMPANY_ID,
    userId: operatorUserId,
    userRole: "OPERATOR" as const,
    contactId: SEED_CONTACT_ID,
    locale: "cs" as const,
  };

  const ports = createPorts({
    context,
    persistence,
    gatewayCallCounter,
    correlationId: "ailog-rec-cache-test-hash-change",
    clockMs: 200,
  });

  const firstViewModel = await runAiServicePipeline(service, input, ports);
  assert.equal(firstViewModel.source, "LIVE");
  if (firstViewModel.metadata.aiLogId) {
    createdLogIds.push(firstViewModel.metadata.aiLogId);
  }

  const originalHash = computeContactContextHash(context);
  context.snapshot.workflow.failCount = 2;
  context.statistics.failCount = 2;
  const changedHash = computeContactContextHash(context);
  assert.notEqual(changedHash, originalHash);

  const secondViewModel = await runAiServicePipeline(service, input, ports);
  assert.equal(secondViewModel.source, "LIVE");
  assert.equal(gatewayCallCounter.count, 2);
  if (secondViewModel.metadata.aiLogId) {
    createdLogIds.push(secondViewModel.metadata.aiLogId);
  }

  context.snapshot.workflow.failCount = 0;
  context.statistics.failCount = 0;
  const thirdViewModel = await runAiServicePipeline(service, input, ports);
  assert.equal(thirdViewModel.source, "CACHE");
  assert.equal(gatewayCallCounter.count, 2);
  assert.equal(thirdViewModel.primaryAction.title, firstViewModel.primaryAction.title);
  assert.equal(
    thirdViewModel.primaryAction.title,
    buildFakeRecommendationResponse(SEED_CONTACT_ID).primaryAction.title,
  );

  await deleteAiLogs(createdLogIds);
}

async function assertCacheStoreFindByContextHash() {
  const operatorUserId = await resolveOperatorUserId();
  const createdLogIds: string[] = [];
  const context = buildBaseContext();
  const persistence = createAiLogRecommendationPersistence({ prisma });
  const contextHash = computeContactContextHash(context);
  const expected = buildFakeRecommendationResponse(SEED_CONTACT_ID);

  const service = createRecommendationService({
    clock: {
      now: () => "2024-06-25T12:00:00.300Z",
      nowMs: () => 300,
    },
  });

  const ports = createPorts({
    context,
    persistence,
    gatewayCallCounter: { count: 0 },
    correlationId: "ailog-rec-cache-test-direct-find",
    clockMs: 300,
  });

  const input = {
    companyId: SEED_COMPANY_ID,
    userId: operatorUserId,
    userRole: "OPERATOR" as const,
    contactId: SEED_CONTACT_ID,
    locale: "cs" as const,
  };

  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const liveViewModel = await runAiServicePipeline(service, input, ports);
  if (liveViewModel.metadata.aiLogId) {
    createdLogIds.push(liveViewModel.metadata.aiLogId);
  }

  const miss = await persistence.cacheStore.find({
    cacheKey: `invalid:${SEED_CONTACT_ID}:recommendation:${contextHash}:1:fake:fake-1:cs:1`,
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CONTACT_ID,
    serviceId: "recommendation",
  });
  assert.equal(miss, null);

  const hit = await persistence.cacheStore.find({
    cacheKey: buildCacheKey({
      serviceId: "recommendation",
      companyId: SEED_COMPANY_ID,
      contactId: SEED_CONTACT_ID,
      contextHash,
      promptVersion: 1,
      model: { vendor: "fake", modelId: "fake-1" },
      locale: "cs",
      outputSchemaVersion: 1,
    }),
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CONTACT_ID,
    serviceId: "recommendation",
  });

  assert.ok(hit);
  assert.equal(hit?.payload.primaryAction.title, expected.primaryAction.title);

  await deleteAiLogs(createdLogIds);
}

async function assertForceRefreshUsesNewestCacheEntry() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const operatorUserId = await resolveOperatorUserId();
  const createdLogIds: string[] = [];
  const gatewayCallCounter = { count: 0 };
  const context = buildBaseContext();
  const persistence = createAiLogRecommendationPersistence({ prisma });
  const clockState = { ms: 400 };

  const input = {
    companyId: SEED_COMPANY_ID,
    userId: operatorUserId,
    userRole: "OPERATOR" as const,
    contactId: SEED_CONTACT_ID,
    locale: "cs" as const,
  };

  const service = createRecommendationService({
    clock: {
      now: () => `2024-06-25T12:00:00.${String(clockState.ms).padStart(3, "0")}Z`,
      nowMs: () => clockState.ms,
    },
  });

  const ports = createPorts({
    context,
    persistence,
    gatewayCallCounter,
    correlationId: "ailog-rec-cache-test-force-refresh",
    clockMs: clockState.ms,
  });
  ports.clock = {
    now: () => `2024-06-25T12:00:00.${String(clockState.ms).padStart(3, "0")}Z`,
    nowMs: () => clockState.ms,
  };

  const firstLive = await runAiServicePipeline(service, input, ports);
  assert.equal(firstLive.source, "LIVE");
  if (firstLive.metadata.aiLogId) {
    createdLogIds.push(firstLive.metadata.aiLogId);
  }

  const cached = await runAiServicePipeline(service, input, ports);
  assert.equal(cached.source, "CACHE");
  assert.equal(cached.metadata.aiLogId, firstLive.metadata.aiLogId);

  clockState.ms = 500;
  const refreshed = await runAiServicePipeline(service, { ...input, force: true }, ports);
  assert.equal(refreshed.source, "LIVE");
  assert.equal(gatewayCallCounter.count, 2);
  assert.notEqual(refreshed.metadata.aiLogId, firstLive.metadata.aiLogId);
  if (refreshed.metadata.aiLogId) {
    createdLogIds.push(refreshed.metadata.aiLogId);
  }

  clockState.ms = 600;
  const cachedAfterRefresh = await runAiServicePipeline(service, input, ports);
  assert.equal(cachedAfterRefresh.source, "CACHE");
  assert.equal(cachedAfterRefresh.metadata.aiLogId, refreshed.metadata.aiLogId);
  assert.notEqual(cachedAfterRefresh.metadata.aiLogId, firstLive.metadata.aiLogId);

  await deleteAiLogs(createdLogIds);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for integration tests.");
  }

  await assertRecommendationCacheTtlConfig();
  await assertCacheMissThenHit();
  await assertForceRefreshUsesNewestCacheEntry();
  await assertContextHashChangeCreatesNewRecord();
  await assertCacheStoreFindByContextHash();
  console.log("ai-log-recommendation-cache-store: ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
