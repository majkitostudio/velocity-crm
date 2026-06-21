import type { CallOutcome, ContactStatus } from "@/src/generated/prisma/client";
import type { ContactCreationSourceValue } from "@/src/domain/activity";
import type { ContactActivityPayloadByKind } from "./activity-payloads";
import { truncateForActivityPreview } from "./activity-payloads";
import { formatCallOutcome, formatContactStatus } from "./labels";

type ContactCreatedPayload = ContactActivityPayloadByKind["CONTACT_CREATED"];
type ContactStatusChangedPayload =
  ContactActivityPayloadByKind["CONTACT_STATUS_CHANGED"];
type ContactAssignedPayload = ContactActivityPayloadByKind["CONTACT_ASSIGNED"];
type NoteCreatedPayload = ContactActivityPayloadByKind["NOTE_CREATED"];
type CallbackCreatedPayload = ContactActivityPayloadByKind["CALLBACK_CREATED"];
type CallbackCompletedPayload = ContactActivityPayloadByKind["CALLBACK_COMPLETED"];
type CallFinishedPayload = ContactActivityPayloadByKind["CALL_FINISHED"];
type OrderCreatedPayload = ContactActivityPayloadByKind["ORDER_CREATED"];

export function buildContactCreatedPayload(input: {
  source: ContactCreationSourceValue;
  contactName: string;
  importBatchId?: string;
  fileName?: string;
  rowNumber?: number;
}): ContactCreatedPayload {
  const sourceLabel =
    input.source === "CSV"
      ? "CSV import"
      : input.source === "API"
        ? "API"
        : "ruční vytvoření";

  return {
    version: 1,
    summary: `Kontakt vytvořen — ${sourceLabel}`,
    data: {
      source: input.source,
      ...(input.importBatchId ? { importBatchId: input.importBatchId } : {}),
      ...(input.fileName ? { fileName: input.fileName } : {}),
      ...(input.rowNumber !== undefined ? { rowNumber: input.rowNumber } : {}),
    },
  };
}

export function buildContactStatusChangedPayload(input: {
  from: string;
  to: string;
}): ContactStatusChangedPayload {
  return {
    version: 1,
    summary: `Stav změněn — ${formatContactStatus(input.from as ContactStatus)} → ${formatContactStatus(input.to as ContactStatus)}`,
    data: {
      from: input.from,
      to: input.to,
    },
  };
}

export function buildContactAssignedPayload(input: {
  fromUserId?: string | null;
  fromUserName?: string | null;
  toUserId?: string | null;
  toUserName?: string | null;
}): ContactAssignedPayload {
  const toLabel = input.toUserName ?? "nepřiřazeno";
  const fromLabel = input.fromUserName ?? "nepřiřazeno";

  return {
    version: 1,
    summary:
      input.toUserId && input.fromUserId
        ? `Operátor změněn — ${fromLabel} → ${toLabel}`
        : input.toUserId
          ? `Kontakt přiřazen — ${toLabel}`
          : `Přiřazení zrušeno — ${fromLabel}`,
    data: {
      fromUserId: input.fromUserId ?? null,
      fromUserName: input.fromUserName ?? null,
      toUserId: input.toUserId ?? null,
      toUserName: input.toUserName ?? null,
    },
  };
}

export function buildNoteCreatedPayload(input: {
  body: string;
  authorName?: string | null;
}): NoteCreatedPayload {
  const preview = truncateForActivityPreview(input.body);

  return {
    version: 1,
    summary: input.authorName
      ? `Poznámka — ${input.authorName}`
      : "Poznámka přidána",
    data: {
      bodyPreview: preview,
      authorName: input.authorName ?? null,
    },
  };
}

export function buildCallbackCreatedPayload(input: {
  scheduledAt: Date;
  assigneeName?: string | null;
  note?: string | null;
}): CallbackCreatedPayload {
  const when = new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(input.scheduledAt);

  return {
    version: 1,
    summary: input.assigneeName
      ? `Callback naplánován — ${when} (${input.assigneeName})`
      : `Callback naplánován — ${when}`,
    data: {
      scheduledAt: input.scheduledAt.toISOString(),
      assigneeName: input.assigneeName ?? null,
      note: input.note ?? null,
    },
  };
}

export function buildCallbackCompletedPayload(input: {
  status: string;
  assigneeName?: string | null;
}): CallbackCompletedPayload {
  const isCancelled = input.status === "CANCELLED";

  return {
    version: 1,
    summary: isCancelled
      ? "Callback zrušen"
      : input.assigneeName
        ? `Callback dokončen — ${input.assigneeName}`
        : "Callback dokončen",
    data: {
      status: input.status,
      assigneeName: input.assigneeName ?? null,
    },
  };
}

export function buildCallFinishedPayload(input: {
  outcome: CallOutcome;
  operatorName?: string | null;
  note?: string | null;
  order?: {
    id: string;
    total: string;
    itemCount: number;
  };
}): CallFinishedPayload {
  const outcomeLabel = formatCallOutcome(input.outcome);
  let summary = input.operatorName
    ? `Hovor dokončen — ${outcomeLabel} (${input.operatorName})`
    : `Hovor dokončen — ${outcomeLabel}`;

  if (input.order) {
    summary = `Hovor dokončen — ${outcomeLabel}, objednávka ${input.order.total}`;
  }

  return {
    version: 1,
    summary,
    data: {
      outcome: input.outcome,
      operatorName: input.operatorName ?? null,
      note: input.note ? truncateForActivityPreview(input.note) : null,
      ...(input.order ? { order: input.order } : {}),
    },
  };
}

export function buildOrderCreatedPayload(input: {
  orderId: string;
  total: string;
  itemCount: number;
  operatorName?: string | null;
  status: string;
}): OrderCreatedPayload {
  return {
    version: 1,
    summary: input.operatorName
      ? `Objednávka vytvořena — ${input.total} (${input.operatorName})`
      : `Objednávka vytvořena — ${input.total}`,
    data: {
      orderId: input.orderId,
      total: input.total,
      itemCount: input.itemCount,
      operatorName: input.operatorName ?? null,
      status: input.status,
    },
  };
}
