import { ForbiddenError } from "@/src/domain/errors";

import type { AppUserRole } from "@/src/domain/auth";

const ROLE_RANK: Record<AppUserRole, number> = {
  OPERATOR: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function hasMinimumRole(
  userRole: AppUserRole,
  minRole: AppUserRole,
): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export function assertMinimumRole(
  userRole: AppUserRole,
  minRole: AppUserRole,
): void {
  if (!hasMinimumRole(userRole, minRole)) {
    throw new ForbiddenError("Insufficient role for this AI service");
  }
}
