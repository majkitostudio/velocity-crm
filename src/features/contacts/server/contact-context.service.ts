import "server-only";

import { requireCurrentUser } from "@/src/server/auth/guards";
import type { CurrentUser } from "@/src/server/auth/guards";

import { getContactContextForTenant } from "../context/contact-context.cached";
import { buildContactContextForTenant } from "../context/contact-context.builder";
import type { BuildContactContextOptions } from "../context/types/build-options";
import type { ContactContext } from "../context/types/contact-context";
import { assertContactAccess } from "./contacts.service";

export { getContactContextForTenant };

export async function getContactContext(
  contactId: string,
  options?: BuildContactContextOptions,
): Promise<ContactContext> {
  const currentUser = await requireCurrentUser();

  await assertContactAccess({
    currentUser,
    contactId,
  });

  return getContactContextForTenant({
    companyId: currentUser.companyId,
    contactId,
    options,
  });
}

export async function getContactContextForUser(
  currentUser: CurrentUser,
  contactId: string,
  options?: BuildContactContextOptions,
): Promise<ContactContext> {
  await assertContactAccess({
    currentUser,
    contactId,
  });

  return getContactContextForTenant({
    companyId: currentUser.companyId,
    contactId,
    options,
  });
}

export { buildContactContextForTenant };
