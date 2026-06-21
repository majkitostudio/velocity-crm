import Link from "next/link";

import type { ImportBatchListFilter } from "../types";

type ContactsImportBatchBannerProps = {
  filter: ImportBatchListFilter;
  total: number;
  allContactsPath: string;
};

function formatImportedAt(value: Date): string {
  return value.toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ContactsImportBatchBanner({
  filter,
  total,
  allContactsPath,
}: ContactsImportBatchBannerProps) {
  if (filter.kind === "not_found") {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        data-testid="contacts-import-batch-banner"
      >
        <p className="font-medium">Import nebyl nalezen.</p>
        <p className="mt-1 text-red-700">
          Odkaz může být neplatný nebo import patří jiné firmě.
        </p>
        <Link
          href={allContactsPath}
          className="mt-3 inline-flex rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
          data-testid="contacts-import-batch-clear-button"
        >
          Zobrazit všechny kontakty
        </Link>
      </div>
    );
  }

  const fileLabel = filter.fileName ?? "CSV import";

  return (
    <div
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
      data-testid="contacts-import-batch-banner"
    >
      <p className="font-medium" data-testid="contacts-import-batch-banner-title">
        Zobrazeny kontakty z importu „{fileLabel}“
      </p>
      <p className="mt-1 text-emerald-900" data-testid="contacts-import-batch-banner-meta">
        {formatImportedAt(filter.importedAt)} · vytvořeno {filter.createdCount} · zobrazeno{" "}
        {total}
      </p>
      <Link
        href={allContactsPath}
        className="mt-3 inline-flex rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-900 transition-colors hover:bg-emerald-100"
        data-testid="contacts-import-batch-clear-button"
      >
        Zobrazit všechny kontakty
      </Link>
    </div>
  );
}
