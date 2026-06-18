"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  zodFieldErrors,
} from "@/src/domain/action-result";
import { isDomainError } from "@/src/domain/errors";
import { createNote } from "@/src/features/notes/server/notes.service";

import { createNoteSchema } from "./schemas";

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
