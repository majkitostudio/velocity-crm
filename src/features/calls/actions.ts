"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  zodFieldErrors,
} from "@/src/domain/action-result";
import { isDomainError } from "@/src/domain/errors";
import { requireCurrentUser } from "@/src/server/auth/guards";

import { completeCall } from "./server/call-workflow";
import { completeCallSchema } from "./schemas";
import type { CompleteCallResult } from "./types";

function parseOrderItemsPayload(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function parseScheduledAt(value: string): Date | null {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export async function completeCallAction(
  _prevState: ActionResult<CompleteCallResult> | null,
  formData: FormData,
): Promise<ActionResult<CompleteCallResult>> {
  const rawSourceCallbackId = formData.get("sourceCallbackId");
  const sourceCallbackId =
    typeof rawSourceCallbackId === "string" && rawSourceCallbackId.length > 0
      ? rawSourceCallbackId
      : null;

  const parsed = completeCallSchema.safeParse({
    contactId: formData.get("contactId"),
    outcome: formData.get("outcome"),
    note: formData.get("note") || null,
    orderNote: formData.get("orderNote") || null,
    orderItems: parseOrderItemsPayload(formData.get("orderItems")),
    sourceCallbackId,
    scheduledAt: formData.get("scheduledAt") || undefined,
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return actionFailure("Please fix the errors below.", zodFieldErrors(parsed.error));
  }

  const currentUser = await requireCurrentUser();

  try {
    const scheduledAt =
      parsed.data.outcome === "SCHEDULE_CALL"
        ? parseScheduledAt(parsed.data.scheduledAt)
        : null;

    if (parsed.data.outcome === "SCHEDULE_CALL" && !scheduledAt) {
      return actionFailure("Invalid date and time.", {
        scheduledAt: ["Invalid date and time"],
      });
    }

    const result = await completeCall(currentUser, {
      contactId: parsed.data.contactId,
      outcome: parsed.data.outcome,
      note: parsed.data.note,
      sourceCallbackId: parsed.data.sourceCallbackId,
      scheduledAt,
      idempotencyKey: parsed.data.idempotencyKey,
      order:
        parsed.data.outcome === "ORDER"
          ? {
              note: parsed.data.orderNote,
              items: parsed.data.orderItems,
            }
          : undefined,
    });

    revalidatePath(`/contacts/${parsed.data.contactId}`);
    revalidatePath("/dashboard");

    return actionSuccess(result);
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}
