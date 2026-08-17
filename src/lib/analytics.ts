import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { formsAccessibleWhere } from "@/lib/forms";
import { getTeamsForUser } from "@/lib/teams";
import { getClientsForUser } from "@/lib/clients";
import { NONE_CLIENT } from "@/lib/analytics-format";
import type {
  AnalyticsSnapshot,
  ScoreDistribution,
  SummaryComment,
  TrendPoint,
} from "@/lib/analytics-format";

export type {
  AnalyticsClientOption,
  AnalyticsSnapshot,
  RatingRow,
  ResourceRow,
  ScoreDistribution,
  SummaryComment,
  TrendPoint,
} from "@/lib/analytics-format";
export { NONE_CLIENT, formatScore } from "@/lib/analytics-format";

type ParsedResource = { name: string; score: number | null };

export async function getAnalyticsForUser(
  userId: string,
  role: UserRole,
  clientFilter?: string
): Promise<AnalyticsSnapshot> {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);
  const clients = await getClientsForUser(userId, role);

  const selected =
    clientFilter === NONE_CLIENT
      ? NONE_CLIENT
      : clientFilter && clients.some((client) => client.id === clientFilter)
        ? clientFilter
        : "";

  const clientWhere =
    selected === NONE_CLIENT
      ? { AND: [{ clientId: null }, { form: { clientId: null } }] }
      : selected
        ? {
            OR: [{ clientId: selected }, { form: { clientId: selected } }],
          }
        : {};

  const rows = await prisma.response.findMany({
    where: {
      clientSurvey: {
        AND: [{ form: formAccess }, clientWhere],
      },
    },
    orderBy: { submittedAt: "asc" },
    include: {
      answers: {
        include: {
          question: { select: { id: true, type: true, label: true } },
        },
      },
      clientSurvey: {
        include: {
          form: {
            select: {
              id: true,
              title: true,
              clientId: true,
              client: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  const independentCount = await prisma.response.count({
    where: {
      clientSurvey: {
        form: formAccess,
        AND: [{ clientId: null }, { form: { clientId: null } }],
      },
    },
  });

  const overallDist = emptyDistribution();
  const overallScores: number[] = [];
  const combinedScores: number[] = [];
  const questionMap = new Map<
    string,
    {
      label: string;
      scores: number[];
      distribution: ScoreDistribution;
      formIds: Set<string>;
    }
  >();
  const resourceMap = new Map<
    string,
    { name: string; scores: number[]; distribution: ScoreDistribution }
  >();
  const monthMap = new Map<string, { scores: number[]; responses: number }>();
  const comments: SummaryComment[] = [];
  const formIds = new Set<string>();
  const clientIds = new Set<string>();

  for (const row of rows) {
    const form = row.clientSurvey.form;
    formIds.add(form.id);
    const clientName = form.client?.name ?? "Independent form";
    if (form.client?.id) clientIds.add(form.client.id);
    else if (row.clientSurvey.clientId) clientIds.add(row.clientSurvey.clientId);

    const monthKey = monthKeyFrom(row.submittedAt);
    const month = monthMap.get(monthKey) ?? { scores: [], responses: 0 };
    month.responses += 1;

    for (const answer of row.answers) {
      const type = answer.question.type;
      const value = answer.value.trim();

      if (type === "RATING") {
        const score = parseStar(value);
        if (score == null) continue;
        overallScores.push(score);
        combinedScores.push(score);
        bump(overallDist, score);
        month.scores.push(score);

        const key = normalizeLabel(answer.question.label);
        const question = questionMap.get(key) ?? {
          label: answer.question.label.trim() || "Rating",
          scores: [],
          distribution: emptyDistribution(),
          formIds: new Set<string>(),
        };
        question.scores.push(score);
        bump(question.distribution, score);
        question.formIds.add(form.id);
        questionMap.set(key, question);
      } else if (type === "RESOURCE_RATING") {
        for (const item of parseResourceRatings(value)) {
          if (item.score == null) continue;
          combinedScores.push(item.score);
          month.scores.push(item.score);
          const key = normalizeLabel(item.name);
          const resource = resourceMap.get(key) ?? {
            name: item.name,
            scores: [],
            distribution: emptyDistribution(),
          };
          resource.scores.push(item.score);
          bump(resource.distribution, item.score);
          resourceMap.set(key, resource);
        }
      } else if (
        (type === "SUGGESTION" ||
          type === "COMMENT" ||
          type === "LONG_TEXT") &&
        value
      ) {
        comments.push({
          id: `${row.id}-${answer.question.id}`,
          text: value,
          formTitle: form.title,
          clientName,
          submittedAt: row.submittedAt.toISOString(),
          href: `/dashboard/responses/${row.id}`,
        });
      }
    }

    monthMap.set(monthKey, month);
  }

  comments.sort(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt)
  );

  const selectedClientName =
    selected === NONE_CLIENT
      ? "Independent forms"
      : selected
        ? (clients.find((client) => client.id === selected)?.name ?? "Client")
        : "All responses";

  return {
    selectedClientId: selected,
    selectedClientName,
    clients: clients.map((client) => ({ id: client.id, name: client.name })),
    hasIndependentResponses: independentCount > 0,
    responseCount: rows.length,
    formCount: formIds.size,
    clientCount: clientIds.size,
    overall: {
      average: average(overallScores),
      count: overallScores.length,
      distribution: overallDist,
    },
    resourceAverage: average(
      [...resourceMap.values()].flatMap((item) => item.scores)
    ),
    resourceCount: [...resourceMap.values()].reduce(
      (sum, item) => sum + item.scores.length,
      0
    ),
    combinedAverage: average(combinedScores),
    combinedCount: combinedScores.length,
    questions: [...questionMap.values()]
      .map((item) => ({
        key: normalizeLabel(item.label),
        label: item.label,
        average: average(item.scores) ?? 0,
        count: item.scores.length,
        distribution: item.distribution,
        formCount: item.formIds.size,
      }))
      .sort((a, b) => b.average - a.average || b.count - a.count),
    resources: [...resourceMap.values()]
      .map((item) => ({
        name: item.name,
        average: average(item.scores) ?? 0,
        count: item.scores.length,
        distribution: item.distribution,
      }))
      .sort((a, b) => b.average - a.average || b.count - a.count),
    trends: buildTrend(monthMap),
    comments: comments.slice(0, 8),
  };
}

function emptyDistribution(): ScoreDistribution {
  return [0, 0, 0, 0, 0];
}

function bump(distribution: ScoreDistribution, score: number) {
  if (score >= 1 && score <= 5) distribution[score - 1] += 1;
}

function parseStar(value: string) {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 5) return null;
  return score;
}

function parseResourceRatings(value: string): ParsedResource[] {
  try {
    const rows = JSON.parse(value) as unknown;
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => {
      if (!row || typeof row !== "object") {
        return { name: "Name", score: null };
      }
      const record = row as { name?: unknown; score?: unknown };
      return {
        name: String(record.name ?? "Name").trim() || "Name",
        score: parseStar(String(record.score ?? "")),
      };
    });
  } catch {
    return [];
  }
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function average(scores: number[]) {
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function monthKeyFrom(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function buildTrend(monthMap: Map<string, { scores: number[]; responses: number }>) {
  if (monthMap.size === 0) return [] as TrendPoint[];

  const keys = [...monthMap.keys()].sort();
  const start = keys[0];
  const now = monthKeyFrom(new Date());
  const end = keys[keys.length - 1] > now ? keys[keys.length - 1] : now;
  const points: TrendPoint[] = [];

  for (const key of iterateMonths(start, end)) {
    const bucket = monthMap.get(key);
    points.push({
      key,
      label: monthLabel(key),
      average: bucket ? average(bucket.scores) : null,
      responses: bucket?.responses ?? 0,
    });
  }

  return points;
}

function iterateMonths(start: string, end: string) {
  const keys: string[] = [];
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}
