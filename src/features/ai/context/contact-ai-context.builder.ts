import { getContactContextForTenant } from "@/src/features/contacts/context/contact-context.cached";

import { toContactAiContext } from "./mappers/to-contact-ai-context";
import { mapAiBuildOptionsToContactContextOptions } from "./lib/map-build-options";
import type { BuildContactAiContextOptions } from "./types/build-options";
import type { ContactContextProviderInput } from "@/src/features/contacts/context/types/contact-context-provider";
import type { ContactAiContext } from "./types/contact-ai-context";

export type BuildContactAiContextForTenantInput = ContactContextProviderInput & {
  options?: BuildContactAiContextOptions;
};

/**
 * Thin wrapper over ContactContextBuilder (Slice 10.5).
 * Preserves the Slice 10 ContactAiContext contract for AI consumers.
 */
export async function buildContactAiContextForTenant(
  input: BuildContactAiContextForTenantInput,
): Promise<ContactAiContext> {
  const context = await getContactContextForTenant({
    companyId: input.companyId,
    contactId: input.contactId,
    options: mapAiBuildOptionsToContactContextOptions(input.options),
  });

  return toContactAiContext(context);
}
