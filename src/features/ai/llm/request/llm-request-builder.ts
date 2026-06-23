import type { LlmCompletionRequest, LlmCompletionRequestMetadata } from "../types/llm-request";
import type { LlmModelRef } from "../types/llm-model";
import type { PromptBuildResult } from "@/src/features/ai/prompts/types/prompt-template";

export type BuildLlmCompletionRequestInput = {
  prompt: PromptBuildResult;
  model: LlmModelRef;
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: LlmCompletionRequest["responseFormat"];
  metadata?: Omit<LlmCompletionRequestMetadata, "promptId" | "promptVersion">;
};

export function buildLlmCompletionRequest(
  input: BuildLlmCompletionRequestInput,
): LlmCompletionRequest {
  return {
    model: input.model,
    messages: input.prompt.messages,
    temperature: input.temperature,
    maxOutputTokens: input.maxOutputTokens,
    responseFormat: input.responseFormat,
    metadata: {
      ...input.metadata,
      promptId: input.prompt.promptId,
      promptVersion: input.prompt.promptVersion,
      taskProfile: input.metadata?.taskProfile,
    },
  };
}
