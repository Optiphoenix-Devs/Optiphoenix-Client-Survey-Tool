import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  approveUser,
  deactivateUser,
  inviteTeamMember,
  reactivateUser,
  rejectUser,
  restoreTeamAccess,
  revokeTeamAccess,
  unlockUser,
  updateTeamAccessLevel,
} from "./actions";
import { UsersManager } from "./users-manager";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const adminId = session.user.id;

  const [userRows, teams] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { not: adminId },
        role: { not: "ADMIN" },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lockedUntil: true,
        createdAt: true,
        memberships: {
          select: {
            accessLevel: true,
            revokedAt: true,
            team: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const users = userRows.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lockedUntil: user.lockedUntil?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    teams: [...user.memberships]
      .sort((a, b) => a.team.name.localeCompare(b.team.name))
      .map((membership) => ({
        id: membership.team.id,
        name: membership.team.name,
        accessLevel: membership.accessLevel,
        revokedAt: membership.revokedAt?.toISOString() ?? null,
      })),
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <UsersManager
        users={users}
        teams={teams}
        approveAction={approveUser}
        rejectAction={rejectUser}
        deactivateAction={deactivateUser}
        reactivateAction={reactivateUser}
        unlockAction={unlockUser}
        revokeTeamAccessAction={revokeTeamAccess}
        restoreTeamAccessAction={restoreTeamAccess}
        updateTeamAccessLevelAction={updateTeamAccessLevel}
        inviteTeamMemberAction={inviteTeamMember}
      />
    </main>
  );
}
