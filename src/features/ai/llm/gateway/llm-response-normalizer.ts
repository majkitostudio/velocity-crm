import type { LlmVendorRawResponse } from "../adapters/llm-vendor-adapter";
import type { LlmCompletionRequest } from "../types/llm-request";
import type { LlmCompletionResponse, LlmFinishReason } from "../types/llm-response";

const FINISH_REASON_MAP: Record<string, LlmFinishReason> = {
  stop: "stop",
  end_turn: "stop",
  length: "length",
  max_tokens: "length",
  tool_calls: "tool_calls",
  content_filter: "content_filter",
  error: "error",
};

function mapFinishReason(raw: string): LlmFinishReason {
  return FINISH_REASON_MAP[raw] ?? "stop";
}

export function normalizeLlmVendorResponse(
  request: LlmCompletionRequest,
  raw: LlmVendorRawResponse,
): LlmCompletionResponse {
  return {
    content: raw.content,
    finishReason: mapFinishReason(raw.finishReason),
    model: request.model,
    usage: raw.usage
      ? {
          inputTokens: raw.usage.inputTokens,
          outputTokens: raw.usage.outputTokens,
          totalTokens: raw.usage.totalTokens,
        }
      : undefined,
    toolCalls: raw.toolCalls?.map((call) => ({
      id: call.id,
      name: call.name,
      arguments: call.arguments,
    })),
  };
}
