import Link from "next/link";
import { ArrowRight, FileText, Plus } from "lucide-react";
import type { DashboardFormRow } from "@/lib/teams";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

function StatusDot({ status }: { status: DashboardFormRow["status"] }) {
  const map = {
    PUBLISHED: "bg-emerald-500",
    DRAFT: "bg-amber-500",
    CLOSED: "bg-rose-500",
  } as const;
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
      <span className={cn("h-1.5 w-1.5 rounded-full", map[status])} />
      {label}
    </span>
  );
}

export function RecentForms({ forms }: { forms: DashboardFormRow[] }) {
  const recent = forms.slice(0, 6);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Recent forms</h2>
          <p className="mt-0.5 text-sm text-muted">
            Your most recently updated surveys.
          </p>
        </div>
        <Link
          href="/dashboard/forms"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          View all forms <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <Link
          href="/dashboard/forms"
          className="card-enter flex flex-col items-center gap-2 app-radius border border-dashed border-border bg-card px-4 py-10 text-center transition hover:border-brand/40"
        >
          <span className="grid h-10 w-10 place-items-center app-radius bg-brand/10 text-brand">
            <Plus className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-foreground">Create your first form</p>
          <p className="text-xs text-muted">Start blank or from a template.</p>
        </Link>
      ) : (
        <ul className="card-enter grid gap-3 sm:grid-cols-2">
          {recent.map((form, i) => (
            <li key={form.id}>
              <Link
                href={form.href}
                className="group flex h-full items-center gap-3 app-radius border border-border bg-card p-4 app-shadow-card transition hover:border-brand/40"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center app-radius bg-amber-100 text-amber-900 ring-1 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-500/30">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground group-hover:text-brand">
                    {form.title}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StatusDot status={form.status} />
                    <span className="truncate text-xs text-muted">
                      {form.clientName !== "—" ? form.clientName : form.teamName}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-foreground">
                    {form.responseCount}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {formatTimeAgo(form.updatedAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
