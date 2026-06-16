export const USER_ROLES = ["ADMIN", "MANAGER", "OPERATOR"] as const;

export type AppUserRole = (typeof USER_ROLES)[number];

export function isAppUserRole(value: unknown): value is AppUserRole {
  return typeof value === "string" && USER_ROLES.includes(value as AppUserRole);
}
