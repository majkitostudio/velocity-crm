"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
} from "@/src/domain/action-result";
import { requireCurrentUser } from "@/src/server/auth/guards";

import { buildAiServiceExecuteInput } from "../lib/build-ai-service-execute-input";
import { mapContactRecommendationActionError } from "../lib/map-contact-recommendation-action-error";
import { getAiFeatureFlags } from "../flags/get-ai-feature-flags";
import { generateRecommendation } from "../services/recommendation/generate-recommendation";
import type { RecommendationViewModel } from "../types/recommendation-view-model";

const contactRecommendationActionSchema = z.object({
  contactId: z.string().trim().min(1),
});

export async function generateContactRecommendationAction(
  contactId: string,
  force?: boolean,
): Promise<ActionResult<RecommendationViewModel>> {
  const parsed = contactRecommendationActionSchema.safeParse({ contactId });

  if (!parsed.success) {
    return actionFailure("Kontakt nebyl nalezen.");
  }

  const trimmedContactId = parsed.data.contactId;

  try {
    const user = await requireCurrentUser();
    const flagContext = {
      companyId: user.companyId,
      userId: user.id,
      userRole: user.role,
    };
    const flags = getAiFeatureFlags();

    if (!flags.isEnabled("ai.enabled", flagContext)) {
      return actionFailure("AI doporučení není dostupné.");
    }

    if (!flags.isEnabled("ai.recommendation", flagContext)) {
      return actionFailure(
        flags.getReason("ai.recommendation", flagContext) ??
          "AI doporučení není dostupné.",
      );
    }

    if (force === true && !flags.isEnabled("ai.recommendation.refresh", flagContext)) {
      return actionFailure(
        flags.getReason("ai.recommendation.refresh", flagContext) ??
          "Obnovení doporučení není dostupné.",
      );
    }

    const viewModel = await generateRecommendation(
      buildAiServiceExecuteInput(
        user,
        trimmedContactId,
        force === true ? { force: true } : undefined,
      ),
    );

    revalidatePath(`/contacts/${trimmedContactId}`);

    return actionSuccess(viewModel);
  } catch (error) {
    return actionFailure(mapContactRecommendationActionError(error));
  }
}
