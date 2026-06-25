import type { LlmTaskProfile } from "@/src/features/ai/llm/types/llm-model";

import type { SanitizerProfile } from "../context/types/sanitizer-profile";
import type { AiFeatureFlagKey } from "../flags/ai-feature-flag.types";
import type { AiServiceId } from "./ai-service-id";
import type { AiTaskCategory } from "./ai-task-category";

export type AiRegistryTaskType =
  | "CUSTOMER_SUMMARY"
  | "HISTORY_SUMMARY"
  | "NEXT_ACTION";

export type AiServiceModelRequirements = {
  structuredOutput: boolean;
  jsonSchema: boolean;
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
};

export type AiSanitizerProfile = SanitizerProfile;

export type AiServiceDescriptor = {
  readonly id: AiServiceId;
  readonly displayName: string;
  readonly description?: string;
  readonly taskProfile: LlmTaskProfile;
  readonly taskCategory: AiTaskCategory;
  readonly taskType: AiRegistryTaskType;
  readonly defaultPromptVersion: number;
  readonly featureFlag: AiFeatureFlagKey;
  readonly minRole: "ADMIN" | "MANAGER" | "OPERATOR";
  readonly modelRequirements: AiServiceModelRequirements;
  readonly supportsCaching: boolean;
  readonly supportsStreaming: boolean;
  readonly supportsAsync: boolean;
  readonly sanitizerProfile: AiSanitizerProfile;
};
