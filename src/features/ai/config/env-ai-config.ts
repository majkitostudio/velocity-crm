import type { AiConfiguration } from "./ai-config.types";

function readBooleanEnv(name: string): boolean | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }
  return value === "true" || value === "1";
}

function readNumberEnv(name: string): number | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readEnvAiConfigOverrides(): Partial<AiConfiguration> {
  const enabled = readBooleanEnv("AI_ENABLED");
  const defaultCacheTtlMs =
    readNumberEnv("AI_CACHE_DEFAULT_TTL_MS") ?? readNumberEnv("AI_CACHE_SUMMARY_TTL_MS");
  const defaultCacheHardExpireMs =
    readNumberEnv("AI_CACHE_DEFAULT_HARD_EXPIRE_MS") ??
    readNumberEnv("AI_CACHE_SUMMARY_HARD_EXPIRE_MS");
  const defaultTimeoutMs = readNumberEnv("AI_GATEWAY_TIMEOUT_MS");
  const maxAutoRetries = readNumberEnv("AI_GATEWAY_MAX_AUTO_RETRIES");

  const contactSummary = readBooleanEnv("AI_FEATURE_CONTACT_SUMMARY");
  const contactSummaryRefresh = readBooleanEnv("AI_FEATURE_CONTACT_SUMMARY_REFRESH");
  const contactSummaryAutoGenerate = readBooleanEnv(
    "AI_FEATURE_CONTACT_SUMMARY_AUTO_GENERATE",
  );
  const recommendation = readBooleanEnv("AI_FEATURE_RECOMMENDATION");
  const copilot = readBooleanEnv("AI_FEATURE_COPILOT");

  const overrides: Partial<AiConfiguration> = {};

  if (enabled !== undefined) {
    overrides.enabled = enabled;
  }

  if (
    defaultCacheTtlMs !== undefined ||
    defaultCacheHardExpireMs !== undefined ||
    readBooleanEnv("AI_CACHE_USE_AILOG") !== undefined
  ) {
    overrides.cache = {
      defaultCacheTtlMs: defaultCacheTtlMs ?? 0,
      defaultCacheHardExpireMs: defaultCacheHardExpireMs ?? 0,
      useAiLogAsCache: readBooleanEnv("AI_CACHE_USE_AILOG") ?? true,
    };
  }

  if (defaultTimeoutMs !== undefined || maxAutoRetries !== undefined) {
    overrides.gateway = {
      defaultTimeoutMs: defaultTimeoutMs ?? 0,
      maxAutoRetries: maxAutoRetries ?? 0,
    };
  }

  if (
    contactSummary !== undefined ||
    contactSummaryRefresh !== undefined ||
    contactSummaryAutoGenerate !== undefined ||
    recommendation !== undefined ||
    copilot !== undefined
  ) {
    overrides.features = {
      contactSummary: contactSummary ?? true,
      contactSummaryRefresh: contactSummaryRefresh ?? true,
      contactSummaryAutoGenerate: contactSummaryAutoGenerate ?? false,
      recommendation: recommendation ?? false,
      copilot: copilot ?? false,
    };
  }

  return overrides;
}
