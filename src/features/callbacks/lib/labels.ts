import type { CallbackStatus } from "@/src/generated/prisma/client";

import type { CallbackAgendaBucket } from "../types";

const agendaBucketLabels: Record<CallbackAgendaBucket, string> = {
  today: "Dnes",
  tomorrow: "Zítra",
  later: "Později",
};

const statusFilterLabels: Record<"OPEN" | "DONE" | "CANCELLED", string> = {
  OPEN: "Otevřené",
  DONE: "Vyřízené",
  CANCELLED: "Zrušené",
};

const callbackStatusLabels: Record<CallbackStatus, string> = {
  OPEN: "Otevřený",
  DONE: "Vyřízený",
  CANCELLED: "Zrušený",
  MISSED: "Zmeškaný",
};

export function formatAgendaBucketLabel(bucket: CallbackAgendaBucket): string {
  return agendaBucketLabels[bucket];
}

export function formatStatusFilterLabel(
  status: "OPEN" | "DONE" | "CANCELLED",
): string {
  return statusFilterLabels[status];
}

export function formatCallbackStatusLabel(status: CallbackStatus): string {
  return callbackStatusLabels[status];
}

export function formatCallbackDateTime(value: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function contactCallbackHref(contactId: string, callbackId: string): string {
  return `/contacts/${contactId}?callback=${callbackId}`;
}
