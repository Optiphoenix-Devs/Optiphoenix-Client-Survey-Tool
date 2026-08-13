import { NextResponse } from "next/server";
import { checkDatabase } from "@/lib/db-check";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkDatabase();
  const status = result.ok ? 200 : 500;

  return NextResponse.json(result, { status });
}
