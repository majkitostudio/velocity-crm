import { Breadcrumb } from "@/src/components/ui/breadcrumb";
import { EmptyState } from "@/src/components/ui/empty-state";

import type { ContactsPageView } from "../types";
import { ContactListRow } from "./contact-list-row";
import { ContactsFilterBar } from "./contacts-filter-bar";
import { ContactsPagination } from "./contacts-pagination";

type ContactsPageProps = {
  view: ContactsPageView;
};

export function ContactsPage({ view }: ContactsPageProps) {
  return (
    <div className="space-y-6" data-testid="contacts-page">
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Kontakty" }]} />
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Kontakty</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Přehled kontaktů. Kliknutím otevřete detail a zahájíte hovor.
          </p>
        </div>
      </div>

      <ContactsFilterBar view={view} />

      <ContactsPagination view={view} />

      {view.items.length === 0 ? (
        <EmptyState
          title="Žádné kontakty v tomto filtru"
          description="Změňte filtr nebo vyhledávání."
        />
      ) : (
        <div className="space-y-2" data-testid="contacts-list">
          {view.items.map((item) => (
            <ContactListRow key={item.id} item={item} returnTo={view.returnTo} />
          ))}
        </div>
      )}

      <ContactsPagination view={view} />
    </div>
  );
}
