import {
  ContactPriority,
  ContactStatus,
} from "@/src/generated/prisma/client";

import {
  normalizeOptionalText,
  parseContactPriority,
  parseContactStatus,
  validateContactName,
  validateContactPhone,
  validateOptionalContactEmail,
} from "../../lib/contact-field-validation";
import type { MappedContactDraft, NormalizedContactDraft } from "./import.types";

export type NormalizedDraftResult =
  | { ok: true; draft: NormalizedContactDraft }
  | { ok: false; message: string };

export function normalizeContactDraft(
  draft: MappedContactDraft,
): NormalizedDraftResult {
  if (!draft.name) {
    return { ok: false, message: "Chybí jméno" };
  }

  if (!draft.phone) {
    return { ok: false, message: "Chybí telefon" };
  }

  const nameResult = validateContactName(draft.name);
  if (!nameResult.ok) {
    return { ok: false, message: nameResult.message };
  }

  const phoneResult = validateContactPhone(draft.phone);
  if (!phoneResult.ok) {
    return { ok: false, message: phoneResult.message };
  }

  const emailResult = validateOptionalContactEmail(draft.email);
  if (!emailResult.ok) {
    return { ok: false, message: emailResult.message };
  }

  const priorityResult = parseContactPriority(draft.priority, ContactPriority.NORMAL);
  if (!priorityResult.ok) {
    return { ok: false, message: priorityResult.message };
  }

  const statusResult = parseContactStatus(draft.status, ContactStatus.LEAD);
  if (!statusResult.ok) {
    return { ok: false, message: statusResult.message };
  }

  return {
    ok: true,
    draft: {
      rowNumber: draft.rowNumber,
      name: nameResult.value,
      phone: phoneResult.value,
      email: emailResult.value,
      priority: priorityResult.value,
      status: statusResult.value,
      street: normalizeOptionalText(draft.street),
      city: normalizeOptionalText(draft.city),
      zipCode: normalizeOptionalText(draft.zipCode),
      country: normalizeOptionalText(draft.country),
    },
  };
}

export function normalizeContactDrafts(drafts: MappedContactDraft[]): Array<
  | { rowNumber: number; ok: true; draft: NormalizedContactDraft }
  | { rowNumber: number; ok: false; message: string }
> {
  return drafts.map((draft) => {
    const result = normalizeContactDraft(draft);

    if (!result.ok) {
      return { rowNumber: draft.rowNumber, ok: false, message: result.message };
    }

    return { rowNumber: draft.rowNumber, ok: true, draft: result.draft };
  });
}
