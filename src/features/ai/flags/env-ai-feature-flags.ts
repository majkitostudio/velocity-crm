import type {
  AiFeatureFlagContext,
  AiFeatureFlagKey,
  AiFeatureFlags,
} from "./ai-feature-flag.types";
import {
  AI_SERVICE_FEATURE_FLAG_REGISTRY,
  type AiServiceFeatureFlagKeys,
} from "./ai-service-feature-flag-registry";
import { resolveAiConfig } from "../config/resolve-ai-config";

function readBooleanEnv(name: string): boolean | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }
  return value === "true" || value === "1";
}

const ENV_FLAG_MAP: Partial<Record<AiFeatureFlagKey, string>> = {
  "ai.enabled": "AI_ENABLED",
  "ai.contact_summary": "AI_FEATURE_CONTACT_SUMMARY",
  "ai.contact_summary.enabled": "AI_FEATURE_CONTACT_SUMMARY",
  "ai.contact_summary.refresh": "AI_FEATURE_CONTACT_SUMMARY_REFRESH",
  "ai.contact_summary.auto_generate": "AI_FEATURE_CONTACT_SUMMARY_AUTO_GENERATE",
  "ai.recommendation": "AI_FEATURE_RECOMMENDATION",
  "ai.recommendation.refresh": "AI_FEATURE_RECOMMENDATION_REFRESH",
  "ai.recommendation.auto_generate": "AI_FEATURE_RECOMMENDATION_AUTO_GENERATE",
  "ai.copilot": "AI_FEATURE_COPILOT",
};

function resolveServiceFlagDefault(
  keys: AiServiceFeatureFlagKeys,
  flag: keyof AiServiceFeatureFlagKeys,
): boolean {
  const config = resolveAiConfig();

  if (!config.enabled) {
    return false;
  }

  if (keys.enabled === "ai.contact_summary") {
    if (flag === "enabled") {
      return config.features.contactSummary;
    }
    if (flag === "refresh") {
      return config.features.contactSummaryRefresh;
    }
    if (flag === "autoGenerate") {
      return config.features.contactSummaryAutoGenerate;
    }
  }

  if (keys.enabled === "ai.recommendation") {
    if (flag === "enabled") {
      return config.features.recommendation;
    }
    if (flag === "refresh") {
      return config.features.recommendationRefresh;
    }
    if (flag === "autoGenerate") {
      return config.features.recommendationAutoGenerate;
    }
  }

  if (keys.enabled === "ai.copilot") {
    if (flag === "enabled") {
      return config.features.copilot;
    }
    return false;
  }

  return false;
}

function resolveDefaultFlag(key: AiFeatureFlagKey): boolean {
  const config = resolveAiConfig();

  if (!config.enabled) {
    return false;
  }

  if (key === "ai.enabled") {
    return config.enabled;
  }

  for (const keys of Object.values(AI_SERVICE_FEATURE_FLAG_REGISTRY)) {
    if (keys.enabled === key) {
      return resolveServiceFlagDefault(keys, "enabled");
    }
    if (keys.refresh === key) {
      return resolveServiceFlagDefault(keys, "refresh");
    }
    if (keys.autoGenerate === key) {
      return resolveServiceFlagDefault(keys, "autoGenerate");
    }
  }

  if (key === "ai.contact_summary.enabled") {
    return config.features.contactSummary;
  }

  return false;
}

export function createEnvAiFeatureFlags(): AiFeatureFlags {
  return {
    isEnabled(key: AiFeatureFlagKey, ctx: AiFeatureFlagContext): boolean {
      void ctx;
      const envValue = readBooleanEnv(ENV_FLAG_MAP[key] ?? "");
      if (envValue !== undefined) {
        return envValue;
      }
      return resolveDefaultFlag(key);
    },

    getReason(key: AiFeatureFlagKey, ctx: AiFeatureFlagContext): string | null {
      if (this.isEnabled(key, ctx)) {
        return null;
      }

      const envKey = ENV_FLAG_MAP[key];
      if (envKey) {
        const envValue = readBooleanEnv(envKey);
        if (envValue === false) {
          return `Feature flag ${key} disabled via environment`;
        }
      }

      if (!resolveAiConfig().enabled) {
        return "AI is globally disabled";
      }

      return `Feature flag ${key} is disabled by default configuration`;
    },
  };
}
