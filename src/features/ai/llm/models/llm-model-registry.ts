import type { LlmModelRef, LlmModelRegistryEntry, LlmTaskProfile } from "../types/llm-model";

const DEFAULT_CAPABILITIES = {
  streaming: false,
  structuredOutput: true,
  toolCalling: false,
  vision: false,
} as const;

export const LLM_MODEL_REGISTRY: readonly LlmModelRegistryEntry[] = [
  {
    ref: { vendor: "fake", modelId: "fake-1" },
    displayName: "Fake Model (tests)",
    capabilities: { ...DEFAULT_CAPABILITIES, structuredOutput: true },
    costPerInputToken: 0,
    costPerOutputToken: 0,
  },
  {
    ref: { vendor: "openai", modelId: "gpt-4o" },
    displayName: "GPT-4o",
    capabilities: {
      streaming: true,
      structuredOutput: true,
      toolCalling: true,
      vision: true,
    },
    contextWindowTokens: 128_000,
    costPerInputToken: 0.0000025,
    costPerOutputToken: 0.00001,
  },
  {
    ref: { vendor: "anthropic", modelId: "claude-3-5-sonnet-20241022" },
    displayName: "Claude 3.5 Sonnet",
    capabilities: {
      streaming: true,
      structuredOutput: true,
      toolCalling: true,
      vision: true,
    },
    contextWindowTokens: 200_000,
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
  },
  {
    ref: { vendor: "ollama", modelId: "llama3" },
    displayName: "Llama 3 (Ollama)",
    capabilities: {
      streaming: true,
      structuredOutput: false,
      toolCalling: false,
      vision: false,
    },
    costPerInputToken: 0,
    costPerOutputToken: 0,
  },
];

function modelKey(ref: LlmModelRef): string {
  return `${ref.vendor}:${ref.modelId}`;
}

const registryByKey = new Map(
  LLM_MODEL_REGISTRY.map((entry) => [modelKey(entry.ref), entry]),
);

export function findLlmModelRegistryEntry(
  ref: LlmModelRef,
): LlmModelRegistryEntry | undefined {
  return registryByKey.get(modelKey(ref));
}

export function listLlmModelRegistryEntries(): readonly LlmModelRegistryEntry[] {
  return LLM_MODEL_REGISTRY;
}

function readEnvModel(profile: LlmTaskProfile): LlmModelRef | null {
  const vendor = process.env[`LLM_${profile}_VENDOR`];
  const modelId = process.env[`LLM_${profile}_MODEL`];

  if (!vendor || !modelId) {
    return null;
  }

  return {
    vendor: vendor as LlmModelRef["vendor"],
    modelId,
  };
}

export function getDefaultModelForProfile(profile: LlmTaskProfile): LlmModelRef {
  const fromEnv = readEnvModel(profile);

  if (fromEnv) {
    return fromEnv;
  }

  if (process.env.NODE_ENV === "test") {
    return { vendor: "fake", modelId: "fake-1" };
  }

  return { vendor: "openai", modelId: "gpt-4o" };
}
