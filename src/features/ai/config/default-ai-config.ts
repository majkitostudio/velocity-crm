import type { AiConfiguration } from "./ai-config.types";

const DEFAULT_TASK_CONFIG = {
  defaultPromptVersion: 1,
  modelPolicyHints: {
    requireStructuredOutput: false,
    preferLowCost: false,
  },
} as const;

export const defaultAiConfig: AiConfiguration = {
  enabled: true,
  defaultLocale: "cs",
  tasks: {
    SUMMARY: {
      ...DEFAULT_TASK_CONFIG,
      modelPolicyHints: { requireStructuredOutput: true, preferLowCost: false },
      contextView: { maxHistoryItems: 20, includeNoteBodies: false },
    },
    RECOMMENDATION: {
      ...DEFAULT_TASK_CONFIG,
      modelPolicyHints: { requireStructuredOutput: true, preferLowCost: false },
    },
    CALL_PREP: { ...DEFAULT_TASK_CONFIG },
    COPILOT: { ...DEFAULT_TASK_CONFIG },
    GENERAL: { ...DEFAULT_TASK_CONFIG },
  },
  cache: {
    defaultCacheTtlMs: 24 * 60 * 60 * 1000,
    defaultCacheHardExpireMs: 7 * 24 * 60 * 60 * 1000,
    useAiLogAsCache: true,
  },
  gateway: {
    defaultTimeoutMs: 30_000,
    maxAutoRetries: 1,
  },
  sanitization: {
    defaultIncludeSensitiveData: false,
    adminDebugAllowed: false,
  },
  cost: {},
  features: {
    contactSummary: true,
    contactSummaryRefresh: true,
    contactSummaryAutoGenerate: false,
    recommendation: false,
    copilot: false,
  },
};
