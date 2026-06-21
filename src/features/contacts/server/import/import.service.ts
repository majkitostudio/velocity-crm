import "server-only";

import { redirect } from "next/navigation";

import { ImportBatchStatus } from "@/src/generated/prisma/client";
import { ForbiddenError, ValidationError } from "@/src/domain/errors";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import { findAssignableOperatorsForCompany } from "@/src/features/callbacks/server/callbacks.repository";
import {
  canManageCompanyData,
  requireCurrentUser,
  type CurrentUser,
} from "@/src/server/auth/guards";

import {
  isCompleteImportColumnMapping,
  listImportMappableContactFields,
  suggestImportColumnMapping,
} from "../../lib/contact-fields";
import { buildContactsListPath } from "../../lib/list-navigation";
import type { ImportPageView } from "../../types";
import { findExistingContactsByPhonesAndEmails } from "../contacts.repository";
import { recordAuditEvent } from "@/src/server/audit";
import { mapRowsToDrafts } from "./column-mapper";
import { normalizeContactDrafts } from "./contact-normalizer";
import { csvImportAdapter } from "./csv-import.adapter";
import {
  filterPreviewRowsByStatus,
  getReadyDrafts,
  resolveImportDuplicates,
  summarizePreviewRows,
} from "./duplicate-resolver";
import {
  IMPORT_INSERT_CHUNK_SIZE,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_ROWS,
  IMPORT_PREVIEW_ROWS,
} from "./import.constants";
import {
  createImportBatchRecord,
  createImportedContactsChunk,
  updateImportBatchRecord,
} from "./import.repository";
import type {
  ExecuteImportResult,
  ImportColumnMapping,
  ImportPreviewResult,
  ImportPreviewSections,
  ParseImportResult,
} from "./import.types";

function assertCanImport(role: CurrentUser["role"]): void {
  if (!canManageCompanyData(role)) {
    throw new ForbiddenError();
  }
}

function enforceImportLimits(content: string, rowCount: number): void {
  const byteLength = Buffer.byteLength(content, "utf8");

  if (byteLength > IMPORT_MAX_FILE_BYTES) {
    throw new ValidationError("Soubor je příliš velký. Maximum je 5 MB.");
  }

  if (rowCount > IMPORT_MAX_ROWS) {
    throw new ValidationError("Soubor obsahuje příliš mnoho řádků. Maximum je 5 000.");
  }
}

function buildPreviewSections(rows: ImportPreviewResult["rows"]): ImportPreviewSections {
  return {
    ready: filterPreviewRowsByStatus(rows, "ready", IMPORT_PREVIEW_ROWS),
    skip: filterPreviewRowsByStatus(rows, "skip", IMPORT_PREVIEW_ROWS),
    error: filterPreviewRowsByStatus(rows, "error", IMPORT_PREVIEW_ROWS),
  };
}

async function buildImportPreview(input: {
  companyId: string;
  content: string;
  mapping: ImportColumnMapping;
}): Promise<ImportPreviewResult> {
  const parsed = csvImportAdapter.parse({ content: input.content });
  enforceImportLimits(input.content, parsed.rows.length);

  if (!isCompleteImportColumnMapping(input.mapping)) {
    throw new ValidationError("Mapování jména a telefonu je povinné.");
  }

  const drafts = mapRowsToDrafts({ rows: parsed.rows, mapping: input.mapping });
  const normalizedRows = normalizeContactDrafts(drafts);

  const phones: string[] = [];
  const emails: string[] = [];

  for (const row of normalizedRows) {
    if (!row.ok) {
      continue;
    }

    phones.push(row.draft.phone);

    if (row.draft.email) {
      emails.push(row.draft.email);
    }
  }

  const existing = await findExistingContactsByPhonesAndEmails({
    companyId: input.companyId,
    phones,
    emails,
  });

  const previewRows = resolveImportDuplicates({ normalizedRows, existing });

  return {
    stats: summarizePreviewRows(previewRows),
    rows: previewRows,
  };
}

async function resolveImportAssignee(input: {
  currentUser: CurrentUser;
  requestedAssigneeId?: string | null;
}): Promise<{ id: string | null; name: string | null }> {
  const requestedAssigneeId = input.requestedAssigneeId?.trim();

  if (!requestedAssigneeId) {
    return { id: null, name: null };
  }

  const operator = (await findAssignableOperatorsForCompany(input.currentUser.companyId)).find(
    (user) => user.id === requestedAssigneeId,
  );

  if (!operator) {
    throw new ValidationError("Operátor nebyl nalezen.");
  }

  return {
    id: operator.id,
    name: operator.name ?? operator.email,
  };
}

