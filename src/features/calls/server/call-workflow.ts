import "server-only";

import { CallOutcome } from "@/src/generated/prisma/client";
import { ValidationError } from "@/src/domain/errors";
import { FAIL_THRESHOLD, callLaterScheduledAt } from "@/src/domain/workflow";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import type { CurrentUser } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";
import { recordAuditEvent } from "@/src/server/audit";

import {
  completeSourceCallbackInTransaction,
  createCallbackInTransaction,
  assertSourceCallbackForCall,
} from "@/src/features/callbacks/server/callbacks.service";
import { assertContactAccess } from "@/src/features/contacts/server/contacts.service";
import {
  countFailOutcomesForContactInTransaction,
  updateContactStatusForCompany,
} from "@/src/features/contacts/server/contacts.repository";
import {
  createCallActivityForCompany,
  findRecentCallActivityForOperator,
} from "./calls.repository";
import type { CompleteCallResult } from "../types";

const IDEMPOTENCY_WINDOW_MS = 30_000;

export type CompleteCallInput = {
  contactId: string;
  outcome: CallOutcome;
  note?: string | null;
  sourceCallbackId?: string | null;
  scheduledAt?: Date | null;
  idempotencyKey: string;
};

function shouldCompleteSourceCallback(outcome: CallOutcome): boolean {
  return outcome === CallOutcome.CALL_LATER || outcome === CallOutcome.SCHEDULE_CALL;
}

export async function completeCall(
  currentUser: CurrentUser,
  input: CompleteCallInput,
): Promise<CompleteCallResult> {
  if (input.outcome === CallOutcome.ORDER) {
    throw new ValidationError("Order outcome is not available yet");
  }

  const recentDuplicate = await findRecentCallActivityForOperator({
    companyId: currentUser.companyId,
    contactId: input.contactId,
    operatorId: currentUser.id,
    outcome: input.outcome,
    since: new Date(Date.now() - IDEMPOTENCY_WINDOW_MS),
  });

  if (recentDuplicate) {
    const failCount = await countFailOutcomesForContactInTransaction(prisma, {
      companyId: currentUser.companyId,
      contactId: input.contactId,
    });

    const contact = await assertContactAccess({
      currentUser,
      contactId: input.contactId,
    });

    return {
      callActivityId: recentDuplicate.id,
      outcome: recentDuplicate.outcome,
      contactStatus: contact.status,
      callbackId: recentDuplicate.callbackId ?? undefined,
      failCount,
      contactBecameLost: contact.status === "LOST",
    };
  }

  const contact = await assertContactAccess({
    currentUser,
    contactId: input.contactId,
  });

  const sourceCallback = await assertSourceCallbackForCall({
    currentUser,
    contactId: input.contactId,
    sourceCallbackId: input.sourceCallbackId,
  });

  if (input.outcome === CallOutcome.SCHEDULE_CALL) {
    if (!input.scheduledAt) {
      throw new ValidationError("Scheduled date and time is required");
    }

    if (input.scheduledAt.getTime() <= Date.now()) {
      throw new ValidationError("Scheduled date and time must be in the future");
    }
  }

  return prisma.$transaction(async (tx) => {
    let createdCallbackId: string | undefined;
    let linkedCallbackId: string | null = sourceCallback?.id ?? null;

    if (input.outcome === CallOutcome.CALL_LATER) {
      const callback = await createCallbackInTransaction(tx, {
        companyId: currentUser.companyId,
        contactId: contact.id,
        assignedUserId: currentUser.id,
        scheduledAt: callLaterScheduledAt(),
        note: input.note ?? null,
      });
      createdCallbackId = callback.id;
      linkedCallbackId = callback.id;
    }

    if (input.outcome === CallOutcome.SCHEDULE_CALL && input.scheduledAt) {
      const callback = await createCallbackInTransaction(tx, {
        companyId: currentUser.companyId,
        contactId: contact.id,
        assignedUserId: currentUser.id,
        scheduledAt: input.scheduledAt,
        note: input.note ?? null,
      });
      createdCallbackId = callback.id;
      linkedCallbackId = callback.id;
    }

    const callActivity = await createCallActivityForCompany(tx, {
      companyId: currentUser.companyId,
      contactId: contact.id,
      operatorId: currentUser.id,
      outcome: input.outcome,
      note: input.note ?? null,
      callbackId: linkedCallbackId,
    });

    if (sourceCallback && shouldCompleteSourceCallback(input.outcome)) {
      await completeSourceCallbackInTransaction(tx, {
        companyId: currentUser.companyId,
        callbackId: sourceCallback.id,
      });
    }

    let contactStatus = contact.status;
    let contactBecameLost = false;

    if (input.outcome === CallOutcome.FAIL) {
      const failCount = await countFailOutcomesForContactInTransaction(tx, {
        companyId: currentUser.companyId,
        contactId: contact.id,
      });

      if (failCount >= FAIL_THRESHOLD) {
        const updated = await updateContactStatusForCompany(tx, {
          companyId: currentUser.companyId,
          contactId: contact.id,
          status: "LOST",
        });
        contactStatus = updated.status;
        contactBecameLost = true;

        await recordAuditEvent({
          companyId: currentUser.companyId,
          actorUserId: currentUser.id,
          action: AuditActions.CONTACT_STATUS_CHANGED,
          entityType: AuditEntityTypes.CONTACT,
          entityId: contact.id,
          metadata: {
            from: contact.status,
            to: "LOST",
            reason: "fail_threshold",
            failCount,
          },
        });
      }

      await recordAuditEvent({
        companyId: currentUser.companyId,
        actorUserId: currentUser.id,
        action: AuditActions.CALL_COMPLETED,
        entityType: AuditEntityTypes.CALL_ACTIVITY,
        entityId: callActivity.id,
        metadata: {
          outcome: input.outcome,
          failCount,
          contactBecameLost,
          idempotencyKey: input.idempotencyKey,
        },
      });

      return {
        callActivityId: callActivity.id,
        outcome: input.outcome,
        contactStatus,
        failCount,
        contactBecameLost,
      };
    }

    if (createdCallbackId) {
      await recordAuditEvent({
        companyId: currentUser.companyId,
        actorUserId: currentUser.id,
        action: AuditActions.CALLBACK_CREATED,
        entityType: AuditEntityTypes.CALLBACK,
        entityId: createdCallbackId,
        metadata: {
          source: input.outcome,
          sourceCallbackId: sourceCallback?.id ?? null,
        },
      });
    }

    await recordAuditEvent({
      companyId: currentUser.companyId,
      actorUserId: currentUser.id,
      action: AuditActions.CALL_COMPLETED,
      entityType: AuditEntityTypes.CALL_ACTIVITY,
      entityId: callActivity.id,
      metadata: {
        outcome: input.outcome,
        idempotencyKey: input.idempotencyKey,
        sourceCallbackId: sourceCallback?.id ?? null,
      },
    });

    const failCount = await countFailOutcomesForContactInTransaction(tx, {
      companyId: currentUser.companyId,
      contactId: contact.id,
    });

    return {
      callActivityId: callActivity.id,
      outcome: input.outcome,
      contactStatus,
      callbackId: createdCallbackId,
      failCount,
      contactBecameLost,
    };
  });
}
