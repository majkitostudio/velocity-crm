import {
  ContactPriority,
  ContactStatus,
} from "@/src/generated/prisma/client";

import { normalizeEmail, isValidEmail } from "./email";
import {
  formatPhoneValidationMessage,
  isValidPhone,
  normalizePhone,
} from "./phone";

export type FieldValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export function validateContactName(raw: string): FieldValidationResult<string> {
  const value = raw.trim();

  if (value.length === 0) {
    return { ok: false, message: "Jméno je povinné" };
  }

  if (value.length > 200) {
    return { ok: false, message: "Jméno je příliš dlouhé" };
  }

  return { ok: true, value };
}

export function validateContactPhone(raw: string): FieldValidationResult<string> {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { ok: false, message: "Telefon je povinný" };
  }

  const normalized = normalizePhone(trimmed);

  if (!normalized || !isValidPhone(normalized)) {
    return { ok: false, message: formatPhoneValidationMessage() };
  }

  return { ok: true, value: normalized };
}

export function validateOptionalContactEmail(
  raw?: string | null,
): FieldValidationResult<string | null> {
  const normalized = normalizeEmail(raw ?? null);

  if (normalized && !isValidEmail(normalized)) {
    return { ok: false, message: "Neplatný e-mail" };
  }

  return { ok: true, value: normalized };
}

const priorityValues = new Set<string>(Object.values(ContactPriority));
const statusValues = new Set<string>(Object.values(ContactStatus));

export function parseContactPriority(
  raw: string | undefined,
  defaultValue: ContactPriority = ContactPriority.NORMAL,
): FieldValidationResult<ContactPriority> {
  const value = raw?.trim().toUpperCase();

  if (!value) {
    return { ok: true, value: defaultValue };
  }

  if (!priorityValues.has(value)) {
    return { ok: false, message: `Neplatná priorita: ${raw}` };
  }

  return { ok: true, value: value as ContactPriority };
}

export function parseContactStatus(
  raw: string | undefined,
  defaultValue: ContactStatus = ContactStatus.LEAD,
): FieldValidationResult<ContactStatus> {
  const value = raw?.trim().toUpperCase();

  if (!value) {
    return { ok: true, value: defaultValue };
  }

  if (!statusValues.has(value)) {
    return { ok: false, message: `Neplatný stav: ${raw}` };
  }

  return { ok: true, value: value as ContactStatus };
}

export function normalizeOptionalText(raw?: string | null): string | null {
  const value = raw?.trim() ?? "";

  return value.length > 0 ? value : null;
}
