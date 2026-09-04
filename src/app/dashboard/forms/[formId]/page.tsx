import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFormBuilder, formHasSubmission } from "@/lib/forms";
import { getAppBaseUrl } from "@/lib/app-url";
import { getClientsForUser } from "@/lib/clients";
import { getTemplatesForUser } from "@/lib/templates";
import { FormBuilder } from "../../teams/[teamId]/clients/[clientId]/form-builder";

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { formId } = await params;
  const [form, templates, clients] = await Promise.all([
    getFormBuilder(session.user.id, session.user.role, formId),
    getTemplatesForUser(session.user.id, session.user.role),
    getClientsForUser(session.user.id, session.user.role),
  ]);
  if (!form) notFound();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <FormBuilder
        teamId={form.teamId ?? ""}
        clientId={form.clientId ?? ""}
        formId={form.id}
        title={form.title}
        description={form.description}
        thankYouTitle={form.thankYouTitle}
        thankYouMessage={form.thankYouMessage}
        headerImageUrl={form.headerImageUrl}
        thankYouImageUrl={form.thankYouImageUrl}
        thankYouBgColor={form.thankYouBgColor}
        status={form.status}
        hasResponse={formHasSubmission(form.surveys)}
        publicFormUrl={`${getAppBaseUrl()}/survey/${form.publicToken}`}
        sourceTemplateId={form.sourceTemplateId}
        templates={templates.map((template) => ({
          id: template.id,
          name: template.name,
          fieldCount: template.fieldCount,
        }))}
        clients={clients.map((client) => ({
          id: client.id,
          name: client.name,
          teamId: client.teamId,
          teamName: client.teamName,
        }))}
        backHref="/dashboard/forms"
        fields={form.questions.map((question) => ({
          id: question.id,
          type: question.type,
          label: question.label,
          description: question.description,
          required: question.required,
          options: question.options,
          sectionId: question.sectionId,
          order: question.order,
        }))}
        sections={form.sections.map((section) => ({
          id: section.id,
          title: section.title,
          description: section.description,
          order: section.order,
          branchValue: section.branchValue,
          logic: section.logic,
        }))}
      />
    </div>
  );
}
