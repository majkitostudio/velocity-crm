import type {
  ContactPriority,
  ContactStatus,
  ImportBatchStatus,
} from "@/src/generated/prisma/client";

import type { ContactFieldKey } from "./contact-fields";

export type ImportColumnMapping = Partial<Record<ContactFieldKey, string>>;

export type RawImportRow = {
  rowNumber: number;
  cells: Record<string, string>;
};

export type MappedContactDraft = {
  rowNumber: number;
  name?: string;
  phone?: string;
  email?: string;
  priority?: string;
  status?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
};

export type NormalizedContactDraft = {
  rowNumber: number;
  name: string;
  phone: string;
  email: string | null;
  priority: ContactPriority;
  status: ContactStatus;
  street: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
};

export type PreviewRowStatus = "ready" | "skip" | "error";

export type PreviewRow = {
  rowNumber: number;
  status: PreviewRowStatus;
  reason?:
    | "duplicate_phone"
    | "duplicate_email"
    | "duplicate_in_file"
    | "validation_error";
  message?: string;
  preview: {
    name: string;
    phone: string | null;
    email: string | null;
  };
};

export type ImportPreviewStats = {
  total: number;
  ready: number;
  skipped: number;
  failed: number;
  skipReasons: {
    duplicate_phone: number;
    duplicate_email: number;
    duplicate_in_file: number;
    validation: number;
  };
};

export type ImportPreviewResult = {
  stats: ImportPreviewStats;
  rows: PreviewRow[];
};

export type ImportPreviewSections = {
  ready: PreviewRow[];
  skip: PreviewRow[];
  error: PreviewRow[];
};

export type ImportBatchStats = {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  createdContactIds: string[];
  skipReasons: ImportPreviewStats["skipReasons"];
  assignedUserId?: string | null;
  assignedUserName?: string | null;
};

export type ParseImportResult = {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
  suggestedMapping: ImportColumnMapping;
};

export type ExecuteImportResult = {
  batchId: string;
  stats: ImportBatchStats;
  fileName: string | null;
  importedAt: string;
  assignedUserName: string | null;
  status: ImportBatchStatus;
};

export type ImportSourceType = "CSV";

export type ImportParseInput = {
  content: string;
  fileName?: string;
};
