import type { LlmVendorAdapter, LlmVendorRawResponse } from "../llm-vendor-adapter";
import type { LlmCompletionRequest } from "../../types/llm-request";
import type { LlmTaskProfile } from "../../types/llm-model";

const FAKE_RESPONSES: Record<LlmTaskProfile, string> = {
  SUMMARY: "Deterministic fake summary for contact.",
  RECOMMENDATION: "Deterministic fake recommendation.",
  CALL_PREP: "Deterministic fake call preparation notes.",
  COPILOT: "Deterministic fake copilot response.",
  GENERAL: "Deterministic fake general response.",
};

function resolveFakeContent(request: LlmCompletionRequest): string {
  if (request.responseFormat?.type === "json") {
    return JSON.stringify({ ok: true });
  }

  const taskProfile = request.metadata?.taskProfile;

  if (taskProfile && taskProfile in FAKE_RESPONSES) {
    return FAKE_RESPONSES[taskProfile];
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
