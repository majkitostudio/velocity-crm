import NextAuth from "next-auth";

import { authConfig } from "@/src/server/auth.config";

export const { auth } = NextAuth(authConfig);
