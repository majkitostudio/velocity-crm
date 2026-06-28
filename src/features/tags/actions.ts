"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  zodFieldErrors,
} from "@/src/domain/action-result";
import { isDomainError } from "@/src/domain/errors";

import {
  assignContactTagSchema,
  createContactTagSchema,
  removeContactTagSchema,
} from "./schemas";
import {
  assignTagToContact,
  createTagAndAssignToContact,
  removeTagFromContact,
} from "./server/tags.service";

type TagActionResult = ActionResult<null>;

function revalidateContactPaths(contactId: string) {
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
}

export async function assignContactTagAction(
  _prevState: TagActionResult | null,
  formData: FormData,
): Promise<TagActionResult> {
  const parsed = assignContactTagSchema.safeParse({
    contactId: formData.get("contactId"),
    tagId: formData.get("tagId"),
  });

  if (!parsed.success) {
    return actionFailure("Neplatný požadavek.", zodFieldErrors(parsed.error));
  }

  try {
    await assignTagToContact(parsed.data);
    revalidateContactPaths(parsed.data.contactId);
    return actionSuccess(null);
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}

export async function createContactTagAction(
  _prevState: TagActionResult | null,
  formData: FormData,
): Promise<TagActionResult> {
  const parsed = createContactTagSchema.safeParse({
    contactId: formData.get("contactId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return actionFailure("Opravte chyby ve formuláři.", zodFieldErrors(parsed.error));
  }

  try {
    await createTagAndAssignToContact(parsed.data);
    revalidateContactPaths(parsed.data.contactId);
    return actionSuccess(null);
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}

export async function removeContactTagAction(
  _prevState: TagActionResult | null,
  formData: FormData,
): Promise<TagActionResult> {
  const parsed = removeContactTagSchema.safeParse({
    contactId: formData.get("contactId"),
    tagId: formData.get("tagId"),
  });

  if (!parsed.success) {
    return actionFailure("Neplatný požadavek.", zodFieldErrors(parsed.error));
  }

  try {
    await removeTagFromContact(parsed.data);
    revalidateContactPaths(parsed.data.contactId);
    return actionSuccess(null);
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}
