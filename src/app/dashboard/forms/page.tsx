import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/client";
import { getDashboardOverview } from "@/lib/teams";
import { getTemplatesForUser } from "@/lib/templates";
import { DirectorySkeleton } from "@/components/ui/skeleton";
import { YourFormsSection } from "../your-forms-section";
import { createFormFromList } from "./actions";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  return (
    <Suspense fallback={<DirectorySkeleton />}>
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
      />
    </main>
  );
}
