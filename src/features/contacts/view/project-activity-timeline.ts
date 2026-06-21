import type { ContactActivityKindValue, ContactActivityKind } from "@/src/domain/activity";

import {
  getActivityKindDefinition,
  type ActivityFilterGroup,
} from "../lib/activity-kinds";
import { isContactActivityKindValue } from "../lib/activity-timeline-schemas";
import type { ContactActivityTimelineItemView } from "../types/activity-timeline";

export type ProjectableContactActivityRow = {
  id: string;
  kind: string;
  occurredAt: Date;
  payload: unknown;
  actor: {
    name: string | null;
    email: string;
  } | null;
};

function readPayloadSummary(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "summary" in payload &&
    typeof payload.summary === "string" &&
    payload.summary.length > 0
  ) {
    return payload.summary;
  }

  return "Událost";
}

function resolveActorName(
  actor: ProjectableContactActivityRow["actor"],
): string | null {
  if (!actor) {
    return null;
  }

  return actor.name ?? actor.email ?? null;
}

export function projectContactActivityRow(
  row: ProjectableContactActivityRow,
): ContactActivityTimelineItemView {
  const kind: ContactActivityKindValue = isContactActivityKindValue(row.kind)
    ? row.kind
    : "CONTACT_UPDATED";

  const definition = getActivityKindDefinition(row.kind as ContactActivityKind);

  return {
    id: row.id,
    kind,
    label: definition.label,
    summary: readPayloadSummary(row.payload),
    occurredAt: row.occurredAt,
    actorName: resolveActorName(row.actor),
    filterGroup: definition.filterGroup as ActivityFilterGroup,
  };
}

export function projectContactActivityRows(
  rows: ProjectableContactActivityRow[],
): ContactActivityTimelineItemView[] {
  return rows.map(projectContactActivityRow);
}
