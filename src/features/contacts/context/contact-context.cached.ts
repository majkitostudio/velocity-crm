import { cache } from "react";

import {
  buildContactContextForTenant,
  type BuildContactContextForTenantInput,
} from "./contact-context.builder";
import type { ContactContext } from "./types/contact-context";

export const getContactContextForTenant = cache(async function getContactContextForTenant(
  input: BuildContactContextForTenantInput,
): Promise<ContactContext> {
  return buildContactContextForTenant(input);
});
