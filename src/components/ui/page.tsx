import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  className,
  iconClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={cn("card-enter h-full app-radius border border-border bg-card app-shadow-card p-6", className)}>
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold tracking-tight">{label}</h3>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? (
            <p className="mt-4 truncate text-sm text-muted" title={hint}>
              {hint}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center app-radius bg-accent/10 text-accent",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
