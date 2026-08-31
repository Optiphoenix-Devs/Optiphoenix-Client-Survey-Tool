import { formatScore } from "@/lib/analytics-format";
import type { ClientPerformanceRow } from "@/lib/analytics-format";

const BANDS = [
  { key: "strong", label: "Strong (4.0+)", color: "#10b981" },
  { key: "steady", label: "Steady (3.0–3.9)", color: "#f59e0b" },
  { key: "attention", label: "Needs attention (<3)", color: "#f43f5e" },
] as const;

function bandFor(average: number) {
  if (average >= 4) return "strong";
  if (average >= 3) return "steady";
  return "attention";
}

export function ClientPerformanceChart({
  overallAverage,
  overallCount,
  clients,
}: {
  overallAverage: number | null;
  overallCount: number;
  clients: ClientPerformanceRow[];
}) {
  const totals = { strong: 0, steady: 0, attention: 0 };
  for (const client of clients) {
    totals[bandFor(client.average)] += client.count;
  }
  const total = totals.strong + totals.steady + totals.attention || 1;
  const slices = BANDS.map((band) => ({
    ...band,
    value: totals[band.key] / total,
    count: totals[band.key],
  })).filter((slice) => slice.count > 0);

  return (
    <article className="card-enter app-radius border border-border bg-card app-shadow-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted">Client satisfaction</h2>
          <p className="mt-0.5 text-xs text-muted">How accounts are performing overall.</p>
        </div>
        <p className="text-xl font-semibold tracking-tight tabular-nums">
          {formatScore(overallAverage)}
          <span className="ml-1 text-xs font-normal text-muted">/ 5</span>
        </p>
      </div>

      {clients.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No ratings yet.</p>
      ) : (
        <div className="mt-3 flex items-center gap-5">
          <SatisfactionPie slices={slices} score={overallAverage} />
          <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
            {BANDS.map((band) => (
              <li key={band.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: band.color }} />
                  {band.label}
                </span>
                <span className="tabular-nums text-muted">
                  {Math.round((totals[band.key] / total) * 100)}%
                </span>
              </li>
            ))}
            <li className="pt-1 text-xs text-muted">{overallCount} scores across clients</li>
          </ul>
        </div>
      )}
    </article>
  );
}

function SatisfactionPie({
  slices,
  score,
}: {
  slices: Array<{ color: string; value: number }>;
  score: number | null;
}) {
  const cx = 48;
  const cy = 48;
  const radius = 42;
  const initialAngle = -Math.PI / 2;
  const { paths } = slices.reduce(
    (acc, slice) => {
      const sweep = Math.max(slice.value, 0) * Math.PI * 2;
      const start = acc.angle;
      const end = start + sweep;
      return {
        angle: end,
        paths: [
          ...acc.paths,
          {
            ...slice,
            d: pieSlice(cx, cy, radius, start, end),
            full: slice.value >= 0.999,
          },
        ],
      };
    },
    { angle: initialAngle, paths: [] as Array<{ color: string; value: number; d: string; full: boolean }> }
  );

  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24 shrink-0" role="img" aria-label="Satisfaction mix">
      {paths.map((slice) =>
        slice.full ? (
          <circle key={slice.color} cx={cx} cy={cy} r={radius} fill={slice.color} />
        ) : (
          <path key={slice.color} d={slice.d} fill={slice.color} />
        )
      )}
      <circle cx={cx} cy={cy} r="22" className="fill-card" />
      <text x={cx} y={cy + 4} textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
        {formatScore(score)}
      </text>
    </svg>
  );
}

function pieSlice(cx: number, cy: number, r: number, start: number, end: number) {
  const large = end - start > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}
