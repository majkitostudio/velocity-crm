import type { LlmTaskProfile } from "@/src/features/ai/llm/types/llm-model";
import type { LlmVendor } from "@/src/features/ai/llm/types/llm-vendor";
import type { PromptTemplateId } from "@/src/features/ai/prompts/types/prompt-template";
import type { AiTaskCategory } from "@/src/features/ai/registry/ai-task-category";

export type AiLogMetadata = {
  promptVersion: number;
  promptId: PromptTemplateId;
  outputSchemaVersion: number;
  contextSchemaVersion: number;
  taskCategory: AiTaskCategory;
  taskProfile: LlmTaskProfile;
  vendor: LlmVendor;
  modelId: string;
  correlationId: string;
  contextHash: string;
  cacheKey: string;
  locale: string;
  generatedAt: string;
  fromCache?: boolean;
};

export function isAiLogMetadata(value: unknown): value is AiLogMetadata {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.cacheKey === "string" &&
    typeof record.contextHash === "string" &&
    typeof record.generatedAt === "string" &&
    typeof record.taskCategory === "string"
  );
}
