import type { AppUserRole } from "@/src/domain/auth";

export const AI_FEATURE_FLAG_KEYS = [
  "ai.enabled",
  "ai.contact_summary",
  "ai.contact_summary.enabled",
  "ai.contact_summary.refresh",
  "ai.contact_summary.auto_generate",
  "ai.recommendation",
  "ai.recommendation.refresh",
  "ai.recommendation.auto_generate",
  "ai.call_prep.enabled",
  "ai.call_prep.refresh",
  "ai.call_prep.auto_generate",
  "ai.email_draft.enabled",
  "ai.email_draft.refresh",
  "ai.email_draft.auto_generate",
  "ai.sms_draft.enabled",
  "ai.sms_draft.refresh",
  "ai.sms_draft.auto_generate",
  "ai.copilot",
  "ai.copilot.refresh",
  "ai.copilot.auto_generate",
] as const;

export type AiFeatureFlagKey = (typeof AI_FEATURE_FLAG_KEYS)[number];

export type AiFeatureFlagContext = {
  companyId: string;
  userId: string;
  userRole: AppUserRole;
};

export type AiFeatureFlags = {
  isEnabled(key: AiFeatureFlagKey, ctx: AiFeatureFlagContext): boolean;
  getReason(key: AiFeatureFlagKey, ctx: AiFeatureFlagContext): string | null;
};
