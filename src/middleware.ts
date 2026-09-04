import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import {
  directoryViewCookieKeyForPath,
  viewParamToDirectoryView,
} from "@/lib/directory-view";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth);
  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");

  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/create-account", request.nextUrl));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/login", request.nextUrl)
    );
  }

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // Do not bounce auth pages → dashboard here. Stale JWTs (invalidated by a
  // newer login) still look “logged in” on the edge; server `auth()` decides.
  // Login / create-account pages redirect themselves when the session is valid.

  const viewCookieKey = directoryViewCookieKeyForPath(pathname);
  const viewFromParam = viewParamToDirectoryView(request.nextUrl.searchParams.get("view"));

  if (viewCookieKey && viewFromParam) {
    const response = NextResponse.next();
    response.cookies.set(viewCookieKey, viewFromParam, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",
    "/create-account",
    "/forgot-password",
    "/reset-password",
    "/waiting",
  ],
};
