import {
  activityFilterGroupAccentClass,
  activityFilterGroupIcon,
  activityKindTestId,
} from "../lib/activity-timeline-display";
import { formatDateTime } from "../lib/labels";
import type { ContactActivityTimelineItemView } from "../types/activity-timeline";

type ContactActivityItemRowProps = {
  item: ContactActivityTimelineItemView;
};

export function ContactActivityItemRow({ item }: ContactActivityItemRowProps) {
  return (
    <article
      className={`flex gap-3 rounded-xl border border-zinc-200 border-l-4 bg-white px-4 py-3 ${activityFilterGroupAccentClass(item.filterGroup)}`}
      data-testid={activityKindTestId(item.kind)}
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600"
        aria-hidden
      >
        {activityFilterGroupIcon(item.filterGroup)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">{item.label}</h3>
          <time className="text-xs text-zinc-500" dateTime={item.occurredAt.toISOString()}>
            {formatDateTime(item.occurredAt)}
          </time>
        </div>

        <p className="mt-1 text-sm text-zinc-600" data-testid="activity-item-summary">
          {item.summary}
        </p>

        {item.actorName ? (
          <p className="mt-1 text-xs text-zinc-500" data-testid="activity-item-actor">
            {item.actorName}
          </p>
        ) : null}
      </div>
    </article>
  );
}
