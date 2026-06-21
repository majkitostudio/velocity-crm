import "server-only";

import type { CallOutcome, CallbackStatus, Contact, Prisma } from "@/src/generated/prisma/client";
import {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/domain/activity";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import type { CurrentUser } from "@/src/server/auth/guards";

import {
  buildCallFinishedPayload,
  buildCallbackCompletedPayload,
  buildCallbackCreatedPayload,
  buildContactStatusChangedPayload,
} from "@/src/features/contacts/lib/activity-payload-builders";
import { recordContactBusinessEvent } from "@/src/features/contacts/server/record-contact-business-event";
import type { OrderCreatedResult } from "@/src/features/orders/types";

type TransactionClient = Prisma.TransactionClient;

type RecordCallWorkflowActivitiesInput = {
  tx: TransactionClient;
  currentUser: CurrentUser;
  contact: Contact;
  callActivityId: string;
  outcome: CallOutcome;
  note?: string | null;
  correlationId: string;
  contactStatus: Contact["status"];
  orderResult?: OrderCreatedResult | null;
};

function actorDisplayName(currentUser: CurrentUser): string | null {
  return currentUser.name ?? currentUser.email ?? null;
}

export async function recordCallWorkflowActivities(
  input: RecordCallWorkflowActivitiesInput,
): Promise<void> {
  const statusChanged =
    input.contactStatus !== input.contact.status &&
    (input.contactStatus === "CUSTOMER" || input.contactStatus === "LOST");

  if (statusChanged) {
    await recordContactBusinessEvent({
      tx: input.tx,
      companyId: input.currentUser.companyId,
      contactId: input.contact.id,
      actorUserId: input.currentUser.id,
      correlationId: input.correlationId,
      occurredAt: new Date(),
      activity: {
        kind: ContactActivityKind.CONTACT_STATUS_CHANGED,
        payload: buildContactStatusChangedPayload({
          from: input.contact.status,
          to: input.contactStatus,
        }),
        sourceEntity: {
          type: ActivitySourceEntity.CONTACT,
          id: input.contact.id,
        },
      },
      audit: {
        action: AuditActions.CONTACT_STATUS_CHANGED,
        entityType: AuditEntityTypes.CONTACT,
        entityId: input.contact.id,
        metadata: {
          from: input.contact.status,
          to: input.contactStatus,
          reason:
            input.contactStatus === "LOST" ? "fail_threshold" : "order_created",
        },
      },
    });
  }

  await recordContactBusinessEvent({
    tx: input.tx,
    companyId: input.currentUser.companyId,
    contactId: input.contact.id,
    actorUserId: input.currentUser.id,
    correlationId: input.correlationId,
    occurredAt: new Date(),
    activity: {
      kind: ContactActivityKind.CALL_FINISHED,
      payload: buildCallFinishedPayload({
        outcome: input.outcome,
        operatorName: actorDisplayName(input.currentUser),
        note: input.note ?? null,
        order: input.orderResult
          ? {
              id: input.orderResult.orderId,
              total: input.orderResult.total,
              itemCount: input.orderResult.itemCount,
            }
          : undefined,
      }),
      sourceEntity: {
        type: ActivitySourceEntity.CALL,
        id: input.callActivityId,
      },
    },
  });
}

type CallWorkflowCallback = {
  id: string;
  scheduledAt: Date;
  note: string | null;
};

export async function recordCallWorkflowCallbackCreated(
  input: {
    tx: TransactionClient;
    currentUser: CurrentUser;
    contactId: string;
    callback: CallWorkflowCallback;
    correlationId: string;
  },
): Promise<void> {
  await recordContactBusinessEvent({
    tx: input.tx,
    companyId: input.currentUser.companyId,
    contactId: input.contactId,
    actorUserId: input.currentUser.id,
    correlationId: input.correlationId,
    occurredAt: new Date(),
    activity: {
      kind: ContactActivityKind.CALLBACK_CREATED,
      payload: buildCallbackCreatedPayload({
        scheduledAt: input.callback.scheduledAt,
        assigneeName: actorDisplayName(input.currentUser),
        note: input.callback.note,
      }),
      sourceEntity: {
        type: ActivitySourceEntity.CALLBACK,
        id: input.callback.id,
      },
    },
  });
}

export async function recordCallWorkflowCallbackCompleted(
  input: {
    tx: TransactionClient;
    currentUser: CurrentUser;
    contactId: string;
    callbackId: string;
    status: CallbackStatus;
    correlationId: string;
  },
): Promise<void> {
  await recordContactBusinessEvent({
    tx: input.tx,
    companyId: input.currentUser.companyId,
    contactId: input.contactId,
    actorUserId: input.currentUser.id,
    correlationId: input.correlationId,
    occurredAt: new Date(),
    activity: {
      kind: ContactActivityKind.CALLBACK_COMPLETED,
      payload: buildCallbackCompletedPayload({
        status: input.status,
        assigneeName: actorDisplayName(input.currentUser),
      }),
      sourceEntity: {
        type: ActivitySourceEntity.CALLBACK,
        id: input.callbackId,
      },
    },
  });
}
