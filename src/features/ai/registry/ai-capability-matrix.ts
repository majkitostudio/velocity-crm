import type { LlmModelRef } from "@/src/features/ai/llm/types/llm-model";
import type { ModelPolicyResult } from "@/src/features/ai/llm/policy/resolve-model-for-task";

import { AiCapabilityError } from "../services/shared/ai-platform-errors";
import type { AiServiceDescriptor, AiServiceModelRequirements } from "./ai-service-descriptor";
import type { ModelCapabilities, ResolveModelCapabilities } from "./model-capabilities";

export function isModelCompatible(
  requirements: AiServiceModelRequirements,
  capabilities: ModelCapabilities,
): boolean {
  if (requirements.structuredOutput && !capabilities.structuredOutput) {
    return false;
  }
  if (requirements.jsonSchema && !capabilities.jsonSchema) {
    return false;
  }
  if (requirements.streaming && !capabilities.streaming) {
    return false;
  }
  if (requirements.toolCalling && !capabilities.toolCalling) {
    return false;
  }
  if (requirements.vision && !capabilities.vision) {
    return false;
  }
  return true;
}

export type CompatibleModelResult = {
  model: LlmModelRef;
  usedFallback: boolean;
};

export function resolveCompatibleModel(
  descriptor: AiServiceDescriptor,
  policy: ModelPolicyResult,
  resolveCapabilities: ResolveModelCapabilities,
): CompatibleModelResult {
  const primaryCapabilities = resolveCapabilities(policy.model);

  if (isModelCompatible(descriptor.modelRequirements, primaryCapabilities)) {
    return { model: policy.model, usedFallback: false };
  }

  if (policy.fallback) {
    const fallbackCapabilities = resolveCapabilities(policy.fallback);
    if (isModelCompatible(descriptor.modelRequirements, fallbackCapabilities)) {
      return { model: policy.fallback, usedFallback: true };
    }
  }

  throw new AiCapabilityError(
    `No compatible model for service "${descriptor.id}" (${descriptor.displayName})`,
  );
}

export function assertServiceModelCompatibility(
  descriptor: AiServiceDescriptor,
  model: LlmModelRef,
  resolveCapabilities: ResolveModelCapabilities,
): void {
  const capabilities = resolveCapabilities(model);
  if (!isModelCompatible(descriptor.modelRequirements, capabilities)) {
    throw new AiCapabilityError(
      `Model ${model.vendor}:${model.modelId} does not meet requirements for "${descriptor.id}"`,
    );
  }
}
