import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientWorkspace, getUnassignedDraftForms } from "@/lib/forms";
import { getTemplatesForUser } from "@/lib/templates";
import { ClientWorkspace } from "./client-workspace";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ teamId: string; clientId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { teamId, clientId } = await params;
  const [client, templates, drafts] = await Promise.all([
    getClientWorkspace(session.user.id, session.user.role, teamId, clientId),
    getTemplatesForUser(session.user.id, session.user.role),
    getUnassignedDraftForms(session.user.id, session.user.role),
  ]);

  if (!client) notFound();

  return (
    <ClientWorkspace
      teamId={teamId}
      clientId={clientId}
      teamName={client.team.name}
      name={client.name}
      email={client.email}
      company={client.company}
      forms={client.forms.map((form) => ({
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
        fieldCount: form._count.questions,
        responseCount: form.surveys.reduce(
          (sum, survey) => sum + survey._count.responses,
          0
        ),
        updatedAt: form.updatedAt.toISOString(),
      }))}
      templates={templates.map((template) => ({
        id: template.id,
        name: template.name,
        fieldCount: template.fieldCount,
      }))}
      draftForms={drafts.map((draft) => ({
        id: draft.id,
        title: draft.title,
        fieldCount: draft._count.questions,
      }))}
    />
  );
}
