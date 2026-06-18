import type { NextAuthConfig } from "next-auth";

import { isAppUserRole } from "@/src/domain/auth";

export const authConfig = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.companyId = user.companyId;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (!isAppUserRole(token.role)) {
          throw new Error("Invalid session role");
        }

        session.user.id = String(token.id);
        session.user.companyId = String(token.companyId);
        session.user.role = token.role;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
