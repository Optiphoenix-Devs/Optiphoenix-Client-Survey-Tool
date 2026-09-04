import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/client";
import { getDashboardOverview } from "@/lib/teams";
import { getTemplatesForUser } from "@/lib/templates";
import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";
import { YourFormsSection } from "../your-forms-section";
import { createFormFromList, deleteFormFromList } from "./actions";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  return (
    <Suspense
      fallback={
        <DirectoryLoadingShell
          storageKey="optiphoenix.formsView"
          cardVariant="form"
          tableColumns={6}
        />
      }
    >
      <FormsBody userId={session.user.id} role={session.user.role} />
    </Suspense>
  );
}

async function FormsBody({
  userId,
  role,
}: {
  userId: string;
  role: UserRole;
}) {
  const [overview, templates] = await Promise.all([
    getDashboardOverview(userId, role),
    getTemplatesForUser(userId, role),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <YourFormsSection
        title="Forms"
        forms={overview.forms}
        templates={templates.map((template) => ({
          id: template.id,
          name: template.name,
          fieldCount: template.fieldCount,
        }))}
        createAction={createFormFromList}
        deleteAction={deleteFormFromList}
      />
    </main>
  );
}
