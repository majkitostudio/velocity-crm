"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  zodFieldErrors,
} from "@/src/domain/action-result";
import { isDomainError } from "@/src/domain/errors";

import {
  cancelCallback,
  createCallback,
  rescheduleCallback,
} from "./server/callbacks.service";
import {
  cancelCallbackSchema,
  createCallbackSchema,
  rescheduleCallbackSchema,
} from "./schemas";

function parseScheduledAt(value: string): Date | null {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function revalidateCallbackPaths(input: {
  contactId?: string;
  callbackId?: string;
}) {
  revalidatePath("/dashboard");
  revalidatePath("/callbacks");

  if (input.contactId) {
    revalidatePath(`/contacts/${input.contactId}`);
  }

  if (input.callbackId && input.contactId) {
    revalidatePath(`/contacts/${input.contactId}?callback=${input.callbackId}`);
  }
}

export async function createCallbackAction(
  _prevState: ActionResult<{ callbackId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ callbackId: string }>> {
  const parsed = createCallbackSchema.safeParse({
    contactId: formData.get("contactId"),
    scheduledAt: formData.get("scheduledAt"),
    note: formData.get("note") || null,
    assignedUserId: formData.get("assignedUserId") || null,
  });

  if (!parsed.success) {
    return actionFailure("Opravte chyby ve formuláři.", zodFieldErrors(parsed.error));
  }

  const scheduledAt = parseScheduledAt(parsed.data.scheduledAt);

  if (!scheduledAt) {
    return actionFailure("Neplatné datum a čas.", {
      scheduledAt: ["Neplatné datum a čas."],
    });
  }

  try {
    const callback = await createCallback({
      contactId: parsed.data.contactId,
      scheduledAt,
      note: parsed.data.note,
      assignedUserId: parsed.data.assignedUserId,
    });

    revalidateCallbackPaths({
      contactId: parsed.data.contactId,
      callbackId: callback.id,
    });

    return actionSuccess({ callbackId: callback.id });
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}

export async function rescheduleCallbackAction(
  _prevState: ActionResult<{ callbackId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ callbackId: string }>> {
  const parsed = rescheduleCallbackSchema.safeParse({
    callbackId: formData.get("callbackId"),
    scheduledAt: formData.get("scheduledAt"),
    note: formData.get("note") || null,
  });

  if (!parsed.success) {
    return actionFailure("Opravte chyby ve formuláři.", zodFieldErrors(parsed.error));
  }

  const scheduledAt = parseScheduledAt(parsed.data.scheduledAt);

  if (!scheduledAt) {
    return actionFailure("Neplatné datum a čas.", {
      scheduledAt: ["Neplatné datum a čas."],
    });
  }

  try {
    const callback = await rescheduleCallback({
      callbackId: parsed.data.callbackId,
      scheduledAt,
      note: parsed.data.note,
    });

    revalidateCallbackPaths({
      contactId: callback.contactId,
      callbackId: callback.id,
    });

    return actionSuccess({ callbackId: callback.id });
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}

export async function cancelCallbackAction(
  _prevState: ActionResult<{ callbackId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ callbackId: string }>> {
  const parsed = cancelCallbackSchema.safeParse({
    callbackId: formData.get("callbackId"),
    reason: formData.get("reason") || null,
  });

  if (!parsed.success) {
    return actionFailure("Opravte chyby ve formuláři.", zodFieldErrors(parsed.error));
  }

  try {
    const callback = await cancelCallback({
      callbackId: parsed.data.callbackId,
      reason: parsed.data.reason,
    });

    revalidateCallbackPaths({
      contactId: callback.contactId,
      callbackId: callback.id,
    });

    return actionSuccess({ callbackId: callback.id });
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}
