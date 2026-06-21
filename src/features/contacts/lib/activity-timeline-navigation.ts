import type { ActivityFilterGroup } from "./activity-kinds";
import type { ActivityPeriodFilter } from "./activity-timeline-schemas";

export function buildContactDetailActivityHref(input: {
  contactId: string;
  returnTo: string;
  activity?: ActivityFilterGroup;
  activityPeriod?: ActivityPeriodFilter;
  activityCursor?: string | null;
  callback?: string | null;
  created?: boolean;
}): string {
  const params = new URLSearchParams({
    returnTo: input.returnTo,
  });

  if (input.callback) {
    params.set("callback", input.callback);
  }

  if (input.created) {
    params.set("created", "1");
  }

  if (input.activity && input.activity !== "all") {
    params.set("activity", input.activity);
  }

  if (input.activityPeriod && input.activityPeriod !== "all") {
    params.set("activityPeriod", input.activityPeriod);
  }

  if (input.activityCursor) {
    params.set("activityCursor", input.activityCursor);
  }

  return `/contacts/${input.contactId}?${params.toString()}`;
}
