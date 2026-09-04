import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { formsAccessibleWhere } from "@/lib/forms";
import { getTeamsForUser } from "@/lib/teams";
import { NONE_CLIENT } from "@/lib/analytics-format";
import type { AnalyticsClientOption } from "@/lib/analytics-format";

export type AnalyticsScope = {
  clients: AnalyticsClientOption[];
  hasIndependentResponses: boolean;
  defaultClientId: string;
  defaultClientName: string;
};

export function resolveAnalyticsClient(
  clientFilter: string | undefined,
  clients: AnalyticsClientOption[],
  hasIndependentResponses: boolean
) {
  if (clientFilter === "" || clientFilter === "all") {
    return { id: "", name: "All" };
  }
  if (clientFilter === NONE_CLIENT && hasIndependentResponses) {
    return { id: NONE_CLIENT, name: "Independent forms" };
  }
  if (clientFilter && clients.some((client) => client.id === clientFilter)) {
    return {
      id: clientFilter,
      name: clients.find((client) => client.id === clientFilter)!.name,
    };
  }
  if (clients[0]) {
    return { id: clients[0].id, name: clients[0].name };
  }
  if (hasIndependentResponses) {
    return { id: NONE_CLIENT, name: "Independent forms" };
  }
  return { id: "", name: "All" };
}

export async function getAnalyticsScope(
  userId: string,
  role: UserRole
): Promise<AnalyticsScope> {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);

  const clients = teamIds.length
    ? await prisma.client.findMany({
        where: { teamId: { in: teamIds } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const independent = await prisma.response.findFirst({
    where: {
      clientSurvey: {
        form: formAccess,
        AND: [{ clientId: null }, { form: { clientId: null } }],
      },
    },
    select: { id: true },
  });

  const hasIndependentResponses = Boolean(independent);
  const defaults = resolveAnalyticsClient(undefined, clients, hasIndependentResponses);

  return {
    clients,
    hasIndependentResponses,
    defaultClientId: defaults.id,
    defaultClientName: defaults.name,
  };
}
