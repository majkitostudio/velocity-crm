"use server";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
} from "@/src/domain/action-result";
import { requireCurrentUser } from "@/src/server/auth/guards";

import { buildContactSummaryExecuteInput } from "../lib/build-contact-summary-execute-input";
import { mapContactSummaryActionError } from "../lib/map-contact-summary-action-error";
import { getAiFeatureFlags } from "../flags/get-ai-feature-flags";
import { generateContactSummary } from "../services/contact-summary/generate-contact-summary";
import type { SummaryViewModel } from "../types/summary-view-model";

export async function generateContactSummaryAction(
  contactId: string,
): Promise<ActionResult<SummaryViewModel>> {
  const trimmedContactId = contactId.trim();

  if (!trimmedContactId) {
    return actionFailure("Kontakt nebyl nalezen.");
  }

  try {
    const user = await requireCurrentUser();
    const flagContext = {
      companyId: user.companyId,
      userId: user.id,
      userRole: user.role,
    };
    const flags = getAiFeatureFlags();

    if (!flags.isEnabled("ai.enabled", flagContext)) {
      return actionFailure("AI shrnutí není dostupné.");
    }

    if (!flags.isEnabled("ai.contact_summary", flagContext)) {
      return actionFailure(
        flags.getReason("ai.contact_summary", flagContext) ??
          "AI shrnutí není dostupné.",
      );
    }

    const viewModel = await generateContactSummary(
      buildContactSummaryExecuteInput(user, trimmedContactId),
    );

    return actionSuccess(viewModel);
  } catch (error) {
    return actionFailure(mapContactSummaryActionError(error));
  }
}
