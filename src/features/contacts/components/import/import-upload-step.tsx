"use client";

import { useRef, type DragEvent } from "react";

import { IMPORT_MAX_FILE_BYTES, IMPORT_MAX_ROWS } from "../../lib/import-limits";

type ImportUploadStepProps = {
  isLoading: boolean;
  onUpload: (file: File) => Promise<void>;
};

export function ImportUploadStep({ isLoading, onUpload }: ImportUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file || isLoading) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return;
    }

    await onUpload(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void handleFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        data-testid="import-upload-dropzone"
      >
        <p className="text-sm font-medium text-zinc-900">Přetáhněte CSV soubor sem</p>
        <p className="mt-1 text-sm text-zinc-600">nebo vyberte soubor z disku</p>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
          data-testid="import-upload-button"
        >
          {isLoading ? "Načítám…" : "Vybrat CSV"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
          data-testid="import-upload-input"
        />
      </div>

      <p className="text-sm text-zinc-600">
        UTF-8 CSV, maximálně {Math.round(IMPORT_MAX_FILE_BYTES / (1024 * 1024))} MB a{" "}
        {IMPORT_MAX_ROWS.toLocaleString("cs-CZ")} řádků.
      </p>
    </div>
  );
}
