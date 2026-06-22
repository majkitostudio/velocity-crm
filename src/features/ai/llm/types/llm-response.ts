import type { LlmModelRef } from "./llm-model";
import type { LlmToolCall } from "./llm-tools";

export const LLM_FINISH_REASONS = [
  "stop",
  "length",
  "tool_calls",
  "content_filter",
  "error",
] as const;

export type LlmFinishReason = (typeof LLM_FINISH_REASONS)[number];

export type LlmTokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type LlmCompletionResponse = {
  content: string;
  finishReason: LlmFinishReason;
  model: LlmModelRef;
  usage?: LlmTokenUsage;
  toolCalls?: readonly LlmToolCall[];
};

export type LlmStructuredResponse<T> = {
  data: T;
  raw: LlmCompletionResponse;
};
