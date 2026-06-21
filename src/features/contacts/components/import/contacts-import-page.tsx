import { Breadcrumb } from "@/src/components/ui/breadcrumb";

import { ImportWizard } from "./import-wizard";
import type { ImportPageView } from "../../types";

type ContactsImportPageProps = {
  view: ImportPageView;
};

export function ContactsImportPage({ view }: ContactsImportPageProps) {
  return (
    <div className="space-y-6" data-testid="contacts-import-page">
      <div className="space-y-2">
        <Breadcrumb
          items={[
            { label: "Kontakty", href: view.returnTo },
            { label: "Import CSV" },
          ]}
        />
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Import CSV</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Nahrajte soubor, namapujte sloupce a importujte nové kontakty. Duplicity budou
            přeskočeny.
          </p>
        </div>
      </div>

      <ImportWizard view={view} />
    </div>
  );
}
