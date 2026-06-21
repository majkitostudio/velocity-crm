import "server-only";

import { requireCurrentUser } from "@/src/server/auth/guards";
import type { CurrentUser } from "@/src/server/auth/guards";

import {
  buildContactAiContextForTenant,
  type BuildContactAiContextForTenantInput,
} from "../context/contact-ai-context.builder";
import type { BuildContactAiContextOptions } from "../context/types/build-options";
import type { ContactAiContext } from "../context/types/contact-ai-context";
import { assertContactAccess } from "@/src/features/contacts/server/contacts.service";

export async function buildContactAiContext(
  contactId: string,
  options?: BuildContactAiContextOptions,
): Promise<ContactAiContext> {
  const currentUser = await requireCurrentUser();

  await assertContactAccess({
    currentUser,
    contactId,
  });

  return buildContactAiContextForTenant({
    companyId: currentUser.companyId,
    contactId,
    options,
  });
}

export async function buildContactAiContextForUser(
  currentUser: CurrentUser,
  contactId: string,
  options?: BuildContactAiContextOptions,
): Promise<ContactAiContext> {
  await assertContactAccess({
    currentUser,
    contactId,
  });

  return buildContactAiContextForTenant({
    companyId: currentUser.companyId,
    contactId,
    options,
  });
}

export type { BuildContactAiContextForTenantInput };

export { buildContactAiContextForTenant };
