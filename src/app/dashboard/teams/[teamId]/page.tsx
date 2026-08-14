import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTeamWithClients } from "@/lib/clients";
import { createClient, deleteClient, updateClient } from "./actions";
import { ClientsDirectory } from "../../clients/clients-directory";

export default async function TeamClientsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const { teamId } = await params;
  const team = await getTeamWithClients(
    session.user.id,
    session.user.role,
    teamId
  );

  if (!team) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <p className="text-sm text-muted">
        <Link href="/dashboard/teams" className="text-accent hover:text-accent-hover">
          Teams
        </Link>
        {" / "}
        {team.name}
      </p>
      <ClientsDirectory
        title={`${team.name} clients`}
        lockedTeamId={team.id}
        teams={[{ id: team.id, name: team.name }]}
        clients={team.clients.map((client) => ({
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company,
          teamId: team.id,
          teamName: team.name,
          formCount: client._count.forms,
          href: `/dashboard/teams/${team.id}/clients/${client.id}`,
        }))}
        createAction={createClient}
        updateAction={updateClient}
        deleteAction={deleteClient}
      />
    </main>
  );
}
