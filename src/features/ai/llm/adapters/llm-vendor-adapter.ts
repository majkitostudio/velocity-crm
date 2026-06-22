import type { LlmCompletionRequest } from "../types/llm-request";
import type { LlmVendor, LlmVendorCapabilities } from "../types/llm-vendor";
import type { LlmStreamEvent } from "../types/llm-stream";

/** Opaque vendor payload — normalized by gateway, not exposed to business layer. */
export type LlmVendorRawResponse = {
  vendor: LlmVendor;
  content: string;
  finishReason: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  /** Debug-only vendor metadata — never passed to AI services */
  vendorMetadata?: Record<string, unknown>;
};

export type LlmVendorAdapter = {
  readonly vendor: LlmVendor;
  readonly capabilities: LlmVendorCapabilities;
  complete(request: LlmCompletionRequest): Promise<LlmVendorRawResponse>;
  stream?(request: LlmCompletionRequest): AsyncIterable<LlmStreamEvent>;
};
