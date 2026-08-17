import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientWorkspace } from "@/lib/forms";
import { ClientWorkspace } from "./client-workspace";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ teamId: string; clientId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { teamId, clientId } = await params;
  const client = await getClientWorkspace(
    session.user.id,
    session.user.role,
    teamId,
    clientId
  );

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
    />
  );
}
