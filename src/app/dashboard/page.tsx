import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  FolderOpen,
  Globe,
  Inbox,
  Plus,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { getDashboardOverview } from "@/lib/teams";
import { DashboardGreeting } from "./dashboard-greeting";
import { YourFormsSection } from "./your-forms-section";
import { StatCard } from "@/components/ui/page";
import { DirectorySkeleton } from "@/components/ui/skeleton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    forms?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  await searchParams;
  const overview = await getDashboardOverview(
    session.user.id,
    session.user.role
  );
  const isAdmin = session.user.role === "ADMIN";
  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const createHref = overview.createFormHref;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <DashboardGreeting name={firstName} />
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
            {isAdmin
              ? "You can see every team. Open a client to build that client’s form."
              : "You only see teams you belong to. Open a client to build that client’s form."}
          </p>
        </div>
        <Link
          href={createHref}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          New form
        </Link>
      </header>

      <section className="grid gap-4 lg:grid-cols-4">
        <Link
          href={createHref}
          className="relative overflow-hidden rounded-3xl bg-accent p-6 text-on-accent lg:col-span-2 card-enter"
        >
          <span className="pointer-events-none absolute -right-8 -bottom-10 h-36 w-36 rounded-full bg-on-accent/10" />
          <span className="grid h-10 w-10 place-items-center rounded-full bg-on-accent/10">
            <FolderOpen className="h-5 w-5" />
          </span>
          <p className="mt-6 text-xl font-semibold tracking-tight">Create a form</p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-on-accent/80">
            Open a client, then build that client’s survey. Forms stay isolated
            per client.
          </p>
          <span className="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-on-accent text-accent">
            <Plus className="h-4 w-4" />
          </span>
        </Link>

        <Link
          href="/dashboard?forms=published#forms"
          className="card-enter relative overflow-hidden rounded-3xl border border-border bg-card p-6"
          style={{ animationDelay: "80ms" }}
        >
          <span className="pointer-events-none absolute -right-8 -bottom-10 h-32 w-32 rounded-full bg-sage/20" />
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sage/15 text-accent">
            <Globe className="h-5 w-5" />
          </span>
          <p className="mt-6 text-lg font-semibold tracking-tight">Published</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Live links collecting client feedback.
          </p>
          <span className="mt-5 inline-flex rounded-full bg-sage/20 px-3 py-1 text-xs font-semibold text-accent">
            {overview.publishedCount} live
          </span>
        </Link>

        <Link
          href="/dashboard?forms=drafts#forms"
          className="card-enter relative overflow-hidden rounded-3xl border border-border bg-card p-6"
          style={{ animationDelay: "140ms" }}
        >
          <span className="pointer-events-none absolute -right-8 -bottom-10 h-32 w-32 rounded-full bg-hover" />
          <span className="grid h-10 w-10 place-items-center rounded-full bg-hover text-accent">
            <FileText className="h-5 w-5" />
          </span>
          <p className="mt-6 text-lg font-semibold tracking-tight">Drafts</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Work in progress, not yet shared with a client.
          </p>
          <span className="mt-5 inline-flex rounded-full bg-hover px-3 py-1 text-xs font-semibold text-muted">
            {overview.draftCount} drafts
          </span>
        </Link>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Inbox}
          label="Responses"
          value={overview.responseCount}
        />
        <StatCard icon={Users} label="Teams" value={overview.teamCount} />
        <StatCard
          icon={CheckCircle2}
          label="Published"
          value={overview.publishedCount}
          hint={`${overview.formCount} total forms`}
        />
        <StatCard icon={FileText} label="Drafts" value={overview.draftCount} />
      </div>

      <Suspense
        fallback={<DirectorySkeleton />}
      >
        <YourFormsSection forms={overview.forms} />
      </Suspense>
    </main>
  );
}
