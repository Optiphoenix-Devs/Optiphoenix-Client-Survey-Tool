import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/client";
import { getTemplatesForUser } from "@/lib/templates";
import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";
import { TemplatesDirectory } from "./templates-directory";
import { deleteTemplate, useTemplate, createTemplate } from "./actions";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  return (
    <Suspense
      fallback={
        <DirectoryLoadingShell
          storageKey="optiphoenix.templatesView"
          withActions
          tableColumns={5}
          metaLines={2}
        />
      }
    >
      <TemplatesBody userId={session.user.id} role={session.user.role} />
    </Suspense>
  );
}

async function TemplatesBody({
  userId,
  role,
}: {
  userId: string;
  role: UserRole;
}) {
  const templates = await getTemplatesForUser(userId, role);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <TemplatesDirectory
        templates={templates}
        createFormFromTemplateAction={useTemplate}
        deleteAction={deleteTemplate}
        createAction={createTemplate}
      />
    </main>
  );
}
