import Link from "next/link";

import { ACTIVITY_FILTER_OPTIONS } from "../lib/activity-kinds";
import { buildContactDetailActivityHref } from "../lib/activity-timeline-navigation";
import { ACTIVITY_PERIOD_OPTIONS } from "../lib/activity-timeline-schemas";
import type { ContactActivityTimelineView } from "../types/activity-timeline";

type ContactActivityFiltersProps = {
  contactId: string;
  returnTo: string;
  timeline: ContactActivityTimelineView;
};

export function ContactActivityFilters({
  contactId,
  returnTo,
  timeline,
}: ContactActivityFiltersProps) {
  return (
    <div className="space-y-3" data-testid="activity-filters">
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_FILTER_OPTIONS.map((option) => {
          const isActive = timeline.filter === option.token;

          return (
            <Link
              key={option.token}
              href={buildContactDetailActivityHref({
                contactId,
                returnTo,
                activity: option.token,
                activityPeriod: timeline.period,
              })}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
              data-testid={`activity-filter-${option.token}`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-600">Období:</span>
        {ACTIVITY_PERIOD_OPTIONS.map((option) => {
          const isActive = timeline.period === option.token;

          return (
            <Link
              key={option.token}
              href={buildContactDetailActivityHref({
                contactId,
                returnTo,
                activity: timeline.filter,
                activityPeriod: option.token,
              })}
              className={`rounded-full px-3 py-1 text-sm transition ${
                isActive
                  ? "border border-zinc-900 text-zinc-900"
                  : "border border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
              data-testid={`activity-period-${option.token}`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
