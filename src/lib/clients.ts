import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import {
  UniqueNameError,
  getTeamsForUser,
  namesMatch,
  userCanManageTeam,
} from "@/lib/teams";

export type ClientInput = {
  name: string;
  email: string;
  company?: string | null;
};

export type ClientDirectoryRow = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  teamId: string;
  teamName: string;
  formCount: number;
  href: string;
  updatedAt: string;
};

export async function getClientsForUser(userId: string, role: UserRole) {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  if (teamIds.length === 0) return [] as ClientDirectoryRow[];

  const clients = await prisma.client.findMany({
    where: { teamId: { in: teamIds } },
    orderBy: { updatedAt: "desc" },
    include: {
      team: { select: { id: true, name: true } },
      _count: { select: { forms: true } },
    },
  });

  return clients.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    company: client.company,
    teamId: client.team.id,
    teamName: client.team.name,
    formCount: client._count.forms,
    href: `/dashboard/teams/${client.team.id}/clients/${client.id}`,
    updatedAt: client.updatedAt.toISOString(),
  }));
}

export async function assertUniqueClientName(
  userId: string,
  role: UserRole,
  name: string,
  excludeId?: string
) {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  if (teamIds.length === 0) return;

  const clients = await prisma.client.findMany({
    where: { teamId: { in: teamIds } },
    select: { id: true, name: true },
  });
  const taken = clients.some(
    (client) => client.id !== excludeId && namesMatch(client.name, name)
  );
  if (taken) {
    throw new UniqueNameError(
      `A client named "${name.trim()}" already exists.`
    );
  }
}

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

  await assertUniqueClientName(userId, role, data.name);

  return prisma.client.create({
    data: {
      teamId,
      createdById: userId,
      name: data.name.trim(),
      email: data.email.trim(),
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

  await assertUniqueClientName(userId, role, data.name, clientId);

  return prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name.trim(),
      email: data.email.trim(),
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
