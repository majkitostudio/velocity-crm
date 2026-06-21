import "server-only";

import { ValidationError } from "@/src/domain/errors";
import { requireCurrentUser } from "@/src/server/auth/guards";

import {
  listActivityKindsForFilter,
  type ActivityFilterGroup,
} from "../lib/activity-kinds";
import {
  ACTIVITY_TIMELINE_PAGE_SIZE,
  contactActivityTimelineQuerySchema,
  encodeActivityTimelineCursor,
  resolveActivityOccurredAtFrom,
  type ActivityPeriodFilter,
  type ActivityTimelineCursor,
} from "../lib/activity-timeline-schemas";
import type { ContactActivityTimelineView } from "../types/activity-timeline";
import { projectContactActivityRows } from "../view/project-activity-timeline";
import { assertContactAccess } from "./contacts.service";
import { listContactActivitiesForTimeline } from "./contact-activity.read.repository";

export type GetContactActivityTimelineInput = {
  contactId: string;
  activity?: ActivityFilterGroup;
  activityPeriod?: ActivityPeriodFilter;
  activityCursor?: ActivityTimelineCursor | null;
};

function parseTimelineQuery(
  raw: Record<string, string | string[] | undefined>,
): GetContactActivityTimelineInput {
  const activity = Array.isArray(raw.activity) ? raw.activity[0] : raw.activity;
  const activityPeriod = Array.isArray(raw.activityPeriod)
    ? raw.activityPeriod[0]
    : raw.activityPeriod;
  const activityCursor = Array.isArray(raw.activityCursor)
    ? raw.activityCursor[0]
    : raw.activityCursor;

  const parsed = contactActivityTimelineQuerySchema.safeParse({
    activity,
    activityPeriod,
    activityCursor,
  });

  if (!parsed.success) {
    throw new ValidationError("Neplatné parametry timeline.");
  }

  return {
    contactId: "",
    activity: parsed.data.activity,
    activityPeriod: parsed.data.activityPeriod,
    activityCursor: parsed.data.activityCursor,
  };
}

export async function getContactActivityTimeline(
  input: GetContactActivityTimelineInput,
): Promise<ContactActivityTimelineView> {
  const currentUser = await requireCurrentUser();

  await assertContactAccess({
    currentUser,
    contactId: input.contactId,
  });

  const filter = input.activity ?? "all";
  const period = input.activityPeriod ?? "all";
  const kinds = listActivityKindsForFilter(filter);
  const occurredAtFrom = resolveActivityOccurredAtFrom(period);

  const rows = await listContactActivitiesForTimeline({
    companyId: currentUser.companyId,
    contactId: input.contactId,
    kinds: filter === "all" ? undefined : kinds,
    occurredAtFrom,
    cursor: input.activityCursor,
    limit: ACTIVITY_TIMELINE_PAGE_SIZE + 1,
  });

  const hasMore = rows.length > ACTIVITY_TIMELINE_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, ACTIVITY_TIMELINE_PAGE_SIZE) : rows;
  const items = projectContactActivityRows(pageRows);
  const lastItem = pageRows.at(-1);

  return {
    items,
    hasMore,
    nextCursor:
      hasMore && lastItem
        ? encodeActivityTimelineCursor({
            occurredAt: lastItem.occurredAt,
            id: lastItem.id,
          })
        : null,
    filter,
    period,
  };
}

export async function getContactActivityTimelineFromSearchParams(input: {
  contactId: string;
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<ContactActivityTimelineView> {
  const parsed = parseTimelineQuery(input.searchParams);

  return getContactActivityTimeline({
    contactId: input.contactId,
    activity: parsed.activity,
    activityPeriod: parsed.activityPeriod,
    activityCursor: parsed.activityCursor,
  });
}
