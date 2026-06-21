import type { ContactActivityKindValue } from "@/src/domain/activity";

import type { ActivityFilterGroup } from "../lib/activity-kinds";
import type { ActivityPeriodFilter } from "../lib/activity-timeline-schemas";

export type ContactActivityTimelineItemView = {
  id: string;
  kind: ContactActivityKindValue;
  label: string;
  summary: string;
  occurredAt: Date;
  actorName: string | null;
  filterGroup: ActivityFilterGroup;
};

export type ContactActivityTimelineView = {
  items: ContactActivityTimelineItemView[];
  hasMore: boolean;
  nextCursor: string | null;
  filter: ActivityFilterGroup;
  period: ActivityPeriodFilter;
};
