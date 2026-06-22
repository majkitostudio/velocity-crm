import type { ContactActivityKind } from "@/src/domain/activity";
import { contactActivityPayloadSchemasV1 } from "@/src/features/contacts/lib/activity-payloads";
import type { ContactActivityAiReadRow } from "@/src/features/contacts/server/contact-activity.read.repository";

import type { ContactActivityEntry } from "../types/activity-entry";

function resolveActorName(
  actor: ContactActivityAiReadRow["actor"],
): string | null {
  if (!actor) {
    return null;
  }

  return actor.name ?? actor.email ?? null;
}

function mapActivityRow(row: ContactActivityAiReadRow): ContactActivityEntry {
  const base = {
    id: row.id,
    occurredAt: row.occurredAt,
    actorName: resolveActorName(row.actor),
    correlationId: row.correlationId,
    sourceEntity:
      row.sourceEntityType && row.sourceEntityId
        ? {
            type: row.sourceEntityType,
            id: row.sourceEntityId,
          }
        : null,
  };

  switch (row.kind) {
    case "CONTACT_CREATED": {
      const payload = contactActivityPayloadSchemasV1.CONTACT_CREATED.parse(row.payload);
      return {
        ...base,
        kind: row.kind,
        summary: payload.summary,
        payloadVersion: 1,
        data: payload.data,
      };
    }
    case "CONTACT_STATUS_CHANGED": {
      const payload = contactActivityPayloadSchemasV1.CONTACT_STATUS_CHANGED.parse(row.payload);
      return {
        ...base,
        kind: row.kind,
        summary: payload.summary,
        payloadVersion: 1,
        data: payload.data,
      };
    }
    case "CONTACT_ASSIGNED": {
      const payload = contactActivityPayloadSchemasV1.CONTACT_ASSIGNED.parse(row.payload);
      return {
        ...base,
        kind: row.kind,
        summary: payload.summary,
        payloadVersion: 1,
        data: payload.data,
      };
    }
    case "CONTACT_UPDATED": {
      const payload = contactActivityPayloadSchemasV1.CONTACT_UPDATED.parse(row.payload);
      return {
        ...base,
        kind: row.kind,
        summary: payload.summary,
        payloadVersion: 1,
        data: payload.data,
      };
    }
    case "NOTE_CREATED": {
      const payload = contactActivityPayloadSchemasV1.NOTE_CREATED.parse(row.payload);
      return {
        ...base,
        kind: row.kind,
        summary: payload.summary,
        payloadVersion: 1,
        data: payload.data,
      };
    }
    case "CALLBACK_CREATED": {
      const payload = contactActivityPayloadSchemasV1.CALLBACK_CREATED.parse(row.payload);
      return {
        ...base,
        kind: row.kind,
        summary: payload.summary,
        payloadVersion: 1,
        data: payload.data,
      };
    }
    case "CALLBACK_COMPLETED": {
      const payload = contactActivityPayloadSchemasV1.CALLBACK_COMPLETED.parse(row.payload);
      return {
        ...base,
        kind: row.kind,
        summary: payload.summary,
        payloadVersion: 1,
        data: payload.data,
      };
    }
    case "CALL_FINISHED": {
      const payload = contactActivityPayloadSchemasV1.CALL_FINISHED.parse(row.payload);
      return {
        ...base,
        kind: row.kind,
        summary: payload.summary,
        payloadVersion: 1,
        data: payload.data,
      };
    }
    case "ORDER_CREATED": {
      const payload = contactActivityPayloadSchemasV1.ORDER_CREATED.parse(row.payload);
      return {
        ...base,
        kind: row.kind,
        summary: payload.summary,
        payloadVersion: 1,
        data: payload.data,
      };
    }
    default: {
      const unsupportedKind: ContactActivityKind = row.kind;
      throw new Error(`Unsupported activity kind: ${unsupportedKind}`);
    }
  }
}

export function mapContactActivityRowsToEntries(
  rows: ContactActivityAiReadRow[],
): ContactActivityEntry[] {
  return rows.map((row) => mapActivityRow(row));
}
