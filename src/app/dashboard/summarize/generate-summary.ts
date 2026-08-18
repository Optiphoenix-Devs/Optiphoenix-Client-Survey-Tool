"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { generateAiSummaryForUser } from "@/lib/ai-summary";

/** Called only from the Generate / Regenerate button. `force` skips the in-memory cache. */
export async function generateSummaryAction(clientFilter: string, periodFilter: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  return generateAiSummaryForUser(
    session.user.id,
    session.user.role,
    clientFilter,
    periodFilter,
    { force: true }
  );
}
