import "server-only";

import { requireCurrentUser } from "@/src/server/auth/guards";

import { getAiFeatureFlags } from "../flags/get-ai-feature-flags";

function buildFlagContext(user: {
  companyId: string;
  id: string;
  role: import("@/src/domain/auth").AppUserRole;
}) {
  return {
    companyId: user.companyId,
    userId: user.id,
    userRole: user.role,
  };
}

export async function isContactRecommendationUiEnabled(): Promise<boolean> {
  const user = await requireCurrentUser();
  const flags = getAiFeatureFlags();
  const flagContext = buildFlagContext(user);

  if (!flags.isEnabled("ai.enabled", flagContext)) {
    return false;
  }

  return flags.isEnabled("ai.recommendation", flagContext);
}

export async function isContactRecommendationRefreshEnabled(): Promise<boolean> {
  const user = await requireCurrentUser();
  const flags = getAiFeatureFlags();
  const flagContext = buildFlagContext(user);

  if (!flags.isEnabled("ai.enabled", flagContext)) {
    return false;
  }

  if (!flags.isEnabled("ai.recommendation", flagContext)) {
    return false;
  }

  return flags.isEnabled("ai.recommendation.refresh", flagContext);
}
