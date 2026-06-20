import { EmptyState } from "@/src/components/ui/empty-state";

import { formatAgendaBucketLabel } from "../lib/labels";
import type { CallbackAgendaSection } from "../types";
import { CallbackListRow } from "./callback-list-row";

type CallbackAgendaGroupProps = {
  section: CallbackAgendaSection;
};

export function CallbackAgendaGroup({ section }: CallbackAgendaGroupProps) {
  if (section.items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" data-testid={`callback-agenda-${section.bucket}`}>
      <h2 className="sticky top-14 z-10 -mx-1 bg-zinc-50/95 px-1 py-1 text-sm font-semibold text-zinc-800 backdrop-blur">
        {formatAgendaBucketLabel(section.bucket)}
        <span className="ml-2 text-xs font-normal text-zinc-500">({section.items.length})</span>
      </h2>
      <div className="space-y-2">
        {section.items.map((item) => (
          <CallbackListRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

type CallbackAgendaListProps = {
  sections: CallbackAgendaSection[];
};

export function CallbackAgendaList({ sections }: CallbackAgendaListProps) {
  const hasItems = sections.some((section) => section.items.length > 0);

  if (!hasItems) {
    return (
      <EmptyState
        title="Žádné callbacky v tomto filtru"
        description="Změňte filtr nebo naplánujte callback na detailu kontaktu."
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="callback-agenda-list">
      {sections.map((section) => (
        <CallbackAgendaGroup key={section.bucket} section={section} />
      ))}
    </div>
  );
}
