import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

export async function getDashboardOverview(userId: string, role: UserRole) {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);

  if (teamIds.length === 0) {
    return {
      teams,
      teamCount: 0,
      clientCount: 0,
      formCount: 0,
      publishedCount: 0,
      responseCount: 0,
    };
  }

  const [clientCount, formCount, publishedCount, responseCount] =
    await Promise.all([
      prisma.client.count({ where: { teamId: { in: teamIds } } }),
      prisma.form.count({ where: { teamId: { in: teamIds } } }),
      prisma.form.count({
        where: { teamId: { in: teamIds }, status: "PUBLISHED" },
      }),
      prisma.response.count({
        where: { clientSurvey: { form: { teamId: { in: teamIds } } } },
      }),
    ]);

  return {
    teams,
    teamCount: teams.length,
    clientCount,
    formCount,
    publishedCount,
    responseCount,
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

export async function createTeamForUser(userId: string, name: string) {
  return prisma.team.create({
    data: {
      name,
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

  return prisma.team.update({
    where: { id: teamId },
    data: { name },
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
