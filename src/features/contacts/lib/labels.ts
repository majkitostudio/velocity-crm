import type {
  CallbackStatus,
  CallOutcome,
  ContactPriority,
  ContactSource,
  ContactStatus,
  OrderStatus,
} from "@/src/generated/prisma/client";

import type { ContactWorkflowBadge } from "../types";
import { formatWorkflowBadgeLabel } from "../view/build-workflow-badge";

export { formatWorkflowBadgeLabel };

const statusLabels: Record<ContactStatus, string> = {
  LEAD: "Lead",
  CUSTOMER: "Customer",
  VIP: "VIP",
  LOST: "Lost",
};

const priorityLabels: Record<ContactPriority, string> = {
  HIGH: "High",
  NORMAL: "Normal",
  LOW: "Low",
};

const sourceLabels: Record<ContactSource, string> = {
  CSV: "CSV import",
  MANUAL: "Manual",
  API: "API",
  OTHER: "Other",
};

const callOutcomeLabels: Record<CallOutcome, string> = {
  ORDER: "Order placed",
  CALL_LATER: "Call later",
  SCHEDULE_CALL: "Scheduled call",
  FAIL: "Fail",
};

const callbackStatusLabels: Record<CallbackStatus, string> = {
  OPEN: "Open",
  DONE: "Done",
  CANCELLED: "Cancelled",
  MISSED: "Missed",
};

const orderStatusLabels: Record<OrderStatus, string> = {
  CREATED: "Created",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function formatContactStatus(status: ContactStatus): string {
  return statusLabels[status];
}

export function formatPriority(priority: ContactPriority): string {
  return priorityLabels[priority];
}

export function formatSource(source: ContactSource): string {
  return sourceLabels[source];
}

export function formatCallOutcome(outcome: CallOutcome): string {
  return callOutcomeLabels[outcome];
}

export function formatCallbackStatus(status: CallbackStatus): string {
  return callbackStatusLabels[status];
}

export function formatOrderStatus(status: OrderStatus): string {
  return orderStatusLabels[status];
}

export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatAssigneeName(input: {
  name: string | null;
  email: string;
}): string {
  return input.name ?? input.email;
}

export function workflowBadgeClassName(badge: ContactWorkflowBadge): string {
  switch (badge) {
    case "NEW":
      return "bg-violet-100 text-violet-800";
    case "ASSIGNED":
      return "bg-sky-100 text-sky-800";
    case "IN_PROGRESS":
      return "bg-emerald-100 text-emerald-800";
    case "CONVERTED":
      return "bg-teal-100 text-teal-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
  }
}

export function contactStatusClassName(status: ContactStatus): string {
  switch (status) {
    case "LOST":
      return "bg-red-100 text-red-800";
    case "CUSTOMER":
    case "VIP":
      return "bg-teal-100 text-teal-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export function activityKindLabel(
  kind: "CALL" | "NOTE" | "CALLBACK" | "ORDER",
): string {
  switch (kind) {
    case "CALL":
      return "Call";
    case "NOTE":
      return "Note";
    case "CALLBACK":
      return "Callback";
    case "ORDER":
      return "Order";
  }
}
