import type { ContactPriority, ContactSource } from "@/src/generated/prisma/client";

const priorityLabels: Record<ContactPriority, string> = {
  HIGH: "Vysoká",
  NORMAL: "Normální",
  LOW: "Nízká",
};

const sourceLabels: Record<ContactSource, string> = {
  CSV: "CSV import",
  MANUAL: "Ruční",
  API: "API",
  OTHER: "Jiné",
};

export function formatPriority(priority: ContactPriority): string {
  return priorityLabels[priority];
}

export function formatSource(source: ContactSource): string {
  return sourceLabels[source];
}

export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatContactChannel(input: {
  phone: string | null;
  email: string | null;
}): string {
  if (input.phone) {
    return input.phone;
  }

  if (input.email) {
    return input.email;
  }

  return "Bez telefonu nebo e-mailu";
}
