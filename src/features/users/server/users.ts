import "server-only";

import { hash } from "bcryptjs";

import { UserRole, type User } from "@/src/generated/prisma/client";
import { requireRole } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

export async function createCompanyUser(input: {
  name?: string | null;
  email: string;
  password: string;
  role: UserRole;
}): Promise<User> {
  const currentUser = await requireRole(["ADMIN"]);
  const passwordHash = await hash(input.password, 12);

  return prisma.user.create({
    data: {
      companyId: currentUser.companyId,
      name: input.name ?? null,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      role: input.role,
    },
  });
}

export async function listCompanyOperators(): Promise<Pick<User, "id" | "name" | "email">[]> {
  const currentUser = await requireRole(["ADMIN", "MANAGER"]);

  return prisma.user.findMany({
    where: {
      companyId: currentUser.companyId,
      role: UserRole.OPERATOR,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
