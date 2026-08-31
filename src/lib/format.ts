export function formatRelativeTime(value: string | Date) {
  return formatMonthYear(value);
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
