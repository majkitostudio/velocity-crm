import type { AiFeatureFlagContext, AiFeatureFlags } from "../flags/ai-feature-flag.types";

import type { AiServiceDescriptor } from "./ai-service-descriptor";
import { listAiServiceDescriptors } from "./ai-service-registry";

export function listEnabledAiServiceDescriptors(
  ctx: AiFeatureFlagContext,
  featureFlags: AiFeatureFlags,
): readonly AiServiceDescriptor[] {
  if (!featureFlags.isEnabled("ai.enabled", ctx)) {
    return Object.freeze([]);
  }

  return Object.freeze(
    listAiServiceDescriptors().filter((descriptor) =>
      featureFlags.isEnabled(descriptor.featureFlag, ctx),
    ),
  );
}
