import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="card-enter rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-sm font-medium uppercase tracking-wide text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "text-3xl font-semibold tracking-tight",
            eyebrow ? "mt-1" : ""
          ) as string}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-base text-muted">{description}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}
