import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTeamsForUser } from "@/lib/teams";
import { createTeam, deleteTeam, updateTeam } from "../../actions";
import { TeamsDirectory } from "../teams-directory";

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const teams = await getTeamsForUser(session.user.id, session.user.role);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <TeamsDirectory
        teams={teams.map((team) => ({
          id: team.id,
          name: team.name,
          memberCount: team._count.members,
          clientCount: team._count.clients,
          formCount: team._count.forms,
          href: `/dashboard/teams/${team.id}`,
          updatedAt: team.updatedAt.toISOString(),
        }))}
        createAction={createTeam}
        updateAction={updateTeam}
        deleteAction={deleteTeam}
      />
    </main>
  );
}
