"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAnalyticsForUser } from "@/lib/analytics";
import type { AnalyticsSnapshot } from "@/lib/analytics-format";

export async function fetchAnalyticsAction(
  clientId: string,
  period: string
): Promise<AnalyticsSnapshot | { error: string }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  try {
    return await getAnalyticsForUser(
      session.user.id,
      session.user.role,
      clientId,
      period
    );
  } catch {
    return { error: "Could not load insights." };
  }
}
