"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  MessageSquareText,
  Radar,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/cn";

type ConceptId = "executive" | "operations" | "studio";

const concepts: Array<{
  id: ConceptId;
  label: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: "executive",
    label: "Concept A",
    title: "Executive Insight",
    subtitle: "High-level storytelling for leadership updates.",
  },
  {
    id: "operations",
    label: "Concept B",
    title: "Operations Command",
    subtitle: "Task-first layout for teams that act fast.",
  },
  {
    id: "studio",
    label: "Concept C",
    title: "Summary Studio",
    subtitle: "Balanced and calm layout for monthly reporting.",
  },
];

export function SummarizeDesignPreview() {
  const [active, setActive] = useState<ConceptId>("executive");
  const concept = useMemo(() => concepts.find((item) => item.id === active)!, [active]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Summarize design preview</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Pick a direction first, then I will convert the selected concept into the final
            production summarize screen.
          </p>
        </div>
        <Link
          href="/dashboard/summarize"
          className="inline-flex items-center app-btn-secondary px-4 py-2 text-sm"
        >
          Back to summarize
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 app-radius border border-border bg-card p-2">
        {concepts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              active === item.id
                ? "app-brand-surface"
                : "border border-border bg-surface text-foreground app-brand-hover"
            )}
          >
            {item.label}: {item.title}
          </button>
        ))}
      </div>

      <article className="overflow-hidden app-radius border border-border bg-card">
        <header className="border-b border-border bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{concept.label}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{concept.title}</h2>
          <p className="mt-1 text-sm text-muted">{concept.subtitle}</p>
        </header>
        <div className="p-6">{active === "executive" ? <ExecutiveConcept /> : null}</div>
        <div className="p-6 pt-0">{active === "operations" ? <OperationsConcept /> : null}</div>
        <div className="p-6 pt-0">{active === "studio" ? <StudioConcept /> : null}</div>
      </article>
    </section>
  );
}

