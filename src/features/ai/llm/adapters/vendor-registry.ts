import { LlmProviderNotConfiguredError } from "../errors/llm-errors";
import type { LlmVendorAdapter } from "./llm-vendor-adapter";
import type { LlmVendor } from "../types/llm-vendor";
import { anthropicVendorAdapter } from "./anthropic/anthropic-vendor-adapter";
import { azureOpenAiVendorAdapter } from "./azure-openai/azure-openai-vendor-adapter";
import { fakeLlmVendorAdapter } from "./fake/fake-llm-vendor-adapter";
import { ollamaVendorAdapter } from "./ollama/ollama-vendor-adapter";
import { openAiVendorAdapter } from "./openai/openai-vendor-adapter";

const llmVendorAdapterRegistry = new Map<LlmVendor, LlmVendorAdapter>([
  ["fake", fakeLlmVendorAdapter],
  ["openai", openAiVendorAdapter],
  ["anthropic", anthropicVendorAdapter],
  ["azure_openai", azureOpenAiVendorAdapter],
  ["ollama", ollamaVendorAdapter],
]);

export function resolveLlmVendorAdapter(vendor: LlmVendor): LlmVendorAdapter {
  const adapter = llmVendorAdapterRegistry.get(vendor);

  if (!adapter) {
    throw new LlmProviderNotConfiguredError(vendor);
  }

  return adapter;
}

export function registerLlmVendorAdapter(adapter: LlmVendorAdapter): void {
  llmVendorAdapterRegistry.set(adapter.vendor, adapter);
}

export function listRegisteredLlmVendors(): LlmVendor[] {
  return [...llmVendorAdapterRegistry.keys()];
}
