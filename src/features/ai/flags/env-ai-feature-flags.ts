import type {
  AiFeatureFlagContext,
  AiFeatureFlagKey,
  AiFeatureFlags,
} from "./ai-feature-flag.types";
import { resolveAiConfig } from "../config/resolve-ai-config";

function readBooleanEnv(name: string): boolean | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }
  return value === "true" || value === "1";
}

const ENV_FLAG_MAP: Record<AiFeatureFlagKey, string> = {
  "ai.enabled": "AI_ENABLED",
  "ai.contact_summary": "AI_FEATURE_CONTACT_SUMMARY",
  "ai.contact_summary.refresh": "AI_FEATURE_CONTACT_SUMMARY_REFRESH",
  "ai.contact_summary.auto_generate": "AI_FEATURE_CONTACT_SUMMARY_AUTO_GENERATE",
  "ai.recommendation": "AI_FEATURE_RECOMMENDATION",
  "ai.copilot": "AI_FEATURE_COPILOT",
};

function resolveDefaultFlag(key: AiFeatureFlagKey): boolean {
  const config = resolveAiConfig();

  if (!config.enabled) {
    return false;
  }

  switch (key) {
    case "ai.enabled":
      return config.enabled;
    case "ai.contact_summary":
      return config.features.contactSummary;
    case "ai.contact_summary.refresh":
      return config.features.contactSummaryRefresh;
    case "ai.contact_summary.auto_generate":
      return config.features.contactSummaryAutoGenerate;
    case "ai.recommendation":
      return config.features.recommendation;
    case "ai.copilot":
      return config.features.copilot;
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export function createEnvAiFeatureFlags(): AiFeatureFlags {
  return {
    isEnabled(key: AiFeatureFlagKey, ctx: AiFeatureFlagContext): boolean {
      void ctx;
      const envValue = readBooleanEnv(ENV_FLAG_MAP[key]);
      if (envValue !== undefined) {
        return envValue;
      }
      return resolveDefaultFlag(key);
    },

    getReason(key: AiFeatureFlagKey, ctx: AiFeatureFlagContext): string | null {
      if (this.isEnabled(key, ctx)) {
        return null;
      }

      const envValue = readBooleanEnv(ENV_FLAG_MAP[key]);
      if (envValue === false) {
        return `Feature flag ${key} disabled via environment`;
      }

      if (!resolveAiConfig().enabled) {
        return "AI is globally disabled";
      }

      return `Feature flag ${key} is disabled by default configuration`;
    },
  };
}
