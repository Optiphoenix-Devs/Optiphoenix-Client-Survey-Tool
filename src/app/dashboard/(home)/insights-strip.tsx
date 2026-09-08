import Link from "next/link";
import { ArrowRight, Inbox, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

type Recent = {
  id: string;
  submittedAt: string;
  formId: string;
  formTitle: string;
  clientName: string;
};

export function InsightsStrip({
  sparkline,
  last30,
  prev30,
  recent,
  totalResponses,
}: {
  sparkline: { label: string; count: number }[];
  last30: number;
  prev30: number;
  recent: Recent[];
  totalResponses: number;
}) {
  const delta =
    prev30 === 0 ? (last30 > 0 ? 100 : 0) : Math.round(((last30 - prev30) / prev30) * 100);
  const up = delta > 0;
  const flat = delta === 0;
  const max = Math.max(1, ...sparkline.map((d) => d.count));

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {/* Response trend */}
      <div className="card-enter flex flex-col app-radius border border-border bg-card p-6 app-shadow-card lg:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-muted">Responses · last 30 days</h2>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {last30}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  flat
                    ? "bg-surface text-muted border border-border"
                    : up
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                )}
              >
                {flat ? (
                  <Minus className="h-3 w-3" />
                ) : up ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {flat ? "No change" : `${up ? "+" : ""}${delta}%`}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">
              vs {prev30} in the prior 30 days · {totalResponses} all-time
            </p>
          </div>
          <Link
            href="/dashboard/insights"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            Insights <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 flex flex-1 items-end gap-1 sm:gap-1.5" aria-hidden>
          {sparkline.map((d) => (
            <div
              key={d.label}
              className="group relative flex-1"
              style={{ height: 72 }}
              title={`${d.label}: ${d.count}`}
            >
              <div
                className="absolute bottom-0 w-full rounded-sm bg-brand/25 transition-colors group-hover:bg-brand"
                style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">Daily submissions over the past 14 days</p>
      </div>

      {/* Recent activity */}
      <div className="card-enter flex flex-col app-radius border border-border bg-card p-6 app-shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Recent activity</h2>
          <Link
            href="/dashboard/responses"
            className="text-xs font-medium text-brand hover:underline"
          >
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
            <Inbox className="h-6 w-6 text-muted" />
            <p className="text-sm text-muted">No responses yet.</p>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border/60">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/responses?form=${r.formId}`}
                  className="group flex items-center gap-3 py-2.5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center app-radius bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-500/30">
                    <Inbox className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:text-brand">
                      {r.formTitle}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {r.clientName}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted tabular-nums">
                    {formatTimeAgo(r.submittedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
