import type { LlmVendorAdapter, LlmVendorRawResponse } from "../llm-vendor-adapter";
import type { LlmCompletionRequest } from "../../types/llm-request";

import {
  resolveFakeJsonResponse,
  resolveFakeTextResponse,
} from "./fake-response-registry";

function resolveFakeContent(request: LlmCompletionRequest): string {
  const taskProfile = request.metadata?.taskProfile;
  const contactId = request.metadata?.contactId;

  if (request.responseFormat?.type === "json") {
    return resolveFakeJsonResponse(taskProfile, { contactId });
  }

  const textResponse = resolveFakeTextResponse(taskProfile);
  if (textResponse) {
    return textResponse;
  }

  const lastUser = [...request.messages].reverse().find((m) => m.role === "user");

  if (lastUser?.content) {
    return `Fake response echo: ${lastUser.content.slice(0, 200)}`;
  }

  return "Deterministic fake LLM response.";
}

export const fakeLlmVendorAdapter: LlmVendorAdapter = {
  vendor: "fake",
  capabilities: {
    streaming: false,
    structuredOutput: true,
    toolCalling: false,
    vision: false,
  },

  async complete(request: LlmCompletionRequest): Promise<LlmVendorRawResponse> {
    const content = resolveFakeContent(request);
    const inputTokens = request.messages.reduce(
      (sum, message) => sum + message.content.length,
      0,
    );
    const outputTokens = content.length;

    return {
      vendor: "fake",
      content,
      finishReason: "stop",
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    };
  },
};
