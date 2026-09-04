/**
 * Summarize route.
 * Fast path: filters + cached briefing only.
 * Slow path: user clicks Generate, which hits Gemini via generateSummaryAction.
 */
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCachedAiSummary } from "@/lib/ai-summary";
import { getSummarizeScope } from "@/lib/summarize-scope";
import { SummarizeSkeleton } from "@/components/ui/skeleton";
import { SummarizeView } from "./summarize-view";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function SummarizePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; period?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  return (
    <Suspense fallback={<SummarizeSkeleton />}>
      <SummarizeBody
        userId={session.user.id}
        role={session.user.role}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

async function SummarizeBody({
  userId,
  role,
  searchParams,
}: {
  userId: string;
  role: "ADMIN" | "TEAM_LEAD";
  searchParams: Promise<{ client?: string; period?: string }>;
}) {
  const { client, period } = await searchParams;
  const data = await getSummarizeScope(userId, role, client, period);
  // Must use resolved selectedClientId (same as Generate), not the raw URL
  // `client` param — otherwise cache miss after generate when the URL has no client.
  const summary =
    data.responseCount > 0
      ? getCachedAiSummary(
          userId,
          role,
          data.selectedClientId,
          data.selectedPeriod,
          { allowStale: true }
        )
      : null;

  return (
    <SummarizeView
      data={data}
      clientParam={client}
      periodParam={period}
      hasSummary={Boolean(summary)}
      summary={summary}
    />
  );
}
