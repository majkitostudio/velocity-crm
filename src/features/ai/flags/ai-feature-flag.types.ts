import type { AppUserRole } from "@/src/domain/auth";

export const AI_FEATURE_FLAG_KEYS = [
  "ai.enabled",
  "ai.contact_summary",
  "ai.contact_summary.refresh",
  "ai.contact_summary.auto_generate",
  "ai.recommendation",
  "ai.copilot",
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
