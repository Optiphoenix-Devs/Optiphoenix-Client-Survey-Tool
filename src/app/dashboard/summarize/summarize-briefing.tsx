"use client";

/**
 * Presentation for an already-generated `AiSummary`.
 * Keep this a client module so nested cards are not dropped by the RSC compiler.
 */
import {
  CheckCircle2,
  Lightbulb,
  MessageSquareText,
  Quote,
  Radar,
  Target,
} from "lucide-react";
import type { AiSummary } from "@/lib/ai-summary";
import { cn } from "@/lib/cn";

function clampShare(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value > 1) return Math.min(1, value / 100);
  return Math.max(0, Math.min(1, value));
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
        {label}
      </span>
      <span className="tabular-nums text-muted">{Math.round(value * 100)}%</span>
    </li>
  );
}

function SentimentDonut({
  positive,
  mixed,
  negative,
  overall,
  score,
  explanation,
}: {
  positive: number;
  mixed: number;
  negative: number;
  overall: string;
  score: number;
  explanation: string;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const segments = [
    { value: positive, color: "#10b981" },
    { value: mixed, color: "#f59e0b" },
    { value: negative, color: "#f43f5e" },
  ];
  let offset = 0;

  return (
    <div className="rounded-3xl border border-border bg-surface p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <MessageSquareText className="h-5 w-5 text-accent" />
        Sentiment
      </h3>
      <div className="mt-4 flex items-center gap-5">
        <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label="Sentiment donut">
          <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" className="text-hover" strokeWidth="16" />
          {segments.map((segment) => {
            const length = Math.max(0, segment.value) * c;
            const dashoffset = -offset * c;
            offset += Math.max(0, segment.value);
            return (
              <circle
                key={segment.color}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={segment.color}
                strokeWidth="16"
                strokeLinecap="butt"
                strokeDasharray={`${length} ${c}`}
                strokeDashoffset={dashoffset}
                transform="rotate(-90 70 70)"
              />
            );
          })}
          <text x="70" y="66" textAnchor="middle" className="fill-foreground text-[22px] font-semibold">
            {Math.round(Number.isFinite(score) && score > 1 ? score : score * 100)}
          </text>
          <text x="70" y="86" textAnchor="middle" className="fill-muted text-[10px] capitalize">
            {overall}
          </text>
        </svg>
        <ul className="min-w-0 space-y-2 text-sm">
          <LegendRow color="bg-emerald-500" label="Positive" value={positive} />
          <LegendRow color="bg-amber-400" label="Mixed" value={mixed} />
          <LegendRow color="bg-rose-400" label="Negative" value={negative} />
          <li className="pt-1 text-xs leading-5 text-muted">{explanation}</li>
        </ul>
      </div>
    </div>
  );
}

function PositiveFeedbackCard({
  items,
}: {
  items: Array<{ title: string; detail: string }>;
}) {
  return (
    <section className="rounded-3xl border border-emerald-200/70 bg-emerald-50/40 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            Positive feedback
          </h3>
          <p className="mt-1 text-sm text-muted">What clients are already praising.</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
          {items.length} highlight{items.length === 1 ? "" : "s"}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-5 text-sm text-muted">No strong positives for this cycle.</p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {items.map((item, index) => (
            <li
              key={`positive-${index}-${item.title}`}
              className="rounded-2xl border border-emerald-100 bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                  <Quote className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecurringThemesCard({
  items,
}: {
  items: AiSummary["themes"];
}) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Radar className="h-5 w-5 text-accent" />
            Recurring themes
          </h3>
          <p className="mt-1 text-sm text-muted">Patterns that keep showing up in comments.</p>
        </div>
        <span className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-semibold text-accent">
          {items.length} theme{items.length === 1 ? "" : "s"}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-5 text-sm text-muted">No recurring themes detected.</p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {items.map((theme, index) => (
            <li
              key={`theme-${index}-${theme.title}`}
              className={cn(
                "rounded-2xl border border-border bg-card p-4",
                theme.sentiment === "positive" && "border-l-4 border-l-emerald-500",
                theme.sentiment === "mixed" && "border-l-4 border-l-amber-400",
                theme.sentiment === "negative" && "border-l-4 border-l-rose-400",
                theme.sentiment === "neutral" && "border-l-4 border-l-sage"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{theme.title}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                    theme.sentiment === "positive" && "bg-emerald-50 text-emerald-900",
                    theme.sentiment === "mixed" && "bg-amber-50 text-amber-900",
                    theme.sentiment === "negative" && "bg-rose-50 text-rose-900",
                    theme.sentiment === "neutral" && "bg-hover text-muted"
                  )}
                >
                  {theme.sentiment}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted">{theme.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SummarizeBriefing({ summary }: { summary: AiSummary }) {
  const positive = clampShare(summary.sentiment.positiveShare);
  const mixed = clampShare(summary.sentiment.mixedShare);
  const negative = clampShare(summary.sentiment.negativeShare);
  const total = positive + mixed + negative || 1;
  const positives = summary.positives.slice(0, 4);
  const recommendations = summary.recommendations.slice(0, 4);
  const attention = summary.attention.slice(0, 5);
  const themes = summary.themes.slice(0, 4);
  const sourceLabel =
    summary.source === "gemini"
      ? "Gemini"
      : summary.source === "openai"
        ? "OpenAI"
        : "Local fallback";

  return (
    <article className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                AI briefing
              </p>
              <span className="rounded-full bg-sage/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {sourceLabel}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{summary.headline}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{summary.overview}</p>
            <p className="mt-4 text-sm text-muted">
              Scope: {summary.scope} · {summary.responseCount} responses ·{" "}
              {summary.commentCount} written comments
            </p>
          </div>
          <SentimentDonut
            positive={positive / total}
            mixed={mixed / total}
            negative={negative / total}
            overall={summary.sentiment.overall}
            score={summary.sentiment.score}
            explanation={summary.sentiment.explanation}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <PositiveFeedbackCard items={positives} />
          <RecurringThemesCard items={themes} />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-border bg-surface p-6 xl:col-span-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Lightbulb className="h-5 w-5 text-accent" />
              Actionable recommendations
            </h3>
            {recommendations.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No recommendations available.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {recommendations.map((item, index) => (
                  <li
                    key={`recommendation-${index}-${item.title}`}
                    className="flex gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sage/15 text-sm font-semibold text-accent">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">
                        {item.title}
                        <span
                          className={cn(
                            "ml-2 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                            item.priority === "high" && "bg-rose-50 text-rose-900",
                            item.priority === "medium" && "bg-hover text-muted",
                            item.priority === "low" && "bg-sage/15 text-accent"
                          )}
                        >
                          {item.priority}
                        </span>
                      </p>
                      <p className="text-sm leading-6 text-muted">{item.action}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Target className="h-5 w-5 text-accent" />
              Improvement areas
            </h3>
            {attention.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nothing urgent flagged in this cycle.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {attention.map((item, index) => {
                  const level = Math.max(28, 92 - index * 14);
                  return (
                    <li key={`attention-${index}-${item.kind}-${item.name}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">
                          {item.name}
                          <span className="ml-2 rounded-full bg-hover px-2 py-0.5 text-xs font-semibold text-muted capitalize">
                            {item.kind === "resource" ? "resource" : "area"}
                          </span>
                        </p>
                        <span className="text-xs tabular-nums text-muted">{level}%</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.reason}</p>
                      <div className="mt-1 h-2 rounded-full bg-hover">
                        <div className="h-2 rounded-full bg-accent" style={{ width: `${level}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
