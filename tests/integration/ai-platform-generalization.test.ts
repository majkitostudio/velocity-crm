import assert from "node:assert/strict";

import { createAiLogSummaryPersistence } from "../../src/features/ai/cache/ai-log-summary-cache-store";
import { resolveCacheTtlForTask, resolveAiConfig } from "../../src/features/ai/config/resolve-ai-config";
import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { readEnvAiConfigOverrides } from "../../src/features/ai/config/env-ai-config";
import {
  AI_SERVICE_FEATURE_FLAG_REGISTRY,
  getAiServiceFeatureFlagKeys,
} from "../../src/features/ai/flags/ai-service-feature-flag-registry";
import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import {
  resolveFakeJsonResponse,
  FAKE_TEXT_RESPONSES,
} from "../../src/features/ai/llm/adapters/fake/fake-response-registry";
import { createAiPipelinePorts } from "../../src/features/ai/services/shared/create-ai-pipeline-ports";
import { createContactSummaryPipelinePorts } from "../../src/features/ai/services/contact-summary/create-contact-summary-pipeline-ports";
import { buildAiServiceExecuteInput } from "../../src/features/ai/lib/build-ai-service-execute-input";
import { buildContactSummaryExecuteInput } from "../../src/features/ai/lib/build-contact-summary-execute-input";
import {
  CONTACT_AI_WORKSPACE_PANELS,
  getContactAiWorkspacePanelFeatureFlags,
} from "../../src/features/ai/components/contact-ai-workspace.types";
import { AI_TASK_CATEGORIES } from "../../src/features/ai/registry/ai-task-category";
import { listAiServiceDescriptors } from "../../src/features/ai/registry/ai-service-registry";
import type { AiCacheStore } from "../../src/features/ai/cache/ai-cache-store";
import type { PipelineAuditLogger } from "../../src/features/ai/services/shared/ai-service-pipeline.types";

const TEST_USER = {
  id: "user-test",
  companyId: "company-test",
  role: "OPERATOR" as const,
};

function assertGenericCacheStoreFactory() {
  assert.equal(typeof createAiLogSummaryPersistence, "function");
}

function assertGenericPipelinePorts() {
  const mockCacheStore: AiCacheStore<unknown> = {
    async find() {
      return null;
    },
    async upsert() {},
    async invalidate() {},
  };
  const mockAuditLogger: PipelineAuditLogger = {
    async recordSuccess() {
      return { aiLogId: "ailog_test" };
    },
    async recordFailure() {},
  };

  const customPorts = createAiPipelinePorts({
    cacheStore: mockCacheStore,
    auditLogger: mockAuditLogger,
  });
  assert.equal(customPorts.config.cache.defaultCacheTtlMs, defaultAiConfig.cache.defaultCacheTtlMs);

  const summaryPorts = createContactSummaryPipelinePorts();
  assert.equal(typeof summaryPorts.cacheStore.find, "function");
  assert.equal(typeof summaryPorts.gateway.complete, "function");
}

function assertFeatureFlagRegistry() {
  for (const descriptor of listAiServiceDescriptors()) {
    const keys = getAiServiceFeatureFlagKeys(descriptor.id);
    assert.ok(keys.enabled.startsWith("ai."));
    assert.ok(keys.refresh.includes(".refresh"));
    assert.ok(keys.autoGenerate.includes(".auto_generate"));
    assert.equal(
      AI_SERVICE_FEATURE_FLAG_REGISTRY[descriptor.id].enabled,
      keys.enabled,
    );
  }

  const summaryFlags = getContactAiWorkspacePanelFeatureFlags("summary");
  assert.equal(summaryFlags.enabled, "ai.contact_summary");
  assert.equal(summaryFlags.refresh, "ai.contact_summary.refresh");
}

function assertFakeResponseRegistry() {
  const summaryJson = JSON.parse(
    resolveFakeJsonResponse("SUMMARY", { contactId: "c-1" }),
  ) as { summary?: string };
  assert.ok(summaryJson.summary?.includes("c-1"));

  const recommendationJson = JSON.parse(
    resolveFakeJsonResponse("RECOMMENDATION", { contactId: "c-rec-1" }),
  ) as { primaryAction: { actionType: string } };
  assert.equal(recommendationJson.primaryAction.actionType, "CALL");

  assert.equal(FAKE_TEXT_RESPONSES.CALL_PREP.length > 0, true);
}

function assertConfigRenameCompatibility() {
  const config = resolveAiConfig();
  assert.equal(config.cache.defaultCacheTtlMs, defaultAiConfig.cache.defaultCacheTtlMs);
  assert.equal(
    config.cache.defaultCacheHardExpireMs,
    defaultAiConfig.cache.defaultCacheHardExpireMs,
  );

  const previousTtl = process.env.AI_CACHE_SUMMARY_TTL_MS;
  process.env.AI_CACHE_SUMMARY_TTL_MS = "12345";

  try {
    const overrides = readEnvAiConfigOverrides();
    assert.equal(overrides.cache?.defaultCacheTtlMs, 12345);
  } finally {
    if (previousTtl === undefined) {
      delete process.env.AI_CACHE_SUMMARY_TTL_MS;
    } else {
      process.env.AI_CACHE_SUMMARY_TTL_MS = previousTtl;
    }
  }

  const ttl = resolveCacheTtlForTask("SUMMARY");
  assert.equal(ttl.ttlMs, defaultAiConfig.cache.defaultCacheTtlMs);
}

function assertExecuteInputBuilders() {
  const generic = buildAiServiceExecuteInput(TEST_USER, "contact-1", { force: true });
  const summary = buildContactSummaryExecuteInput(TEST_USER, "contact-1", { force: true });
  assert.deepEqual(summary, generic);
}

function assertWorkspaceComposition() {
  assert.equal(CONTACT_AI_WORKSPACE_PANELS.length, 6);
  assert.equal(CONTACT_AI_WORKSPACE_PANELS[0]?.id, "summary");
  assert.ok(
    CONTACT_AI_WORKSPACE_PANELS.every((panel) =>
      AI_TASK_CATEGORIES.includes(
        listAiServiceDescriptors().find((d) => d.id === panel.serviceId)!.taskCategory,
      ),
    ),
  );
}

function assertTaskCategoriesOnDescriptors() {
  for (const descriptor of listAiServiceDescriptors()) {
    assert.ok(AI_TASK_CATEGORIES.includes(descriptor.taskCategory));
  }
}

async function main() {
  assertGenericCacheStoreFactory();
  assertGenericPipelinePorts();
  assertFeatureFlagRegistry();
  assertFakeResponseRegistry();
  assertConfigRenameCompatibility();
  assertExecuteInputBuilders();
  assertWorkspaceComposition();
  assertTaskCategoriesOnDescriptors();

  const flags = createEnvAiFeatureFlags();
  assert.equal(
    flags.isEnabled("ai.contact_summary.enabled", {
      companyId: TEST_USER.companyId,
      userId: TEST_USER.id,
      userRole: TEST_USER.role,
    }),
    true,
  );

  console.log("ai-platform-generalization: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
