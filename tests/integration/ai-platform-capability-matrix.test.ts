import assert from "node:assert/strict";

import { AiCapabilityError } from "../../src/features/ai/services/shared/ai-platform-errors";
import {
  isModelCompatible,
  resolveCompatibleModel,
} from "../../src/features/ai/registry/ai-capability-matrix";
import { getAiServiceDescriptor } from "../../src/features/ai/registry/ai-service-registry";
import { resolveModelCapabilities } from "../../src/features/ai/registry/model-capabilities";
import { resolveModelForTask } from "../../src/features/ai/llm/policy/resolve-model-for-task";

async function assertOllamaIncompatibleWithSummary() {
  const descriptor = getAiServiceDescriptor("contact-summary");
  const policy = {
    model: { vendor: "ollama" as const, modelId: "llama3" },
    reason: "test",
  };

  assert.throws(
    () => resolveCompatibleModel(descriptor, policy, resolveModelCapabilities),
    AiCapabilityError,
  );
}

async function assertFakeCompatibleWithSummary() {
  const descriptor = getAiServiceDescriptor("contact-summary");
  const policy = resolveModelForTask({
    taskProfile: "SUMMARY",
    companyId: "company-1",
    hints: { preferLowCost: true },
  });

  const result = resolveCompatibleModel(descriptor, policy, resolveModelCapabilities);
  assert.equal(result.model.vendor, "fake");
}

async function assertCopilotRequiresToolCalling() {
  const descriptor = getAiServiceDescriptor("copilot");
  const capabilities = resolveModelCapabilities({ vendor: "fake", modelId: "fake-1" });
  assert.equal(isModelCompatible(descriptor.modelRequirements, capabilities), false);
}

async function main() {
  await assertOllamaIncompatibleWithSummary();
  await assertFakeCompatibleWithSummary();
  await assertCopilotRequiresToolCalling();
  console.log("ai-platform-capability-matrix: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
