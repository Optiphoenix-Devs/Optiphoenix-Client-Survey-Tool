import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientsForUser } from "@/lib/clients";
import { getTeamsForUser } from "@/lib/teams";
import { createClient, deleteClient, updateClient } from "../teams/[teamId]/actions";
import { ClientsDirectory } from "./clients-directory";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const [clients, teams] = await Promise.all([
    getClientsForUser(session.user.id, session.user.role),
    getTeamsForUser(session.user.id, session.user.role),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <ClientsDirectory
        clients={clients}
        teams={teams.map((team) => ({ id: team.id, name: team.name }))}
        createAction={createClient}
        updateAction={updateClient}
        deleteAction={deleteClient}
      />
    </main>
  );
}
