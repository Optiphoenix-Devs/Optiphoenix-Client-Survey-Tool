export function formatRelativeTime(value: string | Date) {
  return formatMonthYear(value);
}

/** Short “2h ago” style label for resume / activity rows. */
export function formatTimeAgo(value: string | Date, now = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  if (seconds < 3600) {
    const mins = Math.max(1, Math.round(seconds / 60));
    return `${mins}m ago`;
  }
  if (seconds < 86_400) {
    const hours = Math.max(1, Math.round(seconds / 3600));
    return `${hours}h ago`;
  }
  if (seconds < 86_400 * 7) {
    const days = Math.max(1, Math.round(seconds / 86_400));
    return `${days}d ago`;
  }
  return formatMonthYear(date);
}

export function formatMonthYear(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count > 1 ? plural : singular}`;
}

export function columnLabel(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}