export async function getImportPageView(
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<ImportPageView> {
  const currentUser = await requireCurrentUser();

  if (!canManageCompanyData(currentUser.role)) {
    redirect("/contacts");
  }

  const returnToParam = Array.isArray(rawQuery.returnTo)
    ? rawQuery.returnTo[0]
    : rawQuery.returnTo;
  const returnTo =
    returnToParam && returnToParam.startsWith("/contacts")
      ? returnToParam
      : buildContactsListPath({});

  const assignableOperators = await findAssignableOperatorsForCompany(currentUser.companyId);

  return {
    returnTo,
    assignableOperators,
    mappableFields: listImportMappableContactFields(),
  };
}

export async function parseImport(input: {
  content: string;
  fileName?: string;
}): Promise<ParseImportResult> {
  const currentUser = await requireCurrentUser();
  assertCanImport(currentUser.role);

  const trimmedContent = input.content.replace(/^\uFEFF/, "").trim();

  if (trimmedContent.length === 0) {
    throw new ValidationError("Soubor je prázdný.");
  }

  const parsed = csvImportAdapter.parse({
    content: trimmedContent,
    fileName: input.fileName,
  });

  enforceImportLimits(trimmedContent, parsed.rows.length);

  if (parsed.headers.length === 0) {
    throw new ValidationError("Soubor neobsahuje hlavičku CSV.");
  }

  return {
    headers: parsed.headers,
    sampleRows: parsed.rows.slice(0, 5).map((row) => row.cells),
    totalRows: parsed.rows.length,
    suggestedMapping: suggestImportColumnMapping(parsed.headers),
  };
}

export async function validateImport(input: {
  content: string;
  mapping: ImportColumnMapping;
}): Promise<ImportPreviewResult & { sections: ImportPreviewSections }> {
  const currentUser = await requireCurrentUser();
  assertCanImport(currentUser.role);

  const preview = await buildImportPreview({
    companyId: currentUser.companyId,
    content: input.content,
    mapping: input.mapping,
  });

  return {
    ...preview,
    sections: buildPreviewSections(preview.rows),
  };
}

export async function executeImport(input: {
  content: string;
  mapping: ImportColumnMapping;
  assignedUserId?: string | null;
  fileName?: string;
}): Promise<ExecuteImportResult> {
  const currentUser = await requireCurrentUser();
  assertCanImport(currentUser.role);

  const assignee = await resolveImportAssignee({
    currentUser,
    requestedAssigneeId: input.assignedUserId,
  });

  const parsed = csvImportAdapter.parse({ content: input.content });
  enforceImportLimits(input.content, parsed.rows.length);

  const drafts = mapRowsToDrafts({ rows: parsed.rows, mapping: input.mapping });
  const normalizedRows = normalizeContactDrafts(drafts);

  const phones: string[] = [];
  const emails: string[] = [];

  for (const row of normalizedRows) {
    if (!row.ok) {
      continue;
    }

    phones.push(row.draft.phone);

    if (row.draft.email) {
      emails.push(row.draft.email);
    }
  }

  const existing = await findExistingContactsByPhonesAndEmails({
    companyId: currentUser.companyId,
    phones,
    emails,
  });

  const previewRows = resolveImportDuplicates({ normalizedRows, existing });
  const previewStats = summarizePreviewRows(previewRows);
  const readyDrafts = getReadyDrafts({ normalizedRows, previewRows });

  const batch = await createImportBatchRecord({
    companyId: currentUser.companyId,
    actorUserId: currentUser.id,
    fileName: input.fileName ?? null,
    status: ImportBatchStatus.COMPLETED,
    stats: {
      total: previewStats.total,
      created: 0,
      skipped: previewStats.skipped,
      failed: previewStats.failed,
      createdContactIds: [],
      skipReasons: previewStats.skipReasons,
      assignedUserId: assignee.id,
      assignedUserName: assignee.name,
    },
  });

  const createdContactIds: string[] = [];
  let batchStatus: ImportBatchStatus = ImportBatchStatus.COMPLETED;

  for (let index = 0; index < readyDrafts.length; index += IMPORT_INSERT_CHUNK_SIZE) {
    const chunk = readyDrafts.slice(index, index + IMPORT_INSERT_CHUNK_SIZE);

    try {
      const chunkIds = await createImportedContactsChunk({
        companyId: currentUser.companyId,
        assignedUserId: assignee.id,
        actorUserId: currentUser.id,
        importBatchId: batch.id,
        fileName: input.fileName ?? null,
        correlationId: batch.id,
        rowOffset: index,
        drafts: chunk,
      });
      createdContactIds.push(...chunkIds);
    } catch {
      batchStatus = ImportBatchStatus.FAILED;
      break;
    }
  }

  const insertFailures = readyDrafts.length - createdContactIds.length;
  const stats = {
    total: previewStats.total,
    created: createdContactIds.length,
    skipped: previewStats.skipped,
    failed: previewStats.failed + insertFailures,
    createdContactIds,
    skipReasons: previewStats.skipReasons,
    assignedUserId: assignee.id,
    assignedUserName: assignee.name,
  };

  const updatedBatch = await updateImportBatchRecord({
    batchId: batch.id,
    companyId: currentUser.companyId,
    status: batchStatus,
    stats,
  });

  await recordAuditEvent({
    companyId: currentUser.companyId,
    actorUserId: currentUser.id,
    action: AuditActions.IMPORT_BATCH_COMPLETED,
    entityType: AuditEntityTypes.CONTACT_IMPORT_BATCH,
    entityId: updatedBatch.id,
    metadata: {
      fileName: input.fileName ?? null,
      created: stats.created,
      skipped: stats.skipped,
      failed: stats.failed,
    },
  });

  return {
    batchId: updatedBatch.id,
    stats,
    fileName: updatedBatch.fileName,
    importedAt: updatedBatch.createdAt.toISOString(),
    assignedUserName: assignee.name,
    status: updatedBatch.status,
  };
}
