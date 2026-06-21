export type {
  ExecuteImportResult,
  ImportBatchStats,
  ImportColumnMapping,
  ImportParseInput,
  ImportPreviewResult,
  ImportPreviewSections,
  ImportPreviewStats,
  ImportSourceType,
  MappedContactDraft,
  NormalizedContactDraft,
  ParseImportResult,
  PreviewRow,
  PreviewRowStatus,
  RawImportRow,
} from "../../lib/import-types";

import type { ImportParseInput, ImportSourceType, RawImportRow } from "../../lib/import-types";

export interface ImportSourceAdapter {
  readonly sourceType: ImportSourceType;
  parse(input: ImportParseInput): {
    headers: string[];
    rows: RawImportRow[];
  };
}
