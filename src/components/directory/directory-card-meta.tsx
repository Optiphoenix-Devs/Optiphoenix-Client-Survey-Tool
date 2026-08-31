import { columnLabel } from "@/lib/format";

export function DirectoryCardLine({
  label,
  value,
  title,
}: {
  label: string;
  value: string | number;
  title?: string;
}) {
  return (
    <p className="truncate text-sm" title={title}>
      <span className="text-muted">{label}:</span>{" "}
      <span className="font-medium text-foreground">{value}</span>
    </p>
  );
}

export function CountCardLine({
  count,
  singular,
  plural,
}: {
  count: number;
  singular: string;
  plural?: string;
}) {
  return (
    <DirectoryCardLine label={columnLabel(count, singular, plural)} value={count} />
  );
}
