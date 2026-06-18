"use server";

import { redirect } from "next/navigation";

import {
  actionFailure,
  type ActionResult,
  zodFieldErrors,
} from "@/src/domain/action-result";
import { signIn, signOut } from "@/src/server/auth";

import { loginSchema } from "./schemas";

export async function loginAction(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionFailure("Please fix the errors below.", zodFieldErrors(parsed.error));
  }

  const result = await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  });

  if (result?.error) {
    return actionFailure("Invalid email or password.");
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
