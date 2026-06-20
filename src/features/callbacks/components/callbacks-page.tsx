import { EmptyState } from "@/src/components/ui/empty-state";

import type { CallbacksPageView } from "../types";
import { CallbackAgendaList } from "./callback-agenda-group";
import { CallbackListRow } from "./callback-list-row";
import { CallbacksFilterBar } from "./callbacks-filter-bar";

type CallbacksPageProps = {
  view: CallbacksPageView;
  activeView: "list" | "agenda";
};

export function CallbacksPage({ view, activeView }: CallbacksPageProps) {
  return (
    <div className="space-y-6" data-testid="callbacks-page">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Callbacky</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Přehled naplánovaných callbacků. Kliknutím otevřete detail kontaktu.
        </p>
      </div>

      <CallbacksFilterBar view={view} activeView={activeView} />

      {activeView === "agenda" ? (
        <CallbackAgendaList sections={view.agendaSections} />
      ) : view.listItems.length === 0 ? (
        <EmptyState
          title="Žádné callbacky v tomto filtru"
          description="Změňte filtr nebo naplánujte callback na detailu kontaktu."
        />
      ) : (
        <div className="space-y-2" data-testid="callback-list">
          {view.listItems.map((item) => (
            <CallbackListRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
