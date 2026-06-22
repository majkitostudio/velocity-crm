import type { ContactAiContext } from "@/src/features/ai/context/types/contact-ai-context";
import type { LlmTaskProfile } from "@/src/features/ai/llm/types/llm-model";

export const PROMPT_TEMPLATE_IDS = [
  "summary",
  "recommendation",
  "call-prep",
  "copilot",
  "general",
] as const;

export type PromptTemplateId = (typeof PROMPT_TEMPLATE_IDS)[number];

export type PromptBuildInput = {
  context: ContactAiContext;
  locale?: "cs" | "en";
  contextView?: {
    maxHistoryItems?: number;
    includeNoteBodies?: boolean;
  };
  supplements?: {
    operatorInstructions?: string;
    campaignContext?: string;
    communicationSnippet?: string;
  };
  taskProfile: LlmTaskProfile;
  redaction?: {
    includeSensitiveData: boolean;
  };
};

export type PromptBuildResult = {
  messages: readonly import("@/src/features/ai/llm/types/llm-message").LlmMessage[];
  promptId: PromptTemplateId;
  promptVersion: number;
  summary: string;
};

export type PromptTemplate = {
  readonly id: PromptTemplateId;
  readonly version: number;
  build(input: PromptBuildInput): PromptBuildResult;
};
