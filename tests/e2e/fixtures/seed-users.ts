export const seedUsers = {
  admin: {
    email: "admin@velocity.local",
    password: "changeme-admin",
    role: "ADMIN",
  },
  manager: {
    email: "manager@velocity.local",
    password: "changeme-manager",
    role: "MANAGER",
  },
  operator: {
    email: "operator@velocity.local",
    password: "changeme-operator",
    role: "OPERATOR",
  },
} as const;

export type SeedUserKey = keyof typeof seedUsers;
