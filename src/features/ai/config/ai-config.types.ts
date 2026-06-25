import type { LlmTaskProfile } from "@/src/features/ai/llm/types/llm-model";
import type { PromptBuildInput } from "@/src/features/ai/prompts/types/prompt-template";

export type AiTaskConfig = {
  defaultPromptVersion?: number;
  modelPolicyHints?: {
    preferLowCost?: boolean;
    requireStructuredOutput?: boolean;
  };
  contextView?: PromptBuildInput["contextView"];
  cacheTtlMs?: number;
  cacheHardExpireMs?: number;
};

export type AiConfiguration = {
  enabled: boolean;
  defaultLocale: "cs" | "en";
  tasks: Record<LlmTaskProfile, AiTaskConfig>;
  cache: {
    defaultCacheTtlMs: number;
    defaultCacheHardExpireMs: number;
    useAiLogAsCache: boolean;
  };
  gateway: {
    defaultTimeoutMs: number;
    maxAutoRetries: number;
  };
  sanitization: {
    defaultIncludeSensitiveData: boolean;
    adminDebugAllowed: boolean;
  };
  cost: {
    maxEstimatedCostUsdPerRequest?: number;
    dailyBudgetUsdPerCompany?: number;
  };
  features: {
    contactSummary: boolean;
    contactSummaryRefresh: boolean;
    contactSummaryAutoGenerate: boolean;
    recommendation: boolean;
    copilot: boolean;
  };
};

export type AiConfigContext = {
  companyId?: string;
};
