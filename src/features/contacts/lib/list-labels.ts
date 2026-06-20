import {
  ContactPriority,
  ContactSource,
  ContactStatus,
} from "@/src/generated/prisma/client";

import type { ListContactsSort } from "../schemas";

export const UNASSIGNED_OPERATOR_FILTER = "unassigned";

const statusLabels: Record<ContactStatus | "ALL", string> = {
  ALL: "Vše",
  LEAD: "Lead",
  CUSTOMER: "Zákazník",
  VIP: "VIP",
  LOST: "Ztracen",
};

const priorityLabels: Record<ContactPriority | "ALL", string> = {
  ALL: "Vše",
  HIGH: "Vysoká",
  NORMAL: "Normální",
  LOW: "Nízká",
};

const sourceLabels: Record<ContactSource | "ALL", string> = {
  ALL: "Vše",
  CSV: "CSV import",
  MANUAL: "Ruční",
  API: "API",
  OTHER: "Jiné",
};

const sortLabels: Record<ListContactsSort, string> = {
  priority_desc: "Priorita",
  created_asc: "Nejstarší",
  created_desc: "Nejnovější",
  updated_desc: "Naposledy upraveno",
};

export function formatListStatusLabel(status: ContactStatus | "ALL"): string {
  return statusLabels[status];
}

export function formatListPriorityLabel(priority: ContactPriority | "ALL"): string {
  return priorityLabels[priority];
}

export function formatListSourceLabel(source: ContactSource | "ALL"): string {
  return sourceLabels[source];
}

export function formatListSortLabel(sort: ListContactsSort): string {
  return sortLabels[sort];
}

export function formatListDateTime(value: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatListCallOutcome(outcome: string): string {
  switch (outcome) {
    case "ORDER":
      return "Objednávka";
    case "CALL_LATER":
      return "Zavolat později";
    case "SCHEDULE_CALL":
      return "Callback";
    case "FAIL":
      return "Neúspěch";
    default:
      return outcome;
  }
}

export function formatListChannel(input: {
  phone: string | null;
  email: string | null;
}): string {
  if (input.phone) {
    return input.phone;
  }

  if (input.email) {
    return input.email;
  }

  return "Bez telefonu a e-mailu";
}

export function formatListWorkflowBadge(
  badge: import("../types").ContactWorkflowBadge,
): string {
  switch (badge) {
    case "NEW":
      return "Nový";
    case "ASSIGNED":
      return "Přiřazen";
    case "IN_PROGRESS":
      return "Probíhá";
    case "CONVERTED":
      return "Konvertován";
    case "FAILED":
      return "Neúspěšný";
  }
}

export function listWorkflowBadgeClassName(
  badge: import("../types").ContactWorkflowBadge,
): string {
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

export function listPriorityClassName(priority: ContactPriority): string {
  switch (priority) {
    case "HIGH":
      return "bg-amber-100 text-amber-800";
    case "LOW":
      return "bg-zinc-100 text-zinc-600";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
}

export function listStatusClassName(status: ContactStatus): string {
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
