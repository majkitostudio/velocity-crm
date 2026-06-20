import { CallbackStatus } from "@/src/generated/prisma/client";
import { ValidationError } from "@/src/domain/errors";

export type CallbackTransition = "reschedule" | "cancel";

const transitions: Record<
  CallbackStatus,
  Partial<Record<CallbackTransition, CallbackStatus>>
> = {
  OPEN: {
    reschedule: CallbackStatus.OPEN,
    cancel: CallbackStatus.CANCELLED,
  },
  DONE: {},
  CANCELLED: {},
  MISSED: {},
};

export function resolveCallbackTransition(
  currentStatus: CallbackStatus,
  transition: CallbackTransition,
): CallbackStatus {
  const nextStatus = transitions[currentStatus]?.[transition];

  if (!nextStatus) {
    throw new ValidationError(
      `Callback ve stavu ${currentStatus} nelze přejít akcí ${transition}.`,
    );
  }

  return nextStatus;
}
