import type { LlmTaskProfile } from "@/src/features/ai/llm/types/llm-model";
import type { LlmVendor } from "@/src/features/ai/llm/types/llm-vendor";

export type AiLogMetadata = {
  promptVersion: number;
  promptId: "summary";
  outputSchemaVersion: number;
  contextSchemaVersion: number;
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
    typeof record.generatedAt === "string"
  );
}
