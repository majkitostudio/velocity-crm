import assert from "node:assert/strict";

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { computeContactContextHash } from "../../src/features/ai/context/context-hash/compute-contact-context-hash";
import { defaultAiContextSanitizer } from "../../src/features/ai/context/sanitizers/default-ai-context-sanitizer";
import { createAiLogSummaryPersistence } from "../../src/features/ai/cache/ai-log-summary-cache-store";
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
import { buildCacheKey } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../../src/features/ai/services/shared/run-ai-service-pipeline";
import { createContactSummaryService } from "../../src/features/ai/services/contact-summary/get-contact-summary-service";
import type { ContactSummary } from "../../src/features/ai/services/contact-summary/contact-summary.schema";
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
  persistence: ReturnType<typeof createAiLogSummaryPersistence>;
  gatewayCallCounter: { count: number };
  correlationId: string;
  clockMs: number;
}): PipelinePorts<ContactSummary> {
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
        return options.context;
      },
    },
    authorizer: {
      async authorize() {
        // Isolated persistence test — authorization is covered elsewhere.
      },
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
    metricsRecorder: noopPromptMetricsRecorder,
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
    },
  });
}

async function assertCacheMissThenHit() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  const operatorUserId = await resolveOperatorUserId();
  const createdLogIds: string[] = [];
  const gatewayCallCounter = { count: 0 };
  const context = buildBaseContext();
  const persistence = createAiLogSummaryPersistence({ prisma });
  const service = createContactSummaryService({
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
    correlationId: "ailog-cache-test-miss-hit",
    clockMs: 100,
  });

  const liveViewModel = await runAiServicePipeline(service, input, ports);
  assert.equal(liveViewModel.source, "LIVE");
  assert.equal(gatewayCallCounter.count, 1);
  if (liveViewModel.metadata.aiLogId) {
    createdLogIds.push(liveViewModel.metadata.aiLogId);
  }

  const cachedViewModel = await runAiServicePipeline(service, input, ports);
  assert.equal(cachedViewModel.source, "CACHE");
  assert.equal(gatewayCallCounter.count, 1, "gateway must not be called on cache hit");
  assert.equal(cachedViewModel.summary, liveViewModel.summary);

  await deleteAiLogs(createdLogIds);
}

async function assertContextHashChangeCreatesNewRecord() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  const operatorUserId = await resolveOperatorUserId();
  const createdLogIds: string[] = [];
  const gatewayCallCounter = { count: 0 };
  const context = buildBaseContext();
  const persistence = createAiLogSummaryPersistence({ prisma });
  const service = createContactSummaryService({
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
    correlationId: "ailog-cache-test-hash-change",
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
  assert.equal(gatewayCallCounter.count, 2, "gateway must not be called when original hash is cached");
  assert.equal(thirdViewModel.summary, firstViewModel.summary);
  assert.equal(
    thirdViewModel.summary,
    buildFakeContactSummaryResponse(SEED_CONTACT_ID).summary,
  );

  await deleteAiLogs(createdLogIds);
}

async function assertCacheStoreFindByContextHash() {
  const operatorUserId = await resolveOperatorUserId();
  const createdLogIds: string[] = [];
  const context = buildBaseContext();
  const persistence = createAiLogSummaryPersistence({ prisma });
  const contextHash = computeContactContextHash(context);
  const expectedSummary = buildFakeContactSummaryResponse(SEED_CONTACT_ID);

  const service = createContactSummaryService({
    clock: {
      now: () => "2024-06-25T12:00:00.300Z",
      nowMs: () => 300,
    },
  });

  const ports = createPorts({
    context,
    persistence,
    gatewayCallCounter: { count: 0 },
    correlationId: "ailog-cache-test-direct-find",
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
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  const liveViewModel = await runAiServicePipeline(service, input, ports);
  if (liveViewModel.metadata.aiLogId) {
    createdLogIds.push(liveViewModel.metadata.aiLogId);
  }

  const miss = await persistence.cacheStore.find({
    cacheKey: `invalid:${SEED_CONTACT_ID}:contact-summary:${contextHash}:1:fake:fake-1:cs:1`,
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CONTACT_ID,
    serviceId: "contact-summary",
  });
  assert.equal(miss, null, "unknown cache key must miss");

  const wrongHash = await persistence.cacheStore.find({
    cacheKey: `${SEED_COMPANY_ID}:${SEED_CONTACT_ID}:contact-summary:deadbeef:1:fake:fake-1:cs:1`,
    companyId: SEED_COMPANY_ID,
    contactId: SEED_CONTACT_ID,
    serviceId: "contact-summary",
  });
  assert.equal(wrongHash, null, "changed context hash must miss even if other rows exist");

  const hit = await persistence.cacheStore.find({
    cacheKey: buildCacheKey({
      serviceId: "contact-summary",
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
    serviceId: "contact-summary",
  });

  assert.ok(hit, "cache store must return latest valid row for context hash");
  assert.equal(hit?.payload.summary, expectedSummary.summary);

  await deleteAiLogs(createdLogIds);
}

async function assertForceRefreshUsesNewestCacheEntry() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";

  const operatorUserId = await resolveOperatorUserId();
  const createdLogIds: string[] = [];
  const gatewayCallCounter = { count: 0 };
  const context = buildBaseContext();
  const persistence = createAiLogSummaryPersistence({ prisma });
  const clockState = { ms: 400 };

  const input = {
    companyId: SEED_COMPANY_ID,
    userId: operatorUserId,
    userRole: "OPERATOR" as const,
    contactId: SEED_CONTACT_ID,
    locale: "cs" as const,
  };

  const service = createContactSummaryService({
    clock: {
      now: () => `2024-06-25T12:00:00.${String(clockState.ms).padStart(3, "0")}Z`,
      nowMs: () => clockState.ms,
    },
  });

  const ports = createPorts({
    context,
    persistence,
    gatewayCallCounter,
    correlationId: "ailog-cache-test-force-refresh",
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

  await assertCacheMissThenHit();
  await assertForceRefreshUsesNewestCacheEntry();
  await assertContextHashChangeCreatesNewRecord();
  await assertCacheStoreFindByContextHash();
  console.log("ai-log-summary-cache-store: ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
