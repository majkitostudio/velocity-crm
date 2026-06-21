"use client";

import type {
  ImportPreviewResult,
  ImportPreviewSections,
  PreviewRow,
} from "../../lib/import-types";

type ImportPreviewStepProps = {
  preview: ImportPreviewResult & { sections: ImportPreviewSections };
  isLoading: boolean;
  onBack: () => void;
  onContinue: () => void;
};

function PreviewTable({
  title,
  rows,
  total,
  tone,
  testId,
}: {
  title: string;
  rows: PreviewRow[];
  total: number;
  tone: "ready" | "skip" | "error";
  testId: string;
}) {
  const toneClasses = {
    ready: "border-emerald-200 bg-emerald-50",
    skip: "border-amber-200 bg-amber-50",
    error: "border-red-200 bg-red-50",
  } as const;

  return (
    <section
      className={`rounded-xl border p-4 ${toneClasses[tone]}`}
      data-testid={testId}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <span className="text-sm text-zinc-600">
          Zobrazeno {rows.length} z {total}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">Žádné řádky v této kategorii.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-600">
                <th className="px-2 py-1 font-medium">Řádek</th>
                <th className="px-2 py-1 font-medium">Jméno</th>
                <th className="px-2 py-1 font-medium">Telefon</th>
                <th className="px-2 py-1 font-medium">E-mail</th>
                <th className="px-2 py-1 font-medium">Poznámka</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowNumber} className="border-t border-zinc-200/70">
                  <td className="px-2 py-1">{row.rowNumber}</td>
                  <td className="px-2 py-1">{row.preview.name}</td>
                  <td className="px-2 py-1 font-mono">{row.preview.phone ?? "—"}</td>
                  <td className="px-2 py-1">{row.preview.email ?? "—"}</td>
                  <td className="px-2 py-1">{row.message ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ImportPreviewStep({
  preview,
  isLoading,
  onBack,
  onContinue,
}: ImportPreviewStepProps) {
  const { stats, sections } = preview;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Preview importu</h2>
        <p
          className="mt-1 text-sm text-zinc-600"
          data-testid="import-preview-summary"
        >
          {stats.ready.toLocaleString("cs-CZ")} připraveno ·{" "}
          {stats.skipped.toLocaleString("cs-CZ")} přeskočeno ·{" "}
          {stats.failed.toLocaleString("cs-CZ")} chyb
        </p>
      </div>

      <PreviewTable
        title="Připraveno k importu"
        rows={sections.ready}
        total={stats.ready}
        tone="ready"
        testId="import-preview-ready"
      />
      <PreviewTable
        title="Přeskočeno"
        rows={sections.skip}
        total={stats.skipped}
        tone="skip"
        testId="import-preview-skip"
      />
      <PreviewTable
        title="Chyby"
        rows={sections.error}
        total={stats.failed}
        tone="error"
        testId="import-preview-error"
      />

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
          disabled={stats.ready === 0 || isLoading}
          onClick={onContinue}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
          data-testid="import-preview-continue-button"
        >
          Pokračovat k potvrzení
        </button>
      </div>
    </div>
  );
}
