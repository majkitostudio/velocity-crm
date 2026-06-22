export const LLM_VENDORS = [
  "openai",
  "anthropic",
  "azure_openai",
  "ollama",
  "fake",
  "custom",
] as const;

export type LlmVendor = (typeof LLM_VENDORS)[number];

export type LlmVendorCapabilities = {
  streaming: boolean;
  structuredOutput: boolean;
  toolCalling: boolean;
  vision: boolean;
};
