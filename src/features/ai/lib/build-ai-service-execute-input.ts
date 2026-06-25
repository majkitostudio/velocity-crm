import type { CurrentUser } from "@/src/server/auth/guards";

import type { AiServiceExecuteInput } from "../services/shared/ai-task-service";

export function buildAiServiceExecuteInput(
  user: CurrentUser,
  contactId: string,
  options?: Pick<AiServiceExecuteInput, "locale" | "force">,
): AiServiceExecuteInput {
  return {
    companyId: user.companyId,
    userId: user.id,
    userRole: user.role,
    contactId,
    locale: options?.locale ?? "cs",
    force: options?.force,
  };
}
