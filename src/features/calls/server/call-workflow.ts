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
  findCallActivityByIdempotencyKeyForOperator,
} from "./calls.repository";
import type { CompleteCallResult } from "../types";
import type { OrderItemDraft } from "@/src/features/orders/types";
import { createOrderForCallInTransaction } from "@/src/features/orders/server/order-workflow";
import { getOrderCreatedResultById } from "@/src/features/orders/server/orders.service";
import { recordCallWorkflowActivities, recordCallWorkflowCallbackCompleted, recordCallWorkflowCallbackCreated } from "./call-workflow-activities";

export type CompleteCallInput = {
  contactId: string;
  outcome: CallOutcome;
  note?: string | null;
  sourceCallbackId?: string | null;
  scheduledAt?: Date | null;
  idempotencyKey: string;
  order?: {
    note?: string | null;
    items: OrderItemDraft[];
  };
};

function shouldCompleteSourceCallback(outcome: CallOutcome): boolean {
  return (
    outcome === CallOutcome.ORDER ||
    outcome === CallOutcome.CALL_LATER ||
    outcome === CallOutcome.SCHEDULE_CALL
  );
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function buildIdempotentResult(
  currentUser: CurrentUser,
  input: CompleteCallInput,
): Promise<CompleteCallResult | null> {
  const existing = await findCallActivityByIdempotencyKeyForOperator({
    companyId: currentUser.companyId,
    operatorId: currentUser.id,
    idempotencyKey: input.idempotencyKey,
  });

  if (!existing) {
    return null;
  }

  if (existing.contactId !== input.contactId || existing.outcome !== input.outcome) {
    throw new ValidationError("This call submission has already been used");
  }

  const [failCount, contact, orderResult] = await Promise.all([
    countFailOutcomesForContactInTransaction(prisma, {
      companyId: currentUser.companyId,
      contactId: input.contactId,
    }),
    assertContactAccess({
      currentUser,
      contactId: input.contactId,
    }),
    existing.orderId
      ? getOrderCreatedResultById({
          companyId: currentUser.companyId,
          orderId: existing.orderId,
        })
      : Promise.resolve(null),
  ]);

  return {
    callActivityId: existing.id,
    outcome: existing.outcome,
    contactStatus: contact.status,
    callbackId: existing.callbackId ?? undefined,
    orderId: existing.orderId ?? undefined,
    orderTotal: orderResult?.total,
    orderItemCount: orderResult?.itemCount,
    failCount,
    contactBecameLost: contact.status === "LOST",
  };
}

export async function completeCall(
  currentUser: CurrentUser,
  input: CompleteCallInput,
): Promise<CompleteCallResult> {
  const idempotentResult = await buildIdempotentResult(currentUser, input);

  if (idempotentResult) {
    return idempotentResult;
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

  try {
    return await prisma.$transaction(async (tx) => {
      let createdCallback: Awaited<ReturnType<typeof createCallbackInTransaction>> | undefined;
      let linkedCallbackId: string | null = sourceCallback?.id ?? null;
      let orderResult: Awaited<ReturnType<typeof createOrderForCallInTransaction>> | null =
        null;

      if (input.outcome === CallOutcome.ORDER) {
        if (!input.order) {
          throw new ValidationError("Order details are required");
        }

        orderResult = await createOrderForCallInTransaction(tx, {
          currentUser,
          contactId: contact.id,
          note: input.order.note,
          items: input.order.items,
        });
      }

      if (input.outcome === CallOutcome.CALL_LATER) {
        createdCallback = await createCallbackInTransaction(tx, {
          companyId: currentUser.companyId,
          contactId: contact.id,
          assignedUserId: currentUser.id,
          scheduledAt: callLaterScheduledAt(),
          note: input.note ?? null,
        });
        linkedCallbackId = createdCallback.id;
      }

      if (input.outcome === CallOutcome.SCHEDULE_CALL && input.scheduledAt) {
        createdCallback = await createCallbackInTransaction(tx, {
          companyId: currentUser.companyId,
          contactId: contact.id,
          assignedUserId: currentUser.id,
          scheduledAt: input.scheduledAt,
          note: input.note ?? null,
        });
        linkedCallbackId = createdCallback.id;
      }

      const callActivity = await createCallActivityForCompany(tx, {
        companyId: currentUser.companyId,
        contactId: contact.id,
        operatorId: currentUser.id,
        outcome: input.outcome,
        note: input.note ?? null,
        callbackId: linkedCallbackId,
        orderId: orderResult?.orderId ?? null,
        idempotencyKey: input.idempotencyKey,
      });

      if (sourceCallback && shouldCompleteSourceCallback(input.outcome)) {
        const completedCallback = await completeSourceCallbackInTransaction(tx, {
          companyId: currentUser.companyId,
          callbackId: sourceCallback.id,
        });

        await recordCallWorkflowCallbackCompleted({
          tx,
          currentUser,
          contactId: contact.id,
          callbackId: completedCallback.id,
          status: completedCallback.status,
          correlationId: input.idempotencyKey,
        });
      }

      let contactStatus = contact.status;
      let contactBecameLost = false;

      if (
        input.outcome === CallOutcome.ORDER &&
        contact.status !== "CUSTOMER" &&
        contact.status !== "VIP"
      ) {
        const updated = await updateContactStatusForCompany(tx, {
          companyId: currentUser.companyId,
          contactId: contact.id,
          status: "CUSTOMER",
        });
        contactStatus = updated.status;

      }

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

        }

        await recordAuditEvent({
          tx,
          companyId: currentUser.companyId,
          actorUserId: currentUser.id,
          action: AuditActions.CALL_COMPLETED,
          entityType: AuditEntityTypes.CALL_ACTIVITY,
          entityId: callActivity.id,
          contactId: contact.id,
          metadata: {
            outcome: input.outcome,
            failCount,
            contactBecameLost,
            idempotencyKey: input.idempotencyKey,
          },
        });

        await recordCallWorkflowActivities({
          tx,
          currentUser,
          contact,
          callActivityId: callActivity.id,
          outcome: input.outcome,
          note: input.note,
          correlationId: input.idempotencyKey,
          contactStatus,
          orderResult: null,
        });

        return {
          callActivityId: callActivity.id,
          outcome: input.outcome,
          contactStatus,
          failCount,
          contactBecameLost,
        };
      }

      if (createdCallback) {
        await recordCallWorkflowCallbackCreated({
          tx,
          currentUser,
          contactId: contact.id,
          callback: createdCallback,
          correlationId: input.idempotencyKey,
        });

        await recordAuditEvent({
          tx,
          companyId: currentUser.companyId,
          actorUserId: currentUser.id,
          action: AuditActions.CALLBACK_CREATED,
          entityType: AuditEntityTypes.CALLBACK,
          entityId: createdCallback.id,
          contactId: contact.id,
          metadata: {
            source: input.outcome,
            sourceCallbackId: sourceCallback?.id ?? null,
          },
        });
      }

      await recordAuditEvent({
        tx,
        companyId: currentUser.companyId,
        actorUserId: currentUser.id,
        action: AuditActions.CALL_COMPLETED,
        entityType: AuditEntityTypes.CALL_ACTIVITY,
        entityId: callActivity.id,
        contactId: contact.id,
        metadata: {
          outcome: input.outcome,
          idempotencyKey: input.idempotencyKey,
          sourceCallbackId: sourceCallback?.id ?? null,
          orderId: orderResult?.orderId ?? null,
          orderTotal: orderResult?.total ?? null,
        },
      });

      await recordCallWorkflowActivities({
        tx,
        currentUser,
        contact,
        callActivityId: callActivity.id,
        outcome: input.outcome,
        note: input.note,
        correlationId: input.idempotencyKey,
        contactStatus,
        orderResult,
      });

      const failCount = await countFailOutcomesForContactInTransaction(tx, {
        companyId: currentUser.companyId,
        contactId: contact.id,
      });

      return {
        callActivityId: callActivity.id,
        outcome: input.outcome,
        contactStatus,
        callbackId: createdCallback?.id,
        orderId: orderResult?.orderId,
        orderTotal: orderResult?.total,
        orderItemCount: orderResult?.itemCount,
        failCount,
        contactBecameLost,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const result = await buildIdempotentResult(currentUser, input);

      if (result) {
        return result;
      }
    }

    throw error;
  }
}
