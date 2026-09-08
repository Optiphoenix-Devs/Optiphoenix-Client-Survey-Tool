import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type KpiAccent = "emerald" | "sky" | "indigo" | "amber" | "violet";

const ACCENT: Record<KpiAccent, string> = {
  emerald:
    "bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-500/30",
  sky: "bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-500/30",
  indigo:
    "bg-indigo-100 text-indigo-800 ring-indigo-600/20 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-500/30",
  amber:
    "bg-amber-100 text-amber-900 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-500/30",
  violet:
    "bg-violet-100 text-violet-800 ring-violet-600/20 dark:bg-violet-950/60 dark:text-violet-200 dark:ring-violet-500/30",
};

export type KpiCardProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint: string;
  cta: string;
  accent: KpiAccent;
  badge?: React.ReactNode;
  delayMs?: number;
};

export function KpiCard({
  href,
  icon: Icon,
  label,
  value,
  hint,
  cta,
  accent,
  badge,
  delayMs = 0,
}: KpiCardProps) {
  return (
    <Link
      href={href}
      className="card-enter group relative flex flex-col justify-between overflow-hidden app-radius border border-border bg-card p-6 app-shadow-card transition hover:border-brand/40"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "grid h-10 w-10 place-items-center app-radius ring-1",
              ACCENT[accent]
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          {badge ?? null}
        </div>
        <h3 className="mt-4 text-sm font-medium text-muted">{label}</h3>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted">
        <span className="truncate">{hint}</span>
        <span className="inline-flex shrink-0 items-center font-medium text-brand group-hover:underline">
          {cta}
          <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function KpiBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "live" | "active";
}) {
  if (tone === "active") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    );
  }
  if (tone === "live") {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        {children}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-muted">
      {children}
    </span>
  );
}
