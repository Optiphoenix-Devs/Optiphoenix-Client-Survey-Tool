import { NextResponse } from "next/server";
import { getSignupStatus } from "@/lib/auth-security";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ status: "INVALID" });
  }
  const status = await getSignupStatus(token);
  return NextResponse.json({ status });
}
