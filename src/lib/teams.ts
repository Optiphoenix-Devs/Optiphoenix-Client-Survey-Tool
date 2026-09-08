import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { TeamAccessLevel, UserRole } from "@/generated/prisma/client";
import { formsAccessibleWhere } from "@/lib/forms";

export type DashboardFormRow = {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  updatedAt: string;
  teamId: string;
  teamName: string;
  clientId: string;
  clientName: string;
  fieldCount: number;
  responseCount: number;
  href: string;
};

export type TeamListItem = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdByName: string;
  accessLevel: TeamAccessLevel;
  revokedAt: Date | null;
  isLocked: boolean;
  _count: { clients: number; forms: number; members: number };
};

export function accessLevelLabel(level: TeamAccessLevel) {
  if (level === "VIEW") return "View";
  if (level === "SHARE") return "Write";
  return "Full access";
}

/** Write (SHARE) or Full — can create/edit clients & forms. */
export function accessLevelCanWrite(level: TeamAccessLevel) {
  return level === "SHARE" || level === "FULL";
}

export async function getDashboardOverview(userId: string, role: UserRole) {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);

  const now = new Date();
  const windowStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const midpoint = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sparkStart = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  sparkStart.setHours(0, 0, 0, 0);

  const [
    clientCount,
    formCount,
    publishedCount,
    draftCount,
    closedCount,
    responseCount,
    userCount,
    recentResponseRows,
    trendRows,
    formRows,
  ] =
    await Promise.all([
      teamIds.length === 0
        ? Promise.resolve(0)
        : prisma.client.count({ where: { teamId: { in: teamIds } } }),
      prisma.form.count({ where: formAccess }),
      prisma.form.count({
        where: { AND: [formAccess, { status: "PUBLISHED" }] },
      }),
      prisma.form.count({
        where: { AND: [formAccess, { status: "DRAFT" }] },
      }),
      prisma.form.count({
        where: { AND: [formAccess, { status: "CLOSED" }] },
      }),
      prisma.response.count({
        where: { clientSurvey: { form: formAccess } },
      }),
      role === "ADMIN" ? prisma.user.count() : Promise.resolve(0),
      prisma.response.findMany({
        where: { clientSurvey: { form: formAccess } },
        orderBy: { submittedAt: "desc" },
        take: 6,
        select: {
          id: true,
          submittedAt: true,
          clientSurvey: {
            select: {
              form: { select: { id: true, title: true } },
              client: { select: { name: true } },
            },
          },
        },
      }),
      prisma.response.findMany({
        where: {
          clientSurvey: { form: formAccess },
          submittedAt: { gte: windowStart },
        },
        select: { submittedAt: true },
      }),
      prisma.form.findMany({
        where: formAccess,
        orderBy: { updatedAt: "desc" },
        include: {
          client: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          _count: { select: { questions: true } },
          surveys: { select: { _count: { select: { responses: true } } } },
        },
      }),
    ]);

  const forms: DashboardFormRow[] = formRows.map((form) => ({
    id: form.id,
    title: form.title,
    description: form.description,
    status: form.status,
    updatedAt: form.updatedAt.toISOString(),
    teamId: form.teamId ?? "",
    teamName: form.team?.name ?? "—",
    clientId: form.clientId ?? "",
    clientName: form.client?.name ?? "—",
    fieldCount: form._count.questions,
    responseCount: form.surveys.reduce(
      (sum, survey) => sum + survey._count.responses,
      0
    ),
    href:
      form.status === "CLOSED"
        ? `/dashboard/responses?form=${form.id}`
        : `/dashboard/forms/${form.id}`,
  }));

  const recentResponses = recentResponseRows.map((row) => ({
    id: row.id,
    submittedAt: row.submittedAt.toISOString(),
    formId: row.clientSurvey.form.id,
    formTitle: row.clientSurvey.form.title,
    clientName: row.clientSurvey.client?.name ?? "Independent",
  }));

  const responsesLast30 = trendRows.filter(
    (row) => row.submittedAt >= midpoint
  ).length;
  const responsesPrev30 = trendRows.length - responsesLast30;

  // 14-day daily buckets for the mini trend chart.
  const sparkline: { label: string; count: number }[] = [];
  for (let i = 0; i < 14; i += 1) {
    const day = new Date(sparkStart.getTime() + i * 24 * 60 * 60 * 1000);
    const next = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    sparkline.push({
      label: day.toISOString().slice(0, 10),
      count: trendRows.filter(
        (row) => row.submittedAt >= day && row.submittedAt < next
      ).length,
    });
  }

  return {
    teams,
    teamCount: teams.length,
    clientCount,
    formCount,
    publishedCount,
    draftCount,
    closedCount,
    responseCount,
    userCount,
    recentResponses,
    responsesLast30,
    responsesPrev30,
    sparkline,
    forms,
  };
}

/** Teams the user can open and work in (revoked memberships excluded). */
export const getTeamsForUser = cache(async function getTeamsForUser(
  userId: string,
  role: UserRole
): Promise<TeamListItem[]> {
  if (role === "ADMIN") {
    const teams = await prisma.team.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { clients: true, forms: true, members: true } },
      },
    });
    return teams.map((team) => {
      const { createdBy, ...rest } = team;
      return {
        ...rest,
        createdByName:
          team.createdById === userId ? "You" : createdBy.name || "Unknown",
        accessLevel: "FULL" as const,
        revokedAt: null,
        isLocked: false,
      };
    });
  }

  const memberships = await prisma.teamMembership.findMany({
    where: { userId, revokedAt: null },
    orderBy: { team: { createdAt: "desc" } },
    include: {
      team: {
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { clients: true, forms: true, members: true } },
        },
      },
    },
  });

  return memberships.map((membership) => {
    const { createdBy, ...team } = membership.team;
    return {
      ...team,
      createdByName:
        team.createdById === userId ? "You" : createdBy.name || "Unknown",
      accessLevel: membership.accessLevel,
      revokedAt: membership.revokedAt,
      isLocked: false,
    };
  });
});

