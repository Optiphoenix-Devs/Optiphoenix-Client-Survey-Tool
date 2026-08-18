/**
 * Time windows for the Summarize filters.
 * `monthly` = last 30 days from today, not a calendar month.
 */
export const SUMMARY_PERIODS = ["monthly", "quarterly", "half-year", "yearly"] as const;

export type SummaryPeriod = (typeof SUMMARY_PERIODS)[number];

export function resolveSummaryPeriod(value?: string): SummaryPeriod {
  return SUMMARY_PERIODS.includes(value as SummaryPeriod)
    ? (value as SummaryPeriod)
    : "monthly";
}

export function summaryPeriodLabel(period: SummaryPeriod) {
  if (period === "monthly") return "Monthly";
  if (period === "quarterly") return "Quarterly";
  if (period === "half-year") return "Last 6 months";
  return "Last 1 year";
}

export function periodStartDate(period: SummaryPeriod, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "monthly") {
    start.setMonth(start.getMonth() - 1);
    return start;
  }
  if (period === "quarterly") {
    start.setMonth(start.getMonth() - 3);
    return start;
  }
  if (period === "half-year") {
    start.setMonth(start.getMonth() - 6);
    return start;
  }
  start.setFullYear(start.getFullYear() - 1);
  return start;
}
