import type { SummaryPeriod } from "@/lib/summary-period";
import type { RatingRow, ResourceRow } from "@/lib/analytics-format";
import { matchesDirectorySearch } from "@/lib/directory-search";

export const INSIGHTS_PERIOD_SORTS = [
  "monthly",
  "quarterly",
  "half-year",
  "yearly",
] as const;

export const INSIGHTS_NAME_SORTS = ["name-asc", "name-desc"] as const;
export const INSIGHTS_SCORE_SORTS = ["score-asc", "score-desc"] as const;

export type InsightsPeriodSort = (typeof INSIGHTS_PERIOD_SORTS)[number];
export type InsightsNameSort = (typeof INSIGHTS_NAME_SORTS)[number];
export type InsightsScoreSort = (typeof INSIGHTS_SCORE_SORTS)[number];
export type InsightsRowSort = InsightsNameSort | InsightsScoreSort;

export type InsightsTableSortOption =
  | InsightsPeriodSort
  | InsightsRowSort;

export const INSIGHTS_TABLE_SORT_OPTIONS: Array<{
  value: InsightsTableSortOption;
  label: string;
  kind: "period" | "sort";
}> = [
  { value: "monthly", label: "Last month", kind: "period" },
  { value: "quarterly", label: "Last quarter", kind: "period" },
  { value: "half-year", label: "Last 6 months", kind: "period" },
  { value: "yearly", label: "Last year", kind: "period" },
  { value: "name-asc", label: "a–z", kind: "sort" },
  { value: "name-desc", label: "A–Z", kind: "sort" },
  { value: "score-asc", label: "Ascending", kind: "sort" },
  { value: "score-desc", label: "Descending", kind: "sort" },
];

export function isInsightsPeriodSort(
  value: string
): value is InsightsPeriodSort {
  return (INSIGHTS_PERIOD_SORTS as readonly string[]).includes(value);
}

export function sortResourceRows(
  rows: ResourceRow[],
  sort: InsightsRowSort,
  query: string
) {
  const filtered = query.trim()
    ? rows.filter((row) => matchesDirectorySearch(query, [row.name]))
    : rows;

  return [...filtered].sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    if (sort === "score-asc") return a.average - b.average || a.name.localeCompare(b.name);
    return b.average - a.average || a.name.localeCompare(b.name);
  });
}

export function sortQuestionRows(
  rows: RatingRow[],
  sort: InsightsRowSort,
  query: string
) {
  const filtered = query.trim()
    ? rows.filter((row) => matchesDirectorySearch(query, [row.label]))
    : rows;

  return [...filtered].sort((a, b) => {
    if (sort === "name-asc") return a.label.localeCompare(b.label);
    if (sort === "name-desc") return b.label.localeCompare(a.label);
    if (sort === "score-asc") return a.average - b.average || a.label.localeCompare(b.label);
    return b.average - a.average || a.label.localeCompare(b.label);
  });
}

export function resolveInsightsRowSort(value: string): InsightsRowSort {
  if (value === "name-asc" || value === "name-desc") return value;
  if (value === "score-asc" || value === "score-desc") return value;
  return "score-desc";
}

export function periodFromInsightsSort(value: string): SummaryPeriod | null {
  return isInsightsPeriodSort(value) ? value : null;
}
