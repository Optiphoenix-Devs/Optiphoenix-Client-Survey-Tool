import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { userCanManageTeam } from "@/lib/teams";

export type ClientInput = {
  name: string;
  email?: string | null;
  company?: string | null;
};

export async function getTeamWithClients(
  userId: string,
  role: UserRole,
  teamId: string
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) {
    return null;
  }

  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      clients: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { forms: true } },
        },
      },
      _count: { select: { forms: true, members: true, clients: true } },
    },
  });
}

export async function createClientForTeam(
  userId: string,
  role: UserRole,
  teamId: string,
  data: ClientInput
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) {
    throw new Error("You do not have access to this team.");
  }

  return prisma.client.create({
    data: {
      teamId,
      createdById: userId,
      name: data.name,
      email: data.email || null,
      company: data.company || null,
    },
  });
}

export async function updateClientForTeam(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  data: ClientInput
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) {
    throw new Error("You do not have access to this team.");
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, teamId },
  });

  if (!client) {
    throw new Error("Client not found in this team.");
  }

  return prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name,
      email: data.email || null,
      company: data.company || null,
    },
  });
}

export async function deleteClientForTeam(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) {
    throw new Error("You do not have access to this team.");
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, teamId },
    include: {
      surveys: { include: { _count: { select: { responses: true } } } },
    },
  });

  if (!client) {
    throw new Error("Client not found in this team.");
  }

  const hasFilled = client.surveys.some((survey) => survey._count.responses > 0);
  if (hasFilled) {
    throw new Error(
      "This client has submitted feedback. Keep the client so filled forms stay retrievable."
    );
  }

  return prisma.client.delete({
    where: { id: clientId },
  });
}