/**
 * Teams shown on the directory — includes revoked ones (locked overlay).
 * Admins see every team unlocked.
 */
export const getVisibleTeamsForUser = cache(async function getVisibleTeamsForUser(
  userId: string,
  role: UserRole
): Promise<TeamListItem[]> {
  if (role === "ADMIN") {
    return getTeamsForUser(userId, role);
  }

  const memberships = await prisma.teamMembership.findMany({
    where: { userId },
    orderBy: { team: { createdAt: "desc" } },
    include: {
      team: {
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { clients: true, forms: true, members: true } },
        },
      },
    },
  });

  return memberships.map((membership) => {
    const { createdBy, ...team } = membership.team;
    return {
      ...team,
      createdByName:
        team.createdById === userId ? "You" : createdBy.name || "Unknown",
      accessLevel: membership.accessLevel,
      revokedAt: membership.revokedAt,
      isLocked: Boolean(membership.revokedAt),
    };
  });
});

async function getMembership(userId: string, teamId: string) {
  return prisma.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

/** Active membership with at least view rights. */
export async function userCanViewTeam(
  userId: string,
  role: UserRole,
  teamId: string
) {
  if (role === "ADMIN") {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    return Boolean(team);
  }

  const membership = await getMembership(userId, teamId);
  return Boolean(membership && !membership.revokedAt);
}

/**
 * Can create/edit clients, forms, survey links (Write or Full).
 * View-only members cannot mutate.
 */
export async function userCanManageTeam(
  userId: string,
  role: UserRole,
  teamId: string
) {
  if (role === "ADMIN") {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    return Boolean(team);
  }

  const membership = await getMembership(userId, teamId);
  if (!membership || membership.revokedAt) return false;
  return accessLevelCanWrite(membership.accessLevel);
}

/** Rename/delete team and other full-control actions. */
export async function userCanFullyManageTeam(
  userId: string,
  role: UserRole,
  teamId: string
) {
  if (role === "ADMIN") {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    return Boolean(team);
  }

  const membership = await getMembership(userId, teamId);
  if (!membership || membership.revokedAt) return false;
  return membership.accessLevel === "FULL";
}

export class UniqueNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UniqueNameError";
  }
}

export function isUniqueNameError(error: unknown): error is UniqueNameError {
  return (
    error instanceof UniqueNameError ||
    (error instanceof Error && error.name === "UniqueNameError")
  );
}

export function namesMatch(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

/** Sidebar badges on every dashboard page. Counts run in parallel after team IDs load. */
export async function getSidebarCounts(userId: string, role: UserRole) {
  const [activeTeams, visibleTeams] = await Promise.all([
    getTeamsForUser(userId, role),
    getVisibleTeamsForUser(userId, role),
  ]);
  const teamIds = activeTeams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);

  const [clientCount, formCount, responseCount, templateCount] = await Promise.all([
    teamIds.length === 0
      ? Promise.resolve(0)
      : prisma.client.count({ where: { teamId: { in: teamIds } } }),
    prisma.form.count({ where: formAccess }),
    prisma.response.count({
      where: { clientSurvey: { form: formAccess } },
    }),
    (async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      const email = user?.email?.trim().toLowerCase();
      const access =
        role === "ADMIN"
          ? {}
          : {
              OR: [
                { createdById: userId },
                {
                  shares: {
                    some: {
                      OR: [
                        { userId },
                        ...(email ? [{ email }] : []),
                      ],
                    },
                  },
                },
              ],
            };
      return prisma.formTemplate.count({
        where: {
          AND: [
            access,
            {
              OR: [
                { createdById: userId },
                { hides: { none: { userId } } },
              ],
            },
          ],
        },
      });
    })().catch(() => 0),
  ]);

  return {
    teamCount: visibleTeams.length,
    clientCount,
    formCount,
    responseCount,
    templateCount,
  };
}

export async function assertUniqueTeamName(
  userId: string,
  role: UserRole,
  name: string,
  excludeId?: string
) {
  const teams = await getTeamsForUser(userId, role);
  const taken = teams.some(
    (team) => team.id !== excludeId && namesMatch(team.name, name)
  );
  if (taken) {
    throw new UniqueNameError(
      `A team named "${name.trim()}" already exists.`
    );
  }
}

export async function createTeamForUser(
  userId: string,
  role: UserRole,
  name: string
) {
  await assertUniqueTeamName(userId, role, name);
  return prisma.team.create({
    data: {
      name: name.trim(),
      createdById: userId,
      members: {
        create: { userId, accessLevel: "FULL" },
      },
    },
  });
}

export async function updateTeamForUser(
  userId: string,
  role: UserRole,
  teamId: string,
  name: string
) {
  const allowed = await userCanFullyManageTeam(userId, role, teamId);
  if (!allowed) {
    throw new Error("You do not have access to this team.");
  }

  await assertUniqueTeamName(userId, role, name, teamId);

  return prisma.team.update({
    where: { id: teamId },
    data: { name: name.trim() },
  });
}

export async function deleteTeamForUser(
  userId: string,
  role: UserRole,
  teamId: string
) {
  const allowed = await userCanFullyManageTeam(userId, role, teamId);
  if (!allowed) {
    throw new Error("You do not have access to this team.");
  }

  return prisma.team.delete({
    where: { id: teamId },
  });
}
