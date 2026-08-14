import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientsForUser } from "@/lib/clients";
import { getDashboardOverview } from "@/lib/teams";
import { DirectorySkeleton } from "@/components/ui/skeleton";
import { YourFormsSection } from "../your-forms-section";
import { createFormFromList } from "./actions";

export default async function FormsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const [overview, clients] = await Promise.all([
    getDashboardOverview(session.user.id, session.user.role),
    getClientsForUser(session.user.id, session.user.role),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <Suspense fallback={<DirectorySkeleton />}>
        <YourFormsSection
          title="Forms"
          forms={overview.forms}
          clients={clients.map((client) => ({
            id: client.id,
            name: client.name,
            teamId: client.teamId,
            teamName: client.teamName,
          }))}
          createAction={createFormFromList}
        />
      </Suspense>
    </main>
  );
}
