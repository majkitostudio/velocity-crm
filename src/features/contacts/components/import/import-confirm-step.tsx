"use client";

import type { ContactListAssigneeOption } from "../../types";
import type { ImportPreviewResult } from "../../lib/import-types";

type ImportConfirmStepProps = {
  preview: ImportPreviewResult;
  assignableOperators: ContactListAssigneeOption[];
  assignedUserId: string;
  confirmChecked: boolean;
  isLoading: boolean;
  onAssignedUserIdChange: (value: string) => void;
  onConfirmCheckedChange: (value: boolean) => void;
  onBack: () => void;
  onExecute: () => void;
};

export function ImportConfirmStep({
  preview,
  assignableOperators,
  assignedUserId,
  confirmChecked,
  isLoading,
  onAssignedUserIdChange,
  onConfirmCheckedChange,
  onBack,
  onExecute,
}: ImportConfirmStepProps) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Potvrzení importu</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Importuje se {preview.stats.ready.toLocaleString("cs-CZ")} kontaktů. Duplicitní řádky
          zůstanou přeskočené.
        </p>
      </div>

      <dl className="grid gap-2 rounded-lg bg-zinc-50 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-zinc-600">Připraveno</dt>
          <dd className="font-semibold text-zinc-900">{preview.stats.ready}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Přeskočeno</dt>
          <dd className="font-semibold text-zinc-900">{preview.stats.skipped}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Chyby</dt>
          <dd className="font-semibold text-zinc-900">{preview.stats.failed}</dd>
        </div>
      </dl>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700">Operátor pro celý import</span>
        <select
          value={assignedUserId}
          disabled={isLoading}
          onChange={(event) => onAssignedUserIdChange(event.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2 disabled:opacity-60"
          data-testid="import-assignee-select"
        >
          <option value="">Nepřiřazeno</option>
          {assignableOperators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.name ?? operator.email}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={confirmChecked}
          disabled={isLoading}
          onChange={(event) => onConfirmCheckedChange(event.target.checked)}
          className="mt-0.5"
          data-testid="import-confirm-checkbox"
        />
        <span>Rozumím, duplicitní kontakty budou přeskočeny.</span>
      </label>

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
          disabled={!confirmChecked || preview.stats.ready === 0 || isLoading}
          onClick={onExecute}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
          data-testid="import-execute-button"
        >
          {isLoading
            ? "Importuji…"
            : `Importovat ${preview.stats.ready.toLocaleString("cs-CZ")} kontaktů`}
        </button>
      </div>
    </div>
  );
}
