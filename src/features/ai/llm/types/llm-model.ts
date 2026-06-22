import type { LlmVendor, LlmVendorCapabilities } from "./llm-vendor";

export const LLM_TASK_PROFILES = [
  "SUMMARY",
  "RECOMMENDATION",
  "CALL_PREP",
  "COPILOT",
  "GENERAL",
] as const;

export type LlmTaskProfile = (typeof LLM_TASK_PROFILES)[number];

export type LlmModelRef = {
  vendor: LlmVendor;
  modelId: string;
};

export type LlmModelRegistryEntry = {
  ref: LlmModelRef;
  displayName: string;
  capabilities: LlmVendorCapabilities;
  contextWindowTokens?: number;
  costPerInputToken?: number;
  costPerOutputToken?: number;
  deprecated?: boolean;
};
