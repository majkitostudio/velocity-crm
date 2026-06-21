"use client";

import Link from "next/link";

import { buildContactsListPath } from "../../lib/list-navigation";
import type { ExecuteImportResult } from "../../lib/import-types";

type ImportResultStepProps = {
  result: ExecuteImportResult;
  returnTo: string;
  onReset: () => void;
};

function formatImportedAt(value: string): string {
  return new Date(value).toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ImportResultStep({ result, returnTo, onReset }: ImportResultStepProps) {
  const { stats } = result;
  const importedContactsHref = buildContactsListPath({ importBatch: result.batchId });
  const canViewImportedContacts = stats.created > 0;

  return (
    <div
      className="space-y-5 rounded-xl border border-emerald-200 bg-emerald-50 p-6"
      data-testid="import-result-panel"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Import dokončen</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {result.status === "FAILED"
            ? "Import se dokončil s chybou. Níže je souhrn toho, co se podařilo zpracovat."
            : "Kontakty jsou připravené k další práci v CRM."}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-white px-4 py-3">
          <dt className="text-sm text-zinc-600">Vytvořeno</dt>
          <dd className="text-2xl font-semibold text-emerald-800" data-testid="import-result-created">
            {stats.created}
          </dd>
        </div>
        <div className="rounded-lg bg-white px-4 py-3">
          <dt className="text-sm text-zinc-600">Přeskočeno</dt>
          <dd className="text-2xl font-semibold text-amber-700" data-testid="import-result-skipped">
            {stats.skipped}
          </dd>
        </div>
        <div className="rounded-lg bg-white px-4 py-3">
          <dt className="text-sm text-zinc-600">Chyby</dt>
          <dd className="text-2xl font-semibold text-red-700" data-testid="import-result-failed">
            {stats.failed}
          </dd>
        </div>
      </dl>

      <dl className="grid gap-3 rounded-lg bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-600">Soubor</dt>
          <dd className="font-medium text-zinc-900" data-testid="import-result-file-name">
            {result.fileName ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-600">Importováno</dt>
          <dd className="font-medium text-zinc-900" data-testid="import-result-imported-at">
            {formatImportedAt(result.importedAt)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-zinc-600">Operátor</dt>
          <dd className="font-medium text-zinc-900" data-testid="import-result-assignee">
            {result.assignedUserName ?? "Nepřiřazeno"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {canViewImportedContacts ? (
          <Link
            href={importedContactsHref}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
            data-testid="import-result-view-contacts-button"
          >
            Zobrazit importované kontakty
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg bg-emerald-700/50 px-3 py-2 text-sm font-medium text-white"
            data-testid="import-result-view-contacts-button"
          >
            Zobrazit importované kontakty
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          data-testid="import-result-reset-button"
        >
          Nový import
        </button>
        <Link
          href={returnTo}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          data-testid="import-result-back-button"
        >
          Zpět na kontakty
        </Link>
      </div>
    </div>
  );
}
