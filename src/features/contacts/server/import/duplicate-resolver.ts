import type { ExistingContactLookup } from "../contacts.repository";
import type { NormalizedContactDraft, PreviewRow, PreviewRowStatus } from "./import.types";

function emptySkipReasons() {
  return {
    duplicate_phone: 0,
    duplicate_email: 0,
    duplicate_in_file: 0,
    validation: 0,
  };
}

export function resolveImportDuplicates(input: {
  normalizedRows: Array<
    | { rowNumber: number; ok: true; draft: NormalizedContactDraft }
    | { rowNumber: number; ok: false; message: string }
  >;
  existing: ExistingContactLookup;
}): PreviewRow[] {
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();
  const previewRows: PreviewRow[] = [];

  for (const row of input.normalizedRows) {
    if (!row.ok) {
      previewRows.push({
        rowNumber: row.rowNumber,
        status: "error",
        reason: "validation_error",
        message: row.message,
        preview: { name: "", phone: null, email: null },
      });
      continue;
    }

    const { draft } = row;
    const preview = {
      name: draft.name,
      phone: draft.phone,
      email: draft.email,
    };

    if (input.existing.phones.has(draft.phone)) {
      previewRows.push({
        rowNumber: draft.rowNumber,
        status: "skip",
        reason: "duplicate_phone",
        message: "Kontakt se stejným telefonem již existuje",
        preview,
      });
      continue;
    }

    if (draft.email && input.existing.emails.has(draft.email)) {
      previewRows.push({
        rowNumber: draft.rowNumber,
        status: "skip",
        reason: "duplicate_email",
        message: "Kontakt se stejným e-mailem již existuje",
        preview,
      });
      continue;
    }

    if (seenPhones.has(draft.phone)) {
      previewRows.push({
        rowNumber: draft.rowNumber,
        status: "skip",
        reason: "duplicate_in_file",
        message: "Duplicitní telefon v souboru",
        preview,
      });
      continue;
    }

    if (draft.email && seenEmails.has(draft.email)) {
      previewRows.push({
        rowNumber: draft.rowNumber,
        status: "skip",
        reason: "duplicate_in_file",
        message: "Duplicitní e-mail v souboru",
        preview,
      });
      continue;
    }

    seenPhones.add(draft.phone);
    if (draft.email) {
      seenEmails.add(draft.email);
    }

    previewRows.push({
      rowNumber: draft.rowNumber,
      status: "ready",
      preview,
    });
  }

  return previewRows;
}

export function summarizePreviewRows(rows: PreviewRow[]) {
  const skipReasons = emptySkipReasons();
  let ready = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (row.status === "ready") {
      ready += 1;
      continue;
    }

    if (row.status === "skip") {
      skipped += 1;
      if (row.reason === "duplicate_phone") skipReasons.duplicate_phone += 1;
      if (row.reason === "duplicate_email") skipReasons.duplicate_email += 1;
      if (row.reason === "duplicate_in_file") skipReasons.duplicate_in_file += 1;
      continue;
    }

    failed += 1;
    skipReasons.validation += 1;
  }

  return {
    total: rows.length,
    ready,
    skipped,
    failed,
    skipReasons,
  };
}

export function filterPreviewRowsByStatus(
  rows: PreviewRow[],
  status: PreviewRowStatus,
  limit: number,
): PreviewRow[] {
  return rows.filter((row) => row.status === status).slice(0, limit);
}

export function getReadyDrafts(input: {
  normalizedRows: Array<
    | { rowNumber: number; ok: true; draft: NormalizedContactDraft }
    | { rowNumber: number; ok: false; message: string }
  >;
  previewRows: PreviewRow[];
}): NormalizedContactDraft[] {
  const readyRowNumbers = new Set(
    input.previewRows.filter((row) => row.status === "ready").map((row) => row.rowNumber),
  );

  return input.normalizedRows
    .filter(
      (row): row is { rowNumber: number; ok: true; draft: NormalizedContactDraft } =>
        row.ok && readyRowNumbers.has(row.rowNumber),
    )
    .map((row) => row.draft);
}
