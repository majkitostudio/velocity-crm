"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  zodFieldErrors,
} from "@/src/domain/action-result";
import { isDomainError } from "@/src/domain/errors";

import { assignContactSchema } from "./schemas";
import { assignContactToOperator } from "./server/queue.service";

export async function assignContactAction(
  _prevState: ActionResult<{ contactId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ contactId: string }>> {
  const parsed = assignContactSchema.safeParse({
    contactId: formData.get("contactId"),
    operatorId: formData.get("operatorId"),
  });

  if (!parsed.success) {
    return actionFailure("Opravte chyby ve formuláři.", zodFieldErrors(parsed.error));
  }

  try {
    await assignContactToOperator(parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/contacts");

    const { contactId } = parsed.data;
    revalidatePath(`/contacts/${contactId}`);

    return actionSuccess({ contactId });
  } catch (error) {
    if (isDomainError(error)) {
      return actionFailure(error.message);
    }

    throw error;
  }
}
