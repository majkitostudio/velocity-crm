import "server-only";

import { requireCurrentUser } from "@/src/server/auth/guards";

import { getAiFeatureFlags } from "../flags/get-ai-feature-flags";

export async function isContactSummaryUiEnabled(): Promise<boolean> {
  const user = await requireCurrentUser();
  const flags = getAiFeatureFlags();

  if (!flags.isEnabled("ai.enabled", {
    companyId: user.companyId,
    userId: user.id,
    userRole: user.role,
  })) {
    return false;
  }

  return flags.isEnabled("ai.contact_summary", {
    companyId: user.companyId,
    userId: user.id,
    userRole: user.role,
  });
}
