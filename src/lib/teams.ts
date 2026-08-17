import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { formsAccessibleWhere } from "@/lib/forms";

export type DashboardFormRow = {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  teamId: string;
  teamName: string;
  clientId: string;
  clientName: string;
  fieldCount: number;
  responseCount: number;
  href: string;
};

export async function getDashboardOverview(userId: string, role: UserRole) {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);

  const [clientCount, formCount, publishedCount, responseCount, formRows] =
    await Promise.all([
      teamIds.length === 0
        ? Promise.resolve(0)
        : prisma.client.count({ where: { teamId: { in: teamIds } } }),
      prisma.form.count({ where: formAccess }),
      prisma.form.count({
        where: { AND: [formAccess, { status: "PUBLISHED" }] },
      }),
      prisma.response.count({
        where: { clientSurvey: { form: formAccess } },
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
    href: `/dashboard/forms/${form.id}`,
  }));

  return {
    teams,
    teamCount: teams.length,
    clientCount,
    formCount,
    publishedCount,
    draftCount: formCount - publishedCount,
    responseCount,
    forms,
  };
}

export async function getTeamsForUser(userId: string, role: UserRole) {
  if (role === "ADMIN") {
    return prisma.team.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { clients: true, forms: true, members: true } },
      },
    });
  }

  return prisma.team.findMany({
    where: {
      members: { some: { userId } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { clients: true, forms: true, members: true } },
    },
  });
}

export async function userCanManageTeam(
  userId: string,
  role: UserRole,
  teamId: string
) {
  if (role === "ADMIN") {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    return Boolean(team);
  }

  const membership = await prisma.teamMembership.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });

  return Boolean(membership);
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

export async function getSidebarCounts(userId: string, role: UserRole) {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);
  const clientCount =
    teamIds.length === 0
      ? 0
      : await prisma.client.count({ where: { teamId: { in: teamIds } } });
  const formCount = await prisma.form.count({ where: formAccess });
  const responseCount = await prisma.response.count({
    where: { clientSurvey: { form: formAccess } },
  });
  const templateCount = await prisma.formTemplate.count().catch(() => 0);

  return {
    teamCount: teams.length,
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
        create: { userId },
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
  const allowed = await userCanManageTeam(userId, role, teamId);
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
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) {
    throw new Error("You do not have access to this team.");
  }

  return prisma.team.delete({
    where: { id: teamId },
  });
}
