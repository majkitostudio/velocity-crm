import "server-only";

import { cache } from "react";

import { assertSourceCallbackForCall } from "@/src/features/callbacks/server/callbacks.service";
import { getNextQueueContactHref } from "@/src/features/operator-queue/server/queue.service";
import { CONTACT_DETAIL_CONTEXT_OPTIONS } from "@/src/features/contacts/context/types/build-options";

import type { ContactDetailView } from "../types";
import { mapContactDetailView } from "../view/map-contact-detail-view";
import { getContactContextForTenant } from "./contact-context.service";
import { requireCurrentUser } from "@/src/server/auth/guards";
import { assertContactAccess } from "./contacts.service";

export const getContactDetailView = cache(async function getContactDetailView(
  contactId: string,
  options?: { sourceCallbackId?: string | null },
): Promise<ContactDetailView> {
  const currentUser = await requireCurrentUser();

  await assertContactAccess({
    currentUser,
    contactId,
  });

  const context = await getContactContextForTenant({
    companyId: currentUser.companyId,
    contactId,
    options: CONTACT_DETAIL_CONTEXT_OPTIONS,
  });

  let sourceCallbackId: string | null = null;
  let sourceCallbackScheduledAt: Date | null = null;
  let sourceCallbackNote: string | null = null;

  if (options?.sourceCallbackId) {
    try {
      const sourceCallback = await assertSourceCallbackForCall({
        currentUser,
        contactId,
        sourceCallbackId: options.sourceCallbackId,
      });

      if (sourceCallback) {
        sourceCallbackId = sourceCallback.id;
        sourceCallbackScheduledAt = sourceCallback.scheduledAt;
        sourceCallbackNote = sourceCallback.note;
      }
    } catch {
      sourceCallbackId = null;
      sourceCallbackScheduledAt = null;
      sourceCallbackNote = null;
    }
  }

  const nextContactHref = await getNextQueueContactHref(contactId);

  return mapContactDetailView(context, {
    sourceCallbackId,
    sourceCallbackScheduledAt,
    sourceCallbackNote,
    nextContactHref,
  });
});
