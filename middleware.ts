import { NextResponse } from "next/server";

import { auth } from "@/src/server/auth.edge";

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isAuthApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/auth");
}

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isAuthenticated = !!request.auth;

  if (isAuthApiPath(pathname)) {
    return NextResponse.next();
  }

  if (isAuthenticated && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
