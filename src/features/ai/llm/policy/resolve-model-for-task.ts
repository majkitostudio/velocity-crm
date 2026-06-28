import type { LlmModelRef, LlmTaskProfile } from "../types/llm-model";
import {
  findLlmModelRegistryEntry,
  getDefaultModelForProfile,
  listLlmModelRegistryEntries,
} from "../models/llm-model-registry";

export type ModelPolicyInput = {
  taskProfile: LlmTaskProfile;
  companyId: string;
  hints?: {
    preferLowCost?: boolean;
    requireStructuredOutput?: boolean;
  };
};

export type ModelPolicyResult = {
  model: LlmModelRef;
  fallback?: LlmModelRef;
  reason: string;
};

function findStructuredOutputFallback(primary: LlmModelRef): LlmModelRef | null {
  const sameVendor = listLlmModelRegistryEntries().find(
    (entry) =>
      entry.ref.vendor === primary.vendor && entry.capabilities.structuredOutput,
  );

  if (sameVendor) {
    return sameVendor.ref;
  }

  const anyVendor = listLlmModelRegistryEntries().find(
    (entry) => entry.capabilities.structuredOutput,
  );

  return anyVendor?.ref ?? null;
}

export function resolveModelForTask(input: ModelPolicyInput): ModelPolicyResult {
  const primary = getDefaultModelForProfile(input.taskProfile);
  const entry = findLlmModelRegistryEntry(primary);

  if (input.hints?.requireStructuredOutput && entry && !entry.capabilities.structuredOutput) {
    const fallback = findStructuredOutputFallback(primary);

    if (fallback) {
      return {
        model: fallback,
        fallback: primary,
        reason: "Primary model lacks structured output; using registry fallback",
      };
    }
  }

  if (input.hints?.preferLowCost) {
    const lowCost: LlmModelRef = { vendor: "fake", modelId: "fake-1" };
    return {
      model: lowCost,
      reason: "Low-cost preference selected fake model",
    };
  }

  return {
    model: primary,
    reason: `Default model for task profile ${input.taskProfile}`,
  };
}
