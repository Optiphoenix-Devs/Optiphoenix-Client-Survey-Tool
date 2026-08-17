import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAnalyticsForUser } from "@/lib/analytics";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { InsightsDashboard } from "./insights-dashboard";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <InsightsBody
        userId={session.user.id}
        role={session.user.role}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

async function InsightsBody({
  userId,
  role,
  searchParams,
}: {
  userId: string;
  role: "ADMIN" | "TEAM_LEAD";
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const data = await getAnalyticsForUser(userId, role, client);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <InsightsDashboard data={data} />
    </main>
  );
}
