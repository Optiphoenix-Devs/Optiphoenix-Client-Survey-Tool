"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Inbox,
  MessageSquareText,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type {
  AnalyticsSnapshot,
  RatingRow,
  ResourceRow,
  TrendPoint,
} from "@/lib/analytics-format";
import { NONE_CLIENT, formatScore } from "@/lib/analytics-format";
import { cn } from "@/lib/cn";
import { formatMonthYear, pluralize } from "@/lib/format";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/page";

export function InsightsDashboard({ data }: { data: AnalyticsSnapshot }) {
  const router = useRouter();

  function setClient(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("client", value);
    const query = params.toString();
    router.push(query ? `/dashboard/insights?${query}` : "/dashboard/insights");
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
            Ratings, resource scores, and comments from the responses you can
            access. Switch to a client to see that account only.
          </p>
        </div>
        <label className="flex w-full flex-col gap-1.5 text-sm font-medium lg:w-72">
          <span className="text-muted">Sort By</span>
          <Select
            value={data.selectedClientId}
            onChange={(event) => setClient(event.target.value)}
            aria-label="Sort insights by client"
            className="rounded-full py-2"
          >
            <option value="">All responses</option>
            {data.hasIndependentResponses ? (
              <option value={NONE_CLIENT}>Independent forms</option>
            ) : null}
            {data.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Inbox}
          label="Responses"
          value={data.responseCount}
          hint={pluralize(data.formCount, "form")}
        />
        <StatCard
          icon={Star}
          label="Average rating"
          value={formatScore(data.overall.average)}
          hint={
            data.overall.count
              ? `${pluralize(data.overall.count, "score")} · 1–5`
              : "No rating questions yet"
          }
        />
        <StatCard
          icon={Users}
          label="Resource average"
          value={formatScore(data.resourceAverage)}
          hint={
            data.resourceCount > 0
              ? `${pluralize(data.resourceCount, "score")} · ${pluralize(data.resources.length, "person")}`
              : "No resource ratings yet"
          }
        />
        <StatCard
          icon={TrendingUp}
          label="Combined score"
          value={formatScore(data.combinedAverage)}
          hint={
            data.combinedCount > 0
              ? `${pluralize(data.combinedCount, "score")} · ${
                  data.selectedClientId
                    ? data.selectedClientName
                    : pluralize(data.clientCount, "client")
                }`
              : data.selectedClientId
                ? data.selectedClientName
                : "Ratings + resources"
          }
        />
      </div>

      {data.responseCount === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted">
          {data.selectedClientId
            ? `No submitted responses for ${data.selectedClientName} yet.`
            : "No submitted responses yet. Publish a form and collect the first one."}
        </p>
      ) : (
        <>
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <OverallRatingsCard data={data} />
            <TrendCard points={data.trends} />
          </div>

          {data.questions.length > 0 ? (
            <QuestionRatingsCard rows={data.questions} />
          ) : null}

          {data.resources.length > 0 ? (
            <ResourceCard rows={data.resources} />
          ) : null}

          <SummariesCard
            comments={data.comments}
            responseCount={data.responseCount}
            data={data}
          />
        </>
      )}
    </section>
  );
}

function OverallRatingsCard({ data }: { data: AnalyticsSnapshot }) {
  return (
    <article className="card-enter rounded-3xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">Overall ratings</h2>
      <p className="mt-1 text-sm text-muted">
        Star scores from rating questions
        {data.selectedClientId ? ` · ${data.selectedClientName}` : ""}.
      </p>
      {data.overall.count === 0 ? (
        <p className="mt-4 text-sm text-muted">No 1–5 ratings in this view.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="shrink-0 text-center sm:w-36">
            <p className="text-5xl font-semibold tracking-tight tabular-nums">
              {formatScore(data.overall.average)}
            </p>
            <StarRow score={data.overall.average ?? 0} className="mt-2 justify-center" />
            <p className="mt-2 text-xs text-muted">
              {pluralize(data.overall.count, "rating")}
            </p>
          </div>
          <DistributionBars distribution={data.overall.distribution} total={data.overall.count} />
        </div>
      )}
    </article>
  );
}

function TrendCard({ points }: { points: TrendPoint[] }) {
  return (
    <article className="card-enter rounded-3xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">Historical trends</h2>
      <p className="mt-1 text-sm text-muted">
        Monthly average score (ratings + resource scores) and response volume.
      </p>
      {points.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Not enough history to chart yet.</p>
      ) : (
        <div className="mt-4">
          <TrendChart points={points} />
        </div>
      )}
    </article>
  );
}