function ExecutiveConcept() {
  return (
    <div className="space-y-4">
      <div className="app-radius border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">AI executive brief</p>
        <p className="mt-2 text-base leading-7">
          Customer satisfaction is stable, but recurring delivery delays are increasing for two key
          accounts. Sentiment remains mostly positive, with urgency around coordination and response
          speed.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric title="Responses analyzed" value="1,204" hint="+11% vs last cycle" />
          <Metric title="Positive sentiment" value="67%" hint="Mixed 22% · Negative 11%" />
          <Metric title="Urgent attention flags" value="5" hint="2 resources · 3 process areas" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <InsightCard
          icon={CheckCircle2}
          title="Positive feedback"
          tone="positive"
          items={[
            "Fast onboarding support was repeatedly praised by new clients.",
            "Team responsiveness during issue escalation stood out in comments.",
            "Survey respondents value proactive progress updates each week.",
          ]}
        />
        <InsightCard
          icon={AlertTriangle}
          title="Pain points and recurring themes"
          tone="warning"
          items={[
            "Delayed status visibility appears in 38% of negative comments.",
            "Handover confusion between teams is a repeated friction pattern.",
            "Expectation mismatch around delivery scope is increasing monthly.",
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecommendationPanel />
        <SentimentPanel />
      </div>
    </div>
  );
}

function OperationsConcept() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <Metric title="AI-ready surveys" value="18/20" hint="2 need more written comments" />
        <Metric title="Detected pain clusters" value="7" hint="Top: handover, timeline" />
        <Metric title="Actionable tasks" value="12" hint="5 high priority" />
        <Metric title="Sentiment score" value="+56" hint="Positive trend this month" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="app-radius border border-border bg-surface p-5 xl:col-span-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Lightbulb className="h-5 w-5 text-accent" />
            Action recommendations
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["High", "Assign a single owner for client handover updates."],
              ["High", "Introduce weekly scope confirmation note after meetings."],
              ["Medium", "Add auto-summary to Friday team sync digest."],
              ["Low", "Publish success stories from top-rated projects monthly."],
            ].map(([priority, text]) => (
              <li key={text} className="flex items-start gap-3 app-radius border border-border bg-card p-3">
                <span className="rounded-full bg-hover px-2 py-0.5 text-xs font-semibold">{priority}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="app-radius border border-border bg-surface p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Target className="h-5 w-5 text-accent" />
            Attention map
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Delivery planning", 86],
              ["Cross-team handover", 78],
              ["Escalation response", 59],
              ["Expectation alignment", 51],
            ].map(([name, level]) => (
              <li key={String(name)}>
                <div className="flex items-center justify-between">
                  <span>{name}</span>
                  <span className="tabular-nums text-muted">{String(level)}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-hover">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${String(level)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="app-radius border border-border bg-surface p-5">
        <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <MessageSquareText className="h-5 w-5 text-accent" />
          Sentiment analysis for written feedback
        </h3>
        <p className="mt-2 text-sm text-muted">
          AI identified confidence-weighted sentiment from open comments and matched it against
          recurring topics.
        </p>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-hover">
          <span className="bg-emerald-500" style={{ width: "61%" }} />
          <span className="bg-amber-400" style={{ width: "24%" }} />
          <span className="bg-rose-400" style={{ width: "15%" }} />
        </div>
      </div>
    </div>
  );
}

function StudioConcept() {
  return (
    <div className="space-y-4">
      <div className="app-radius border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Monthly summary story</h3>
            <p className="mt-1 text-sm text-muted">
              AI-generated narrative highlighting strengths, friction, and where to focus next.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Confidence 92%
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InsightCard
          icon={CheckCircle2}
          title="Positive signals"
          tone="positive"
          items={["Support quality", "Onboarding clarity", "Knowledge depth"]}
        />
        <InsightCard
          icon={AlertTriangle}
          title="Pain patterns"
          tone="warning"
          items={["Timeline uncertainty", "Cross-team dependency delays", "Unclear deliverable scope"]}
        />
        <InsightCard
          icon={Radar}
          title="Recurring themes"
          tone="neutral"
          items={["Communication cadence", "Ownership visibility", "Follow-up speed"]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecommendationPanel />
        <div className="app-radius border border-border bg-surface p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <TrendingUp className="h-5 w-5 text-accent" />
            Resource and area attention
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Resource: Delivery coordinator", "Repeated mentions for slower updates."],
              ["Area: Scope planning", "Comments indicate scope is not explicit enough."],
              ["Resource: Escalation owner", "Needs faster handoff in peak weeks."],
            ].map(([title, detail]) => (
              <li key={title} className="app-radius border border-border bg-card p-3">
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-muted">{detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="app-radius border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  tone,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone: "positive" | "warning" | "neutral";
  items: string[];
}) {
  return (
    <div className="app-radius border border-border bg-surface p-5">
      <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <Icon
          className={cn(
            "h-5 w-5",
            tone === "positive" && "text-emerald-600",
            tone === "warning" && "text-amber-600",
            tone === "neutral" && "text-accent"
          )}
        />
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {items.map((item) => (
          <li key={item} className="app-radius border border-border bg-card px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationPanel() {
  return (
    <div className="app-radius border border-border bg-surface p-5">
      <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <Lightbulb className="h-5 w-5 text-accent" />
        Actionable recommendations
      </h3>
      <ol className="mt-4 space-y-3 text-sm">
        <li className="app-radius border border-border bg-card p-3">
          <p className="font-medium">Clarify timeline ownership for each client touchpoint.</p>
          <p className="mt-1 text-muted">Expected impact: fewer delay-related complaints.</p>
        </li>
        <li className="app-radius border border-border bg-card p-3">
          <p className="font-medium">Add 48-hour follow-up rule for unresolved feedback.</p>
          <p className="mt-1 text-muted">Expected impact: improved trust and responsiveness.</p>
        </li>
        <li className="app-radius border border-border bg-card p-3">
          <p className="font-medium">Share monthly wins from high-rated delivery teams.</p>
          <p className="mt-1 text-muted">Expected impact: reinforce repeatable best practices.</p>
        </li>
      </ol>
    </div>
  );
}

function SentimentPanel() {
  return (
    <div className="app-radius border border-border bg-surface p-5">
      <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <MessageSquareText className="h-5 w-5 text-accent" />
        Sentiment analysis
      </h3>
      <p className="mt-2 text-sm text-muted">
        Written feedback is parsed by AI to determine tone, confidence, and emotional trajectory.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="app-radius border border-border bg-card p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Positive</p>
          <p className="mt-1 text-xl font-semibold text-emerald-600">68%</p>
        </div>
        <div className="app-radius border border-border bg-card p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Mixed</p>
          <p className="mt-1 text-xl font-semibold text-amber-600">21%</p>
        </div>
        <div className="app-radius border border-border bg-card p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Negative</p>
          <p className="mt-1 text-xl font-semibold text-rose-600">11%</p>
        </div>
      </div>
    </div>
  );
}
