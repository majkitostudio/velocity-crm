import type { AiServiceId } from "../registry/ai-service-id";

import type { AiFeatureFlagKey } from "./ai-feature-flag.types";

export type AiServiceFeatureFlagKeys = {
  readonly enabled: AiFeatureFlagKey;
  readonly refresh: AiFeatureFlagKey;
  readonly autoGenerate: AiFeatureFlagKey;
};

export const AI_SERVICE_FEATURE_FLAG_REGISTRY: Readonly<
  Record<AiServiceId, AiServiceFeatureFlagKeys>
> = Object.freeze({
  "contact-summary": {
    enabled: "ai.contact_summary",
    refresh: "ai.contact_summary.refresh",
    autoGenerate: "ai.contact_summary.auto_generate",
  },
  recommendation: {
    enabled: "ai.recommendation",
    refresh: "ai.recommendation.refresh",
    autoGenerate: "ai.recommendation.auto_generate",
  },
  "call-prep": {
    enabled: "ai.call_prep.enabled",
    refresh: "ai.call_prep.refresh",
    autoGenerate: "ai.call_prep.auto_generate",
  },
  "email-draft": {
    enabled: "ai.email_draft.enabled",
    refresh: "ai.email_draft.refresh",
    autoGenerate: "ai.email_draft.auto_generate",
  },
  "sms-draft": {
    enabled: "ai.sms_draft.enabled",
    refresh: "ai.sms_draft.refresh",
    autoGenerate: "ai.sms_draft.auto_generate",
  },
  copilot: {
    enabled: "ai.copilot",
    refresh: "ai.copilot.refresh",
    autoGenerate: "ai.copilot.auto_generate",
  },
});

export function getAiServiceFeatureFlagKeys(
  serviceId: AiServiceId,
): AiServiceFeatureFlagKeys {
  return AI_SERVICE_FEATURE_FLAG_REGISTRY[serviceId];
}
