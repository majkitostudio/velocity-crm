import Link from "next/link";

import { Breadcrumb } from "@/src/components/ui/breadcrumb";
import { EmptyState } from "@/src/components/ui/empty-state";

import type { ContactsPageView } from "../types";
import { ContactListRow } from "./contact-list-row";
import { ContactsFilterBar } from "./contacts-filter-bar";
import { ContactsPagination } from "./contacts-pagination";
import { CreateContactDialog } from "./create-contact-dialog";

type ContactsPageProps = {
  view: ContactsPageView;
};

export function ContactsPage({ view }: ContactsPageProps) {
  return (
    <div className="space-y-6" data-testid="contacts-page">
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Kontakty" }]} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Kontakty</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Přehled kontaktů. Kliknutím otevřete detail a zahájíte hovor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {view.canManageAssignments ? (
              <Link
                href={`/contacts/import?returnTo=${encodeURIComponent(view.returnTo)}`}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                data-testid="contacts-import-link"
              >
                Import CSV
              </Link>
            ) : null}
            <CreateContactDialog
              returnTo={view.returnTo}
              canManageAssignments={view.canManageAssignments}
              assignableOperators={view.assignableOperators}
            />
          </div>
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
