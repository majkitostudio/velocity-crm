import assert from "node:assert/strict";

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import type { ContactAiContext } from "../../src/features/ai/context/types/contact-ai-context";
import { defaultAiContextSanitizer } from "../../src/features/ai/context/sanitizers/default-ai-context-sanitizer";
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
import { createAiLogRecommendationPersistence } from "../../src/features/ai/cache/ai-log-recommendation-cache-persistence";
import { createRecommendationPipelinePorts } from "../../src/features/ai/services/recommendation/create-recommendation-pipeline-ports";
import { generateRecommendation } from "../../src/features/ai/services/recommendation/generate-recommendation";
import type { PipelinePorts } from "../../src/features/ai/services/shared/ai-service-pipeline.types";
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

function createProductionPortsWithStubbedContext(
  context: ContactAiContext,
  gatewayCallCounter: { count: number },
): PipelinePorts<ContactRecommendation> {
  const productionPorts = createRecommendationPipelinePorts();

  return {
    ...productionPorts,
    contextLoader: {
      async load() {
        return context;
      },
    },
    authorizer: {
      async authorize() {},
    },
    gateway: {
      async completeStructured(request, schema) {
        gatewayCallCounter.count += 1;
        return defaultLlmGateway.completeStructured(request, schema);
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

async function deleteRecommendationAiLogs(ids: readonly string[]): Promise<void> {
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

async function assertProductionWiringLiveCacheForce() {
  process.env.AI_ENABLED = "true";
  process.env.AI_FEATURE_RECOMMENDATION = "true";

  const operatorUserId = await resolveOperatorUserId();
  const createdLogIds: string[] = [];
  const gatewayCallCounter = { count: 0 };
  const context = buildBaseContext();
  const ports = createProductionPortsWithStubbedContext(context, gatewayCallCounter);

  const input = {
    companyId: SEED_COMPANY_ID,
    userId: operatorUserId,
    userRole: "OPERATOR" as const,
    contactId: SEED_CONTACT_ID,
    locale: "cs" as const,
  };

  const expected = buildFakeRecommendationResponse(SEED_CONTACT_ID);

  const live = await generateRecommendation(input, ports);
  assert.equal(live.source, "LIVE");
  assert.equal(gatewayCallCounter.count, 1);
  assert.equal(live.primaryAction.title, expected.primaryAction.title);
  if (live.metadata.aiLogId) {
    createdLogIds.push(live.metadata.aiLogId);
  }

  const row = await prisma.aiLog.findUnique({
    where: { id: live.metadata.aiLogId! },
    select: { taskType: true, output: true, promptSummary: true },
  });
  assert.equal(row?.taskType, "NEXT_ACTION");
  assert.equal(row?.promptSummary, "recommendation@1");
  contactRecommendationSchema.parse(JSON.parse(row!.output));

  const cached = await generateRecommendation(input, ports);
  assert.equal(cached.source, "CACHE");
  assert.equal(gatewayCallCounter.count, 1);
  assert.equal(cached.metadata.aiLogId, live.metadata.aiLogId);

  const refreshed = await generateRecommendation({ ...input, force: true }, ports);
  assert.equal(refreshed.source, "LIVE");
  assert.equal(gatewayCallCounter.count, 2);
  assert.notEqual(refreshed.metadata.aiLogId, live.metadata.aiLogId);
  if (refreshed.metadata.aiLogId) {
    createdLogIds.push(refreshed.metadata.aiLogId);
  }

  const cachedAfterRefresh = await generateRecommendation(input, ports);
  assert.equal(cachedAfterRefresh.source, "CACHE");
  assert.equal(cachedAfterRefresh.metadata.aiLogId, refreshed.metadata.aiLogId);

  await deleteRecommendationAiLogs(createdLogIds);
}

async function assertPersistenceFactoryMatchesProductionPorts() {
  const persistence = createAiLogRecommendationPersistence({ prisma });
  const productionPorts = createRecommendationPipelinePorts();

  assert.equal(typeof persistence.cacheStore.find, "function");
  assert.equal(typeof productionPorts.cacheStore.find, "function");
  assert.equal(typeof persistence.auditLogger.recordSuccess, "function");
  assert.equal(typeof productionPorts.auditLogger.recordSuccess, "function");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for integration tests.");
  }

  await assertPersistenceFactoryMatchesProductionPorts();
  await assertProductionWiringLiveCacheForce();
  console.log("recommendation-cache-db: ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
