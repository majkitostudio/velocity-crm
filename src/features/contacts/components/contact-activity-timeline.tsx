import Link from "next/link";

import { buildContactDetailActivityHref } from "../lib/activity-timeline-navigation";
import type { ContactActivityTimelineView } from "../types/activity-timeline";

import { ContactActivityFilters } from "./contact-activity-filters";
import { ContactActivityItemRow } from "./contact-activity-item";

type ContactActivityTimelineProps = {
  contactId: string;
  returnTo: string;
  timeline: ContactActivityTimelineView;
};

function resolveEmptyMessage(timeline: ContactActivityTimelineView): {
  title: string;
  description: string;
} {
  const hasActiveFilters =
    timeline.filter !== "all" || timeline.period !== "all";

  if (hasActiveFilters) {
    return {
      title: "Žádné události neodpovídají filtrům",
      description: "Zkuste upravit typ aktivity nebo časové období.",
    };
  }

  return {
    title: "Kontakt zatím nemá žádnou historii",
    description: "Hovory, poznámky, callbacky a další události se zobrazí zde.",
  };
}

export function ContactActivityTimeline({
  contactId,
  returnTo,
  timeline,
}: ContactActivityTimelineProps) {
  const emptyMessage = resolveEmptyMessage(timeline);

  return (
    <section className="space-y-4" data-testid="activity-feed">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Historie</h2>
        <p className="text-sm text-zinc-600">
          Chronologický přehled událostí u kontaktu.
        </p>
      </div>

      <ContactActivityFilters
        contactId={contactId}
        returnTo={returnTo}
        timeline={timeline}
      />

      {timeline.items.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-8 text-center"
          data-testid="activity-empty-state"
        >
          <p className="text-sm font-medium text-zinc-900">{emptyMessage.title}</p>
          <p className="mt-1 text-sm text-zinc-600">{emptyMessage.description}</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="activity-timeline">
          {timeline.items.map((item) => (
            <ContactActivityItemRow key={item.id} item={item} />
          ))}

          {timeline.hasMore && timeline.nextCursor ? (
            <div className="pt-2 text-center">
              <Link
                href={buildContactDetailActivityHref({
                  contactId,
                  returnTo,
                  activity: timeline.filter,
                  activityPeriod: timeline.period,
                  activityCursor: timeline.nextCursor,
                })}
                className="inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                data-testid="activity-load-more"
              >
                Načíst další
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
