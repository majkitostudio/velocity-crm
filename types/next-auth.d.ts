import type { DefaultSession } from "next-auth";
import type { AppUserRole } from "@/src/domain/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      companyId: string;
      role: AppUserRole;
    } & DefaultSession["user"];
  }

  interface User {
    companyId: string;
    role: AppUserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    companyId: string;
    role: AppUserRole;
  }
}
