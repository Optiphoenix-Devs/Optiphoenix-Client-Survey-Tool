import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateProfile } from "@/app/dashboard/profile/actions";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const result = await updateProfile(formData);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
