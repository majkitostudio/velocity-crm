import type { LlmModelRef, LlmTaskProfile } from "../types/llm-model";
import {
  findLlmModelRegistryEntry,
  getDefaultModelForProfile,
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

export function resolveModelForTask(input: ModelPolicyInput): ModelPolicyResult {
  const primary = getDefaultModelForProfile(input.taskProfile);
  const entry = findLlmModelRegistryEntry(primary);

  if (input.hints?.requireStructuredOutput && entry && !entry.capabilities.structuredOutput) {
    const fallback: LlmModelRef = { vendor: "openai", modelId: "gpt-4o" };
    return {
      model: fallback,
      fallback: primary,
      reason: "Primary model lacks structured output; using OpenAI fallback",
    };
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
