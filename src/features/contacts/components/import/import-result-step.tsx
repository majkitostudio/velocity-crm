"use client";

import Link from "next/link";

import type { ExecuteImportResult } from "../../server/import/import.types";

type ImportResultStepProps = {
  result: ExecuteImportResult;
  returnTo: string;
  onReset: () => void;
};

export function ImportResultStep({ result, returnTo, onReset }: ImportResultStepProps) {
  const { stats } = result;

  return (
    <div
      className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6"
      data-testid="import-result-panel"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Import dokončen</h2>
        <p className="mt-1 text-sm text-zinc-600">Souhrn posledního importu.</p>
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

      <div className="flex flex-wrap gap-2">
        <Link
          href={returnTo}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
          data-testid="import-result-back-button"
        >
          Zpět na kontakty
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          data-testid="import-result-reset-button"
        >
          Nový import
        </button>
      </div>
    </div>
  );
}
