import type { LlmVendorAdapter, LlmVendorRawResponse } from "./llm-vendor-adapter";
import { LlmProviderNotConfiguredError } from "../errors/llm-errors";

const STUB_CAPABILITIES = {
  streaming: false,
  structuredOutput: false,
  toolCalling: false,
  vision: false,
} as const;

export function createNotConfiguredVendorAdapter(
  vendor: LlmVendorAdapter["vendor"],
): LlmVendorAdapter {
  return {
    vendor,
    capabilities: { ...STUB_CAPABILITIES },
    async complete(): Promise<LlmVendorRawResponse> {
      throw new LlmProviderNotConfiguredError(vendor);
    },
  };
}
