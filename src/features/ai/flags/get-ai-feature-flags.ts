import type { AiFeatureFlags } from "./ai-feature-flag.types";
import { createEnvAiFeatureFlags } from "./env-ai-feature-flags";

let cachedFeatureFlags: AiFeatureFlags | null = null;

export function getAiFeatureFlags(): AiFeatureFlags {
  if (!cachedFeatureFlags) {
    cachedFeatureFlags = createEnvAiFeatureFlags();
  }
  return cachedFeatureFlags;
}

export function resetAiFeatureFlagsForTests(): void {
  cachedFeatureFlags = null;
}
