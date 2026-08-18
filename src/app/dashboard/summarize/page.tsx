/**
 * Summarize route.
 * Fast path: filters + cached briefing only.
 * Slow path: user clicks Generate, which hits Gemini via generateSummaryAction.
 */
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCachedAiSummary, isGeminiConfigured } from "@/lib/ai-summary";
import { getSummarizeScope } from "@/lib/summarize-scope";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { SummarizeBriefing } from "./summarize-briefing";
import { SummarizeToolbar } from "./summarize-toolbar";

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
    <Suspense fallback={<DashboardSkeleton />}>
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
  const summary =
    data.responseCount > 0
      ? getCachedAiSummary(userId, role, client, data.selectedPeriod)
      : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <SummarizeToolbar
        data={data}
        geminiReady={isGeminiConfigured()}
        hasSummary={Boolean(summary)}
      />
      {data.responseCount === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted">
          {data.selectedClientId
            ? `No submitted responses for ${data.selectedClientName} yet.`
            : "No submitted responses yet. Publish a form and collect the first one."}
        </p>
      ) : summary ? (
        <SummarizeBriefing summary={summary} />
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted">
          Choose a client and period, then generate the AI briefing. Switching
          filters stays instant — Gemini only runs when you ask for it.
        </p>
      )}
    </main>
  );
}
