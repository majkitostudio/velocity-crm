import "server-only";

import { cache } from "react";

import { NotFoundError } from "@/src/domain/errors";
import { requireCurrentUser } from "@/src/server/auth/guards";

import type { ContactDetailView } from "../types";
import { buildWorkflowBadge } from "../view/build-workflow-badge";
import { listNotesForContact } from "./notes.read.repository";
import {
  countFailOutcomesForContact,
  findContactDetailByIdForCompany,
  findLatestCallForContact,
} from "./contacts.repository";
import { assertContactAccess } from "./contacts.service";
import { assertSourceCallbackForCall } from "@/src/features/callbacks/server/callbacks.service";
import { listOpenCallbacksForContact } from "@/src/features/callbacks/server/callbacks.repository";
import { FAIL_THRESHOLD } from "@/src/domain/workflow";

export const getContactDetailView = cache(async function getContactDetailView(
  contactId: string,
  options?: { sourceCallbackId?: string | null },
): Promise<ContactDetailView> {
  const currentUser = await requireCurrentUser();

  await assertContactAccess({
    currentUser,
    contactId,
  });

  const [contact, failCount, lastCall, openCallbacks, notes] = await Promise.all([
    findContactDetailByIdForCompany({
      companyId: currentUser.companyId,
      contactId,
    }),
    countFailOutcomesForContact({
      companyId: currentUser.companyId,
      contactId,
    }),
    findLatestCallForContact({
      companyId: currentUser.companyId,
      contactId,
    }),
    listOpenCallbacksForContact({
      companyId: currentUser.companyId,
      contactId,
    }),
    listNotesForContact({
      companyId: currentUser.companyId,
      contactId,
    }),
  ]);

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

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

  const workflowBadge = buildWorkflowBadge({
    status: contact.status,
    assignedUserId: contact.assignedUserId,
    inProgress: true,
  });

  return {
    contact,
    workflowBadge,
    context: {
      openCallbacks,
      failCount,
      failThreshold: FAIL_THRESHOLD,
      lastCall: lastCall
        ? {
            id: lastCall.id,
            outcome: lastCall.outcome,
            createdAt: lastCall.createdAt,
            operatorName: lastCall.operator.name,
          }
        : null,
    },
    notes: notes.map((note) => ({
      id: note.id,
      body: note.body,
      createdAt: note.createdAt,
      authorName: note.author.name,
    })),
    callWorkflow: {
      failCount,
      failThreshold: FAIL_THRESHOLD,
      sourceCallbackId,
      sourceCallbackScheduledAt,
      sourceCallbackNote,
    },
  };
});
