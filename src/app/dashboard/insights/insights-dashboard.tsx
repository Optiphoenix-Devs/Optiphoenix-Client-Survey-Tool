"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  FileText,
  Lightbulb,
  MessageSquareText,
  Minus,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { AnalyticsScope } from "@/lib/analytics-scope";
import type {
  AnalyticsSnapshot,
  RatingRow,
  ResourceRow,
  TrendPoint,
} from "@/lib/analytics-format";
import { NONE_CLIENT, formatScore } from "@/lib/analytics-format";
import {
  INSIGHTS_TABLE_SORT_OPTIONS,
  periodFromInsightsSort,
  resolveInsightsRowSort,
  sortQuestionRows,
  sortResourceRows,
  type InsightsRowSort,
  type InsightsTableSortOption,
} from "@/lib/insights-table-sort";
import { cn } from "@/lib/cn";
import { formatMonthYear, pluralize } from "@/lib/format";
import { Select, SortByOption } from "@/components/ui/select";
import { InsightsSkeleton } from "@/components/ui/skeleton";
import { fetchAnalyticsAction } from "./actions";

export function InsightsDashboard({
  scope,
  initialData,
}: {
  scope: AnalyticsScope;
  initialData: AnalyticsSnapshot;
}) {
  const [data, setData] = useState(initialData);
  const [clientId, setClientId] = useState(initialData.selectedClientId);
  const [tablePeriod, setTablePeriod] = useState(initialData.selectedPeriod);
  const [resourceSearch, setResourceSearch] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [resourceSortSelection, setResourceSortSelection] = useState<
    InsightsTableSortOption | ""
  >("");
  const [questionSortSelection, setQuestionSortSelection] = useState<
    InsightsTableSortOption | ""
  >("");
  const [resourceRowSort, setResourceRowSort] =
    useState<InsightsRowSort>("score-desc");
  const [questionRowSort, setQuestionRowSort] =
    useState<InsightsRowSort>("score-desc");
  const [loading, startLoad] = useTransition();

  function loadAnalytics(nextClient: string, nextPeriod: string) {
    startLoad(async () => {
      const result = await fetchAnalyticsAction(nextClient, nextPeriod);
      if ("error" in result) return;
      setData(result);
      setClientId(result.selectedClientId);
      setTablePeriod(result.selectedPeriod);
    });
  }

  function setClient(value: string) {
    setClientId(value);
    loadAnalytics(value, tablePeriod);
  }

  function applyTableSort(
    value: InsightsTableSortOption | "",
    target: "resource" | "question"
  ) {
    if (!value) return;
    if (target === "resource") setResourceSortSelection(value);
    else setQuestionSortSelection(value);

    const nextPeriod = periodFromInsightsSort(value);
    if (nextPeriod) {
      setTablePeriod(nextPeriod);
      loadAnalytics(clientId, nextPeriod);
      return;
    }

    const rowSort = resolveInsightsRowSort(value);
    if (target === "resource") setResourceRowSort(rowSort);
    else setQuestionRowSort(rowSort);
  }

  const visibleResources = useMemo(
    () => sortResourceRows(data.resources, resourceRowSort, resourceSearch),
    [data.resources, resourceRowSort, resourceSearch]
  );
  const visibleQuestions = useMemo(
    () => sortQuestionRows(data.questions, questionRowSort, questionSearch),
    [data.questions, questionRowSort, questionSearch]
  );

  if (loading) {
    return <InsightsSkeleton />;
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Insights</h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
            Explore the ratings, resource scores, and feedbacks from the clients.
          </p>
        </div>
        <label className="ml-auto w-full min-w-0 md:w-56">
          <span className="sr-only">Filter by client</span>
          <Select
            value={clientId}
            onChange={(event) => setClient(event.target.value)}
            aria-label="Filter by client"
            className="w-full"
          >
            <option value="">All</option>
            {scope.hasIndependentResponses ? (
              <option value={NONE_CLIENT}>Independent forms</option>
            ) : null}
            {scope.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {data.responseCount === 0 ? (
        <p className="app-radius border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted">
          {data.selectedClientId
            ? `No submitted responses for ${data.selectedClientName} in this period yet.`
            : "No submitted responses yet. Publish a form and collect the first one."}
        </p>
      ) : (
        <>
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <OverallRatingsCard data={data} />
            <ResourceAverageCard data={data} />
          </div>

          <TrendCard points={data.trends} period={tablePeriod} />

          {data.questions.length > 0 ? (
            <QuestionRatingsCard
              rows={visibleQuestions}
              total={data.questions.length}
              search={questionSearch}
              onSearchChange={setQuestionSearch}
              sortSelection={questionSortSelection}
              onSortChange={(value) => applyTableSort(value, "question")}
            />
          ) : null}

          {data.resources.length > 0 ? (
            <ResourceCard
              rows={visibleResources}
              total={data.resources.length}
              search={resourceSearch}
              onSearchChange={setResourceSearch}
              sortSelection={resourceSortSelection}
              onSortChange={(value) => applyTableSort(value, "resource")}
            />
          ) : null}

          <SummariesCard comments={data.comments} />
        </>
      )}
    </section>
  );
}

function OverallRatingsCard({ data }: { data: AnalyticsSnapshot }) {
  return (
    <article className="card-enter app-radius border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center app-radius bg-accent/10 text-accent">
          <Star className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">Overall ratings</h2>
      </div>
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

function ResourceAverageCard({ data }: { data: AnalyticsSnapshot }) {
  function scrollToTable() {
    document.getElementById("resource-performance")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <article className="card-enter app-radius border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center app-radius bg-accent/10 text-accent">
          <Users className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">Resource average</h2>
      </div>
      {data.resourceCount === 0 ? (
        <p className="mt-4 text-sm text-muted">No resource ratings in this view.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="shrink-0 text-center sm:w-36">
            <p className="text-5xl font-semibold tracking-tight tabular-nums">
              {formatScore(data.resourceAverage)}
            </p>
            <StarRow score={data.resourceAverage ?? 0} className="mt-2 justify-center" />
            <p className="mt-2 text-xs text-muted">
              <button
                type="button"
                onClick={scrollToTable}
                className="font-medium text-accent underline-offset-2 transition hover:text-accent-hover hover:underline"
              >
                {pluralize(data.resourceCount, "rating")}
              </button>
            </p>
          </div>
          <DistributionBars
            distribution={data.resourceDistribution}
            total={data.resourceCount}
          />
        </div>
      )}
    </article>
  );
}

function InsightsTableToolbar({
  search,
  onSearchChange,
  sortSelection,
  onSortChange,
  searchPlaceholder,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  sortSelection: InsightsTableSortOption | "";
  onSortChange: (value: InsightsTableSortOption) => void;
  searchPlaceholder: string;
}) {
  return (
    <div className="mt-5 flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-3">
      <label className="min-w-0 w-full flex-1">
        <span className="sr-only">{searchPlaceholder}</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full min-w-0 app-radius border border-border bg-surface px-3 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="w-full min-w-0 md:ml-auto md:w-52 md:shrink-0">
        <span className="sr-only">Sort table</span>
        <Select
          value={sortSelection}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) return;
            onSortChange(next as InsightsTableSortOption);
          }}
          aria-label="Sort table"
          className="w-full"
        >
          <SortByOption />
          {INSIGHTS_TABLE_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}

function TrendCard({
  points,
}: {
  points: TrendPoint[];
  period: AnalyticsSnapshot["selectedPeriod"];
}) {
  const chartPoints = points;
  const scored = chartPoints.filter((point) => point.average != null);
  const latest = scored.at(-1);
  const previous = scored.at(-2);
  const delta =
    latest?.average != null && previous?.average != null
      ? latest.average - previous.average
      : null;

  return (
    <article className="card-enter app-radius border border-border bg-card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Historical trends</h2>
          <p className="mt-1 text-sm text-muted">
            Last 12 months of combined scores and submissions by month.
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-2">
          <TrendStat
            title="Latest month score"
            value={latest ? `${formatScore(latest.average)} / 5` : "—"}
            detail={
              latest
                ? `${latest.label} · ${pluralize(latest.responses, "form submitted", "forms submitted")}`
                : "No scored month in this period yet"
            }
            delta={delta}
          />
          <TrendStat
            title="Month-over-month change"
            value={
              delta == null
                ? "—"
                : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} pts`
            }
            detail={
              delta == null
                ? previous
                  ? "Not enough data to compare months"
                  : "Need two scored months to compare"
                : previous && latest
                  ? `${formatScore(previous.average)} in ${previous.label} → ${formatScore(latest.average)} in ${latest.label}`
                  : "Compared to the previous scored month"
            }
            delta={delta}
          />
        </div>
      </div>
      {chartPoints.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Not enough history to chart yet.</p>
      ) : (
        <div className="mt-4">
          <TrendChart points={chartPoints} />
        </div>
      )}
    </article>
  );
}

function TrendStat({
  title,
  value,
  detail,
  delta,
}: {
  title: string;
  value: string;
  detail?: string;
  delta?: number | null;
}) {
  const Icon =
    delta == null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="app-radius border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium text-muted">{title}</p>
      <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold tabular-nums tracking-tight">
        {value}
        {delta != null && delta !== 0 ? (
          <Icon
            className={cn(
              "h-4 w-4",
              delta > 0 ? "text-accent" : "text-red-600"
            )}
          />
        ) : null}
      </p>
      {detail ? (
        <p className="mt-1.5 text-xs leading-5 text-muted">{detail}</p>
      ) : null}
    </div>
  );
}

function QuestionRatingsCard({
  rows,
  total,
  search,
  onSearchChange,
  sortSelection,
  onSortChange,
}: {
  rows: RatingRow[];
  total: number;
  search: string;
  onSearchChange: (value: string) => void;
  sortSelection: InsightsTableSortOption | "";
  onSortChange: (value: InsightsTableSortOption) => void;
}) {
  return (
    <article className="card-enter app-radius border border-border bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">Question-wise ratings</h2>
      <p className="mt-1 text-sm text-muted">
        Average score per rating question. Matching labels across forms are combined.
      </p>
      <InsightsTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        sortSelection={sortSelection}
        onSortChange={onSortChange}
        searchPlaceholder="Search questions..."
      />
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          {total === 0 ? "No rating questions in this view." : "No questions match this search."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {rows.map((row) => (
            <li key={row.key} className="min-w-0 app-radius border border-border bg-surface px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate font-medium">{row.label}</p>
                <p className="shrink-0 tabular-nums text-sm font-semibold">
                  {formatScore(row.average)}
                  <span className="ml-1 font-normal text-muted">/ 5</span>
                </p>
              </div>
              <ScoreBar value={row.average} />
              {row.formCount > 1 ? (
                <p className="mt-1 text-xs text-muted">{row.formCount} forms</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function ResourceCard({
  rows,
  total,
  search,
  onSearchChange,
  sortSelection,
  onSortChange,
}: {
  rows: ResourceRow[];
  total: number;
  search: string;
  onSearchChange: (value: string) => void;
  sortSelection: InsightsTableSortOption | "";
  onSortChange: (value: InsightsTableSortOption) => void;
}) {
  return (
    <article
      id="resource-performance"
      className="card-enter app-radius border border-border bg-card p-6 scroll-mt-24"
    >
      <h2 className="text-lg font-semibold tracking-tight">Resource-wise performance</h2>
      <p className="mt-1 text-sm text-muted">
        People named on resource-rating questions in the selected period.
      </p>
      <InsightsTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        sortSelection={sortSelection}
        onSortChange={onSortChange}
        searchPlaceholder="Search by name..."
      />
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          {total === 0 ? "No resource ratings in this view." : "No names match this search."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[28rem] table-fixed text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="w-[10%] px-3 py-2 text-left font-medium">#</th>
                <th className="w-[42%] px-3 py-2 text-left font-medium">Name</th>
                <th className="w-[34%] px-3 py-2 text-left font-medium">Average</th>
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
                  <td className="px-3 py-3 align-middle text-center font-semibold tabular-nums">
                    {formatScore(row.average)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function SummariesCard({
  comments,
}: {
  comments: AnalyticsSnapshot["comments"];
}) {
  return (
    <article className="card-enter app-radius border border-border bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">Feedback summaries</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Showing the latest feedback from each client. To see every submission, go to the{" "}
        <Link href="/dashboard/responses" className="font-medium text-accent hover:text-accent-hover">
          responses
        </Link>{" "}
        screen.
      </p>
      {comments.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No written comments or suggestions in this view yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2">
          {comments.map((comment) => (
            <li key={comment.id}>
              <Link
                href={comment.href}
                className="flex h-full flex-col app-radius border border-border bg-surface p-4 transition hover:border-accent/30 hover:bg-hover"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center app-radius bg-accent/10 text-accent">
                    <SummaryIcon text={comment.text} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-3 text-sm leading-6">{comment.text}</p>
                    <dl className="mt-3 grid min-w-0 gap-1 text-xs text-muted">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{comment.clientName}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{comment.formTitle}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">
                          {formatMonthYear(comment.submittedAt)}
                        </span>
                      </div>
                    </dl>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function SummaryIcon({ text }: { text: string }) {
  const lower = text.toLowerCase();
  if (lower.includes("suggest") || lower.includes("improve")) {
    return <Lightbulb className="h-5 w-5" />;
  }
  if (lower.includes("?")) {
    return <MessageSquareText className="h-5 w-5" />;
  }
  return <TrendingUp className="h-5 w-5" />;
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

function trendPointTooltip(point: TrendPoint) {
  const countLabel =
    point.responses === 1
      ? "1 feedback submitted"
      : `${point.responses} feedback submitted`;
  if (point.average == null) {
    return `${point.label} · no average score (${countLabel})`;
  }
  return `${point.label} · average score ${formatScore(point.average)} (based on ${countLabel})`;
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  const width = 720;
  const height = 280;
  const pad = { l: 40, r: 20, t: 24, b: 48 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const maxResponses = Math.max(1, ...points.map((point) => point.responses));
  const x = (index: number) =>
    pad.l +
    (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const yScore = (value: number) =>
    pad.t + innerH - ((value - 1) / 4) * innerH;
  const barWidth = Math.min(20, innerW / Math.max(points.length, 1) / 2.4);

  const lineCoords = points
    .map((point, index) =>
      point.average == null ? null : { x: x(index), y: yScore(point.average), index }
    )
    .filter(Boolean) as Array<{ x: number; y: number; index: number }>;

  const line = lineCoords.map((point) => `${point.x},${point.y}`).join(" ");
  const area =
    lineCoords.length > 0
      ? `${line} ${lineCoords.at(-1)!.x},${pad.t + innerH} ${lineCoords[0].x},${pad.t + innerH}`
      : "";

  const labelEvery = points.length > 10 ? 2 : 1;

  return (
    <div className="app-radius border border-border bg-surface/50 p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-72 w-full"
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
              strokeDasharray={tick === 3 ? "4 4" : undefined}
            />
            <text
              x={pad.l - 10}
              y={yScore(tick) + 3}
              textAnchor="end"
              className="fill-muted text-[10px]"
            >
              {tick}
            </text>
          </g>
        ))}

        {points.map((point, index) => {
          const barH = (point.responses / maxResponses) * innerH * 0.42;
          return (
            <g key={`${point.key}-bar`}>
              <title>{trendPointTooltip(point)}</title>
              <rect
                x={x(index) - barWidth / 2}
                y={pad.t + innerH - barH}
                width={barWidth}
                height={barH}
                rx="4"
                className="fill-sage/35"
              />
              <rect
                x={x(index) - Math.max(barWidth, 18) / 2}
                y={pad.t}
                width={Math.max(barWidth, 18)}
                height={innerH}
                fill="transparent"
              />
            </g>
          );
        })}

        {area ? (
          <polygon points={area} className="fill-accent/10" />
        ) : null}

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

        {lineCoords.map((point) => (
          <g key={`${points[point.index].key}-dot`}>
            <title>{trendPointTooltip(points[point.index])}</title>
            <circle
              cx={point.x}
              cy={point.y}
              r="3.5"
              className="fill-accent"
            />
          </g>
        ))}

        {points.map((point, index) =>
          index % labelEvery === 0 ? (
            <text
              key={`${point.key}-label`}
              x={x(index)}
              y={height - 16}
              textAnchor="middle"
              className="fill-muted text-[10px]"
            >
              {point.label}
            </text>
          ) : null
        )}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Average score
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-sage/35" />
          Number of responses submitted
        </span>
      </div>
    </div>
  );
}
