import type { ContactActivityItem } from "../types";

import { ContactActivityItemRow } from "./contact-activity-item";

type ContactActivityTimelineProps = {
  items: ContactActivityItem[];
};

export function ContactActivityTimeline({ items }: ContactActivityTimelineProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Activity timeline</h2>
        <p className="text-sm text-zinc-600">
          Complete contact history sorted by when each event was recorded.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-8 text-center">
          <p className="text-sm font-medium text-zinc-900">No activity yet</p>
          <p className="mt-1 text-sm text-zinc-600">
            Calls, notes, callbacks, and orders will appear here as they happen.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="activity-timeline">
          {items.map((item) => (
            <ContactActivityItemRow key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
