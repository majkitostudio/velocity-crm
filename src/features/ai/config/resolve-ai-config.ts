import type { LlmTaskProfile } from "@/src/features/ai/llm/types/llm-model";

import type { AiConfigContext, AiConfiguration, AiTaskConfig } from "./ai-config.types";
import { defaultAiConfig } from "./default-ai-config";
import { readEnvAiConfigOverrides } from "./env-ai-config";

function mergeAiConfiguration(
  base: AiConfiguration,
  overrides: Partial<AiConfiguration>,
): AiConfiguration {
  return {
    ...base,
    ...overrides,
    tasks: { ...base.tasks, ...overrides.tasks },
    cache: { ...base.cache, ...overrides.cache },
    gateway: { ...base.gateway, ...overrides.gateway },
    sanitization: { ...base.sanitization, ...overrides.sanitization },
    cost: { ...base.cost, ...overrides.cost },
    features: { ...base.features, ...overrides.features },
  };
}

export function resolveAiConfig(ctx?: AiConfigContext): AiConfiguration {
  void ctx;
  const envOverrides = readEnvAiConfigOverrides();
  return mergeAiConfiguration(defaultAiConfig, envOverrides);
}

export function getAiTaskConfig(
  taskProfile: LlmTaskProfile,
  ctx?: AiConfigContext,
): AiTaskConfig {
  return resolveAiConfig(ctx).tasks[taskProfile];
}
