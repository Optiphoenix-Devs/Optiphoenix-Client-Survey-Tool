/**
 * Lightweight data for the Summarize toolbar: client list + response count.
 * Intentionally does not load answers or call Gemini — keep filter changes cheap.
 */
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { formsAccessibleWhere } from "@/lib/forms";
import { getTeamsForUser } from "@/lib/teams";
import { NONE_CLIENT } from "@/lib/analytics-format";
import { resolveAnalyticsClient } from "@/lib/analytics-scope";
import {
  periodStartDate,
  resolveSummaryPeriod,
  type SummaryPeriod,
} from "@/lib/summary-period";

export type SummarizeScope = {
  selectedClientId: string;
  selectedClientName: string;
  selectedPeriod: SummaryPeriod;
  clients: Array<{ id: string; name: string }>;
  hasIndependentResponses: boolean;
  responseCount: number;
};

export async function getSummarizeScope(
  userId: string,
  role: UserRole,
  clientFilter?: string,
  periodFilter?: string
): Promise<SummarizeScope> {
  const selectedPeriod = resolveSummaryPeriod(periodFilter);
  const startDate = periodStartDate(selectedPeriod);
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);

  const [clients, independent] = await Promise.all([
    teamIds.length
      ? prisma.client.findMany({
          where: { teamId: { in: teamIds } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    prisma.response.findFirst({
      where: {
        submittedAt: { gte: startDate },
        clientSurvey: {
          form: formAccess,
          AND: [{ clientId: null }, { form: { clientId: null } }],
        },
      },
      select: { id: true },
    }),
  ]);

  const hasIndependentResponses = Boolean(independent);
  const resolved = resolveAnalyticsClient(
    clientFilter,
    clients,
    hasIndependentResponses
  );
  const selected = resolved.id;

  const clientWhere =
    selected === NONE_CLIENT
      ? { AND: [{ clientId: null }, { form: { clientId: null } }] }
      : selected
        ? {
            OR: [{ clientId: selected }, { form: { clientId: selected } }],
          }
        : {};

  const responseCount = await prisma.response.count({
    where: {
      submittedAt: { gte: startDate },
      clientSurvey: { AND: [{ form: formAccess }, clientWhere] },
    },
  });

  return {
    selectedClientId: selected,
    selectedClientName: resolved.name,
    selectedPeriod,
    clients,
    hasIndependentResponses,
    responseCount,
  };
}
