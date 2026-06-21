"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  zodFieldErrors,
} from "@/src/domain/action-result";
import { isDomainError } from "@/src/domain/errors";
import { createNote } from "@/src/features/notes/server/notes.service";

import { parseReturnToPath } from "./lib/list-navigation";
import {
  createContactSchema,
  createNoteSchema,
  executeImportSchema,
  parseImportSchema,
  validateImportSchema,
} from "./schemas";
import { createContact } from "./server/contacts.service";
import {
  executeImport,
  parseImport,
  validateImport,
} from "./server/import/import.service";
import type {
  ExecuteImportResult,
  ImportPreviewResult,
  ImportPreviewSections,
  ParseImportResult,
} from "./lib/import-types";

export async function createContactAction(
  _prevState: ActionResult<{ contactId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ contactId: string }>> {
  const parsed = createContactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    priority: formData.get("priority") || undefined,
    assignedUserId: formData.get("assignedUserId") || undefined,
    returnTo: formData.get("returnTo") || undefined,
  });

  if (!parsed.success) {
    return actionFailure("Opravte chyby ve formuláři.", zodFieldErrors(parsed.error));
  }

  try {
    const contact = await createContact(parsed.data);

    revalidatePath("/contacts");

    const returnTo = parseReturnToPath(parsed.data.returnTo);
    redirect(
      `/contacts/${contact.id}?returnTo=${encodeURIComponent(returnTo)}&created=1`,
    );
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}

export async function parseImportAction(
  input: unknown,
): Promise<ActionResult<ParseImportResult>> {
  const parsed = parseImportSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Neplatný soubor pro import.", zodFieldErrors(parsed.error));
  }

  try {
    const result = await parseImport(parsed.data);
    return actionSuccess(result);
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}

export async function validateImportAction(
  input: unknown,
): Promise<ActionResult<ImportPreviewResult & { sections: ImportPreviewSections }>> {
  const parsed = validateImportSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Neplatné mapování sloupců.", zodFieldErrors(parsed.error));
  }

  try {
    const result = await validateImport(parsed.data);
    return actionSuccess(result);
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}

export async function executeImportAction(
  input: unknown,
): Promise<ActionResult<ExecuteImportResult>> {
  const parsed = executeImportSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("Neplatná data pro import.", zodFieldErrors(parsed.error));
  }

  try {
    const result = await executeImport(parsed.data);

    revalidatePath("/contacts");

    return actionSuccess(result);
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}

export async function createNoteAction(
  _prevState: ActionResult<{ noteId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ noteId: string }>> {
  const parsed = createNoteSchema.safeParse({
    contactId: formData.get("contactId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return actionFailure("Please fix the errors below.", zodFieldErrors(parsed.error));
  }

  try {
    const note = await createNote({
      contactId: parsed.data.contactId,
      body: parsed.data.body,
    });

    revalidatePath(`/contacts/${parsed.data.contactId}`);

    return actionSuccess({ noteId: note.id });
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}
