import { NextResponse } from "next/server";
import { signOut } from "@/auth";

/**
 * Cookie clearing must happen in a Route Handler (not a Server Component layout).
 * Used when a dashboard visit finds an invalidated JWT (logged in elsewhere).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const notice = url.searchParams.get("notice");

  await signOut({ redirect: false });

  const login = new URL("/login", url.origin);
  if (notice) login.searchParams.set("notice", notice);
  return NextResponse.redirect(login);
}