function QuestionRatingsCard({ rows }: { rows: RatingRow[] }) {
  return (
    <article className="card-enter rounded-3xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">Question-wise ratings</h2>
      <p className="mt-1 text-sm text-muted">
        Average 1–5 score for each rating question. Same wording across monthly
        forms is combined.
      </p>
      <ul className="mt-6 grid gap-4">
        {rows.map((row) => (
          <li key={row.key} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate font-medium">{row.label}</p>
              <p className="shrink-0 tabular-nums text-sm font-semibold">
                {formatScore(row.average)}
                <span className="ml-1 font-normal text-muted">/ 5</span>
              </p>
            </div>
            <ScoreBar value={row.average} />
            <p className="mt-1 text-xs text-muted">
              {pluralize(row.count, "rating")}
              {row.formCount > 1 ? ` · ${row.formCount} forms` : ""}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ResourceCard({ rows }: { rows: ResourceRow[] }) {
  return (
    <article className="card-enter rounded-3xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">Resource-wise performance</h2>
      <p className="mt-1 text-sm text-muted">
        People named on resource-rating questions, ranked by average score.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[32rem] table-fixed text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="w-[8%] px-3 py-2 text-left font-medium">#</th>
              <th className="w-[36%] px-3 py-2 text-left font-medium">Name</th>
              <th className="w-[28%] px-3 py-2 text-left font-medium">Average</th>
              <th className="w-[14%] px-3 py-2 text-center font-medium">Ratings</th>
              <th className="w-[14%] px-3 py-2 text-center font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.name} className="border-b border-border last:border-0">
                <td className="px-3 py-3 align-middle tabular-nums text-muted">
                  {index + 1}
                </td>
                <td className="truncate px-3 py-3 align-middle font-medium">{row.name}</td>
                <td className="px-3 py-3 align-middle">
                  <ScoreBar value={row.average} />
                </td>
                <td className="px-3 py-3 align-middle text-center tabular-nums">
                  {row.count}
                </td>
                <td className="px-3 py-3 align-middle text-center font-semibold tabular-nums">
                  {formatScore(row.average)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function SummariesCard({
  comments,
  responseCount,
  data,
}: {
  comments: AnalyticsSnapshot["comments"];
  responseCount: number;
  data: AnalyticsSnapshot;
}) {
  return (
    <article className="card-enter rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Average scores and response summaries
          </h2>
          <p className="mt-1 text-sm text-muted">
            Latest comments and suggestions from {pluralize(responseCount, "response")}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={
              data.selectedClientId
                ? `/dashboard/summarize?client=${data.selectedClientId}`
                : "/dashboard/summarize"
            }
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            Summarize with AI
          </Link>
          <Link
            href="/dashboard/responses"
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            View all responses
          </Link>
        </div>
      </div>
      {comments.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No written comments or suggestions in this view yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {comments.map((comment) => (
            <li key={comment.id}>
              <Link
                href={comment.href}
                className="block rounded-2xl border border-border bg-surface px-4 py-3 transition hover:border-accent/30 hover:bg-hover"
              >
                <p className="flex items-start gap-2 text-sm leading-6">
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="line-clamp-3">{comment.text}</span>
                </p>
                <p className="mt-2 pl-6 text-xs text-muted">
                  {comment.clientName} · {comment.formTitle} ·{" "}
                  {formatMonthYear(comment.submittedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function DistributionBars({
  distribution,
  total,
}: {
  distribution: AnalyticsSnapshot["overall"]["distribution"];
  total: number;
}) {
  return (
    <ul className="min-w-0 flex-1 space-y-2">
      {[5, 4, 3, 2, 1].map((score) => {
        const count = distribution[score - 1];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <li key={score} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted">
              {score}
            </span>
            <div className="h-2 min-w-0 flex-1 rounded-full bg-hover">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div className="mt-1.5 h-2 rounded-full bg-hover">
      <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

function StarRow({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-accent", className)}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = score >= index + 0.5;
        return (
          <Star
            key={index}
            className="h-4 w-4"
            fill={filled ? "currentColor" : "none"}
            strokeWidth={1.75}
          />
        );
      })}
    </span>
  );
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  const width = 640;
  const height = 220;
  const pad = { l: 36, r: 16, t: 12, b: 40 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const maxResponses = Math.max(1, ...points.map((point) => point.responses));
  const x = (index: number) =>
    pad.l +
    (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const yScore = (value: number) =>
    pad.t + innerH - ((value - 1) / 4) * innerH;
  const barWidth = Math.min(28, innerW / Math.max(points.length, 1) / 2);

  const line = points
    .map((point, index) =>
      point.average == null ? null : `${x(index)},${yScore(point.average)}`
    )
    .filter(Boolean)
    .join(" ");

  const labelEvery = points.length > 8 ? 2 : 1;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-52 w-full"
        role="img"
        aria-label="Monthly average score and response count"
      >
        {[5, 4, 3, 2, 1].map((tick) => (
          <g key={tick}>
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={yScore(tick)}
              y2={yScore(tick)}
              className="stroke-border"
              strokeWidth="1"
            />
            <text
              x={pad.l - 8}
              y={yScore(tick) + 3}
              textAnchor="end"
              className="fill-muted text-[10px]"
            >
              {tick}
            </text>
          </g>
        ))}
        {points.map((point, index) => {
          const barH = (point.responses / maxResponses) * innerH * 0.4;
          return (
            <rect
              key={`${point.key}-bar`}
              x={x(index) - barWidth / 2}
              y={pad.t + innerH - barH}
              width={barWidth}
              height={barH}
              rx="3"
              className="fill-sage/35"
            />
          );
        })}
        {line ? (
          <polyline
            fill="none"
            className="stroke-accent"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={line}
          />
        ) : null}
        {points.map((point, index) =>
          point.average == null ? null : (
            <circle
              key={`${point.key}-dot`}
              cx={x(index)}
              cy={yScore(point.average)}
              r="3.5"
              className="fill-accent"
            />
          )
        )}
        {points.map((point, index) =>
          index % labelEvery === 0 ? (
            <text
              key={`${point.key}-label`}
              x={x(index)}
              y={height - 12}
              textAnchor="middle"
              className="fill-muted text-[10px]"
            >
              {point.label}
            </text>
          ) : null
        )}
      </svg>
      <p className="mt-1 text-xs text-muted">
        Line is average score (1–5). Bars are response count. Source: submitted
        forms in this view.
      </p>
    </div>
  );
}
