import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, FolderOpen, Globe, Plus } from "lucide-react";
import { auth } from "@/auth";
import { getDashboardOverview } from "@/lib/teams";
import { DashboardGreeting } from "../dashboard-greeting";
import { YourFormsSection } from "../your-forms-section";
import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";
import {
  buildContinueItems,
  ContinueWhereLeftOff,
} from "../continue-where-left-off";

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
  const overview = await getDashboardOverview(session.user.id, session.user.role);
  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const formCount = overview.publishedCount + overview.draftCount;
  const publishedShare =
    formCount > 0 ? Math.round((overview.publishedCount / formCount) * 100) : 0;
  const continueItems = buildContinueItems(overview.forms);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <header>
        <DashboardGreeting name={firstName} />
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
          Create a form, save it as a template, and share a new link each month.
        </p>
      </header>

      <section className="grid items-stretch gap-4 lg:grid-cols-4">
        <Link
          href="/dashboard/forms"
          className="card-enter app-brand-surface relative flex min-h-[14rem] flex-col overflow-hidden app-radius p-6 lg:col-span-2"
        >
          <span className="pointer-events-none absolute -right-8 -bottom-10 h-36 w-36 rounded-full bg-on-brand/10" />
          <span className="grid h-10 w-10 place-items-center rounded-full bg-on-brand/10">
            <FolderOpen className="h-5 w-5" />
          </span>
          <p className="mt-6 text-xl font-semibold tracking-tight">Create a form</p>
          <p className="mt-1 max-w-xl text-sm leading-6 text-on-brand/80 text-pretty">
            Create a form from scratch or a template. Each public link can be submitted once.
          </p>
          <span className="mt-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-on-brand text-brand">
            <Plus className="h-4 w-4" />
          </span>
        </Link>

        <Link
          href="/dashboard?forms=published#forms"
          className="card-enter relative flex min-h-[14rem] flex-col overflow-hidden app-radius border border-border bg-card app-shadow-card p-6"
          style={{ animationDelay: "80ms" }}
        >
          <span className="pointer-events-none absolute -right-8 -bottom-10 h-32 w-32 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10" />
          <span className="grid h-11 w-11 place-items-center app-radius bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-500/30">
            <Globe className="h-5 w-5" />
          </span>
          <h3 className="mt-5 text-xl font-semibold tracking-tight">Published</h3>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
            {overview.publishedCount}
          </p>
          <p className="mt-4 truncate text-sm">
            <span className="text-muted">Live share:</span>{" "}
            <span className="font-medium text-foreground">
              {overview.publishedCount === 0
                ? "No live survey links yet"
                : `${publishedShare}% of your forms`}
            </span>
          </p>
        </Link>

        <Link
          href="/dashboard/forms"
          className="card-enter relative flex min-h-[14rem] flex-col overflow-hidden app-radius border border-border bg-card app-shadow-card p-6"
          style={{ animationDelay: "140ms" }}
        >
          <span className="pointer-events-none absolute -right-8 -bottom-10 h-32 w-32 rounded-full bg-amber-100/70 dark:bg-amber-500/10" />
          <span className="grid h-11 w-11 place-items-center app-radius bg-amber-100 text-amber-900 ring-1 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-500/30">
            <FileText className="h-5 w-5" />
          </span>
          <h3 className="mt-5 text-xl font-semibold tracking-tight">Forms</h3>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{formCount}</p>
          <div className="mt-4 space-y-2">
            <p className="truncate text-sm">
              <span className="text-muted">Drafts:</span>{" "}
              <span className="font-medium text-foreground">{overview.draftCount}</span>
            </p>
            <p className="truncate text-sm">
              <span className="text-muted">Published:</span>{" "}
              <span className="font-medium text-foreground">{overview.publishedCount}</span>
            </p>
          </div>
        </Link>
      </section>

      <ContinueWhereLeftOff items={continueItems} />

      <Suspense
        fallback={
          <DirectoryLoadingShell
            storageKey="optiphoenix.formsView"
            cardVariant="form"
            tableColumns={6}
          />
        }
      >
        <YourFormsSection forms={overview.forms} />
      </Suspense>
    </main>
  );
}
