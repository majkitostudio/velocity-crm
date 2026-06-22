import type { LlmModelRef } from "@/src/features/ai/llm/types/llm-model";
import { findLlmModelRegistryEntry } from "@/src/features/ai/llm/models/llm-model-registry";

export type ModelCapabilities = {
  structuredOutput: boolean;
  jsonSchema: boolean;
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
};

const DEFAULT_CAPABILITIES: ModelCapabilities = {
  structuredOutput: false,
  jsonSchema: false,
  streaming: false,
  toolCalling: false,
  vision: false,
};

function resolveJsonSchemaSupport(
  vendor: LlmModelRef["vendor"],
  structuredOutput: boolean,
): boolean {
  if (!structuredOutput) {
    return false;
  }

  if (vendor === "ollama") {
    return false;
  }

  return true;
}

export function resolveModelCapabilities(model: LlmModelRef): ModelCapabilities {
  const entry = findLlmModelRegistryEntry(model);

  if (!entry) {
    return { ...DEFAULT_CAPABILITIES };
  }

  const { capabilities } = entry;

  return {
    structuredOutput: capabilities.structuredOutput,
    jsonSchema: resolveJsonSchemaSupport(model.vendor, capabilities.structuredOutput),
    streaming: capabilities.streaming,
    toolCalling: capabilities.toolCalling,
    vision: capabilities.vision,
  };
}

export type ResolveModelCapabilities = (model: LlmModelRef) => ModelCapabilities;
