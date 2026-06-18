import type { ContactPriority, ContactSource } from "@/src/generated/prisma/client";

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

  return "No phone or email";
}
