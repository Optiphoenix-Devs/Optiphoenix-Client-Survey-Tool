import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { RATING_SCALE } from "@/lib/question-types";

function parseRatingScore(value: string) {
  const score = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(score)) return 0;
  return Math.min(5, Math.max(0, score));
}

export function RatingStarsDisplay({
  score,
  size = "md",
  className,
}: {
  score: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const value = Math.min(5, Math.max(0, Math.round(score)));

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label={`${value} out of 5 stars`}
    >
      {RATING_SCALE.map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;
        return (
          <Star
            key={starValue}
            className={cn(
              iconClass,
              filled ? "fill-sage text-sage" : "fill-transparent text-border"
            )}
            strokeWidth={1.6}
          />
        );
      })}
    </div>
  );
}

export function AnswerDisplay({
  type,
  value,
  display,
}: {
  type: string;
  value: string;
  display: string;
}) {
  if (type === "RATING") {
    return <RatingStarsDisplay score={parseRatingScore(value)} />;
  }

  if (type === "RESOURCE_RATING") {
    try {
      const rows = JSON.parse(value.trim()) as Array<{ name?: string; score?: string }>;
      if (!Array.isArray(rows) || rows.length === 0) {
        return <p className="text-sm font-normal leading-6 text-muted">—</p>;
      }

      return (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${row.name ?? "resource"}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3 first:border-t-0 first:pt-0"
            >
              <p className="min-w-28 text-sm font-normal">{row.name ?? "Name"}</p>
              <RatingStarsDisplay score={parseRatingScore(row.score ?? "")} size="sm" />
            </div>
          ))}
        </div>
      );
    } catch {
      return <p className="text-sm font-normal leading-6 text-foreground whitespace-pre-wrap">{display}</p>;
    }
  }

  return (
    <p className="text-sm font-normal leading-6 text-foreground whitespace-pre-wrap">{display || "—"}</p>
  );
}
