/**
 * Lightweight data for the Summarize toolbar: client list + response count.
 * Intentionally does not load answers or call Gemini — keep filter changes cheap.
 */
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { formsAccessibleWhere } from "@/lib/forms";
import { getTeamsForUser } from "@/lib/teams";
import { NONE_CLIENT } from "@/lib/analytics-format";
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
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);
  const selectedPeriod = resolveSummaryPeriod(periodFilter);
  const startDate = periodStartDate(selectedPeriod);
  const clients = teamIds.length
    ? await prisma.client.findMany({
        where: { teamId: { in: teamIds } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

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

  const [responseCount, independent] = await Promise.all([
    prisma.response.count({
      where: {
        submittedAt: { gte: startDate },
        clientSurvey: { AND: [{ form: formAccess }, clientWhere] },
      },
    }),
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

  const selectedClientName =
    selected === NONE_CLIENT
      ? "Independent forms"
      : selected
        ? (clients.find((client) => client.id === selected)?.name ?? "Client")
        : "All responses";

  return {
    selectedClientId: selected,
    selectedClientName,
    selectedPeriod,
    clients,
    hasIndependentResponses: Boolean(independent),
    responseCount,
  };
}
