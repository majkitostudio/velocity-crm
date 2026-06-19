import "server-only";

import { redirect } from "next/navigation";

import { ForbiddenError } from "@/src/domain/errors";
import { auth } from "@/src/server/auth";
import type { AppUserRole } from "@/src/domain/auth";

export type CurrentUser = {
  id: string;
  companyId: string;
  role: AppUserRole;
  email?: string | null;
  name?: string | null;
};

export async function requireCurrentUser(): Promise<CurrentUser> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return {
    id: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function requireRole(
  allowedRoles: readonly AppUserRole[],
): Promise<CurrentUser> {
  const user = await requireCurrentUser();

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError();
  }

  return user;
}

export function canManageCompanyData(role: AppUserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
