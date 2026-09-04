import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAnalyticsForUser } from "@/lib/analytics";
import { getAnalyticsScope, resolveAnalyticsClient } from "@/lib/analytics-scope";
import { InsightsDashboard } from "./insights-dashboard";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; period?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const params = await searchParams;
  const scope = await getAnalyticsScope(session.user.id, session.user.role);
  const resolved = resolveAnalyticsClient(
    params.client,
    scope.clients,
    scope.hasIndependentResponses
  );
  const data = await getAnalyticsForUser(
    session.user.id,
    session.user.role,
    resolved.id,
    params.period ?? "monthly"
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <InsightsDashboard scope={scope} initialData={data} />
    </main>
  );
}
