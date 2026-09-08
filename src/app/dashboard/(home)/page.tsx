import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bookmark,
  Building2,
  Download,
  FileText,
  Globe,
  Inbox,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { getDashboardOverview } from "@/lib/teams";
import { DashboardGreeting } from "../dashboard-greeting";
import {
  buildContinueItems,
  ContinueWhereLeftOff,
} from "../continue-where-left-off";
import { KpiCard, KpiBadge } from "./kpi-card";
import { InsightsStrip } from "./insights-strip";
import { TeamsOverview } from "./teams-overview";
import { RecentForms } from "./recent-forms";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ forms?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  await searchParams;
  const overview = await getDashboardOverview(session.user.id, session.user.role);
  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const isAdmin = session.user.role === "ADMIN";
  const formCount = overview.publishedCount + overview.draftCount + overview.closedCount;
  const publishedShare =
    formCount > 0 ? Math.round((overview.publishedCount / formCount) * 100) : 0;
  const continueItems = buildContinueItems(overview.forms);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      {/* Header — title/subtitle on one line, actions on the next */}
      <header className="flex flex-col gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <DashboardGreeting name={firstName} />
            <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isAdmin ? "Admin" : "Team Lead"}
            </span>
          </div>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
            {isAdmin
              ? "Organisation-wide view of teams, users, forms, and client responses."
              : "Your surveys, client responses, and workspace shortcuts at a glance."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Link
            href="/dashboard/forms"
            className="app-btn-primary h-10 px-4 text-sm font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create Form</span>
          </Link>

          {isAdmin ? (
            <Link
              href="/dashboard/users"
              className="app-btn-secondary h-10 px-4 text-sm font-medium inline-flex items-center justify-center gap-1.5"
            >
              <UserRound className="h-4 w-4" />
              <span>Manage Users</span>
            </Link>
          ) : (
            <Link
              href="/dashboard/responses"
              className="app-btn-secondary h-10 px-4 text-sm font-medium inline-flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Export Responses</span>
            </Link>
          )}

          <Link
            href={isAdmin ? "/dashboard/teams" : "/dashboard/clients"}
            className="app-btn-secondary h-10 px-4 text-sm font-medium inline-flex items-center justify-center gap-1.5"
          >
            {isAdmin ? (
              <Users className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span>{isAdmin ? "Teams" : "Clients"}</span>
          </Link>

          <Link
            href="/dashboard/templates"
            className="app-btn-secondary h-10 px-4 text-sm font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Bookmark className="h-4 w-4" />
            <span>Templates</span>
          </Link>
        </div>
      </header>

      {/* KPI cards — different metric set per role */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin ? (
          <>
            <KpiCard
              href="/dashboard/users"
              icon={UserRound}
              label="Team Members"
              value={overview.userCount}
              hint="People with an account"
              cta="Manage"
              accent="violet"
              badge={<KpiBadge>Directory</KpiBadge>}
            />
            <KpiCard
              href="/dashboard/teams"
              icon={Users}
              label="Active Teams"
              value={overview.teamCount}
              hint={`${overview.clientCount} client organisations`}
              cta="Open"
              accent="indigo"
              delayMs={60}
              badge={<KpiBadge>Workspaces</KpiBadge>}
            />
            <KpiCard
              href="/dashboard/forms"
              icon={FileText}
              label="Total Forms"
              value={formCount}
              hint={`${overview.draftCount} drafts · ${overview.publishedCount} published`}
              cta="Library"
              accent="amber"
              delayMs={120}
              badge={<KpiBadge>Form Library</KpiBadge>}
            />
            <KpiCard
              href="/dashboard/responses"
              icon={Inbox}
              label="Total Responses"
              value={overview.responseCount}
              hint={`${overview.responsesLast30} in the last 30 days`}
              cta="View all"
              accent="emerald"
              delayMs={180}
              badge={<KpiBadge tone="live">Live Data</KpiBadge>}
            />
          </>
        ) : (
          <>
            <KpiCard
              href="/dashboard/responses"
              icon={Inbox}
              label="Total Responses"
              value={overview.responseCount}
              hint={`${overview.responsesLast30} in the last 30 days`}
              cta="View all"
              accent="emerald"
              badge={<KpiBadge tone="live">Live Data</KpiBadge>}
            />
            <KpiCard
              href="/dashboard?forms=published#forms"
              icon={Globe}
              label="Published Surveys"
              value={overview.publishedCount}
              hint={
                overview.publishedCount === 0
                  ? "No live survey links"
                  : `${publishedShare}% of your forms`
              }
              cta="Filter"
              accent="sky"
              delayMs={60}
              badge={
                overview.publishedCount > 0 ? (
                  <KpiBadge tone="active">Active</KpiBadge>
                ) : (
                  <KpiBadge>None Active</KpiBadge>
                )
              }
            />
            <KpiCard
              href="/dashboard/clients"
              icon={Building2}
              label="Your Clients"
              value={overview.clientCount}
              hint="Client organisations"
              cta="Manage"
              accent="indigo"
              delayMs={120}
              badge={<KpiBadge>Accounts</KpiBadge>}
            />
            <KpiCard
              href="/dashboard/forms"
              icon={FileText}
              label="Total Forms"
              value={formCount}
              hint={`${overview.draftCount} drafts · ${overview.publishedCount} published`}
              cta="Library"
              accent="amber"
              delayMs={180}
              badge={<KpiBadge>Form Library</KpiBadge>}
            />
          </>
        )}
      </section>

      {/* Trend + recent activity */}
      <InsightsStrip
        sparkline={overview.sparkline}
        last30={overview.responsesLast30}
        prev30={overview.responsesPrev30}
        recent={overview.recentResponses}
        totalResponses={overview.responseCount}
      />

      {/* Admin: teams table · Lead: resume work */}
      {isAdmin ? (
        <TeamsOverview teams={overview.teams} />
      ) : (
        <ContinueWhereLeftOff items={continueItems} />
      )}

      {/* Compact recent forms — full directory lives at /dashboard/forms */}
      <RecentForms forms={overview.forms} />
    </main>
  );
}
