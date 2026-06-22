export const LLM_MESSAGE_ROLES = [
  "system",
  "user",
  "assistant",
  "tool",
] as const;

export type LlmMessageRole = (typeof LLM_MESSAGE_ROLES)[number];

export type LlmMessage = {
  role: LlmMessageRole;
  content: string;
  toolCallId?: string;
  toolName?: string;
};
