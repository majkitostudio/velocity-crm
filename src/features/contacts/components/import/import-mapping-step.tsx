"use client";

import type { ContactFieldCatalogEntry } from "../../lib/contact-fields";
import { isCompleteImportColumnMapping } from "../../lib/contact-fields";
import type { ContactFieldKey } from "../../lib/contact-fields";
import type { ImportColumnMapping } from "../../lib/import-types";

type ImportMappingStepProps = {
  fields: readonly ContactFieldCatalogEntry[];
  headers: string[];
  mapping: ImportColumnMapping;
  totalRows: number;
  isLoading: boolean;
  onMappingChange: (key: ContactFieldKey, column: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function ImportMappingStep({
  fields,
  headers,
  mapping,
  totalRows,
  isLoading,
  onMappingChange,
  onBack,
  onContinue,
}: ImportMappingStepProps) {
  const canContinue = isCompleteImportColumnMapping(mapping);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Mapování sloupců</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Přiřaďte sloupce CSV polím CRM. Volitelný sloupec Tagy podporuje více hodnot oddělených
          čárkou nebo středníkem. Nalezeno {totalRows.toLocaleString("cs-CZ")} řádků.
        </p>
      </div>

      <div className="space-y-3" data-testid="import-mapping-form">
        {fields.map((field) => (
          <label key={field.key} className="grid gap-1.5 sm:grid-cols-[12rem_1fr] sm:items-center">
            <span className="text-sm font-medium text-zinc-700">
              {field.label}
              {field.requiredOnImport ? " *" : ""}
            </span>
            <select
              value={mapping[field.key] ?? ""}
              disabled={isLoading}
              onChange={(event) => onMappingChange(field.key, event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
              data-testid={`import-mapping-${field.key}`}
            >
              <option value="">— neimportovat —</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {!canContinue ? (
        <p className="text-sm text-amber-700">Mapování jména a telefonu je povinné.</p>
      ) : null}

      <div className="flex justify-between gap-2 pt-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={onBack}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
        >
          Zpět
        </button>
        <button
          type="button"
          disabled={!canContinue || isLoading}
          onClick={onContinue}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
          data-testid="import-mapping-continue-button"
        >
          {isLoading ? "Validuji…" : "Pokračovat na preview"}
        </button>
      </div>
    </div>
  );
}
