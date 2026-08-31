import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const AUTH_PAGES = [
  "/login",
  "/create-account",
  "/forgot-password",
  "/reset-password",
  "/waiting",
];

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

  if (isLoggedIn && AUTH_PAGES.includes(pathname) && pathname !== "/reset-password") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
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
