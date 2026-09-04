import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTemplateBuilder } from "@/lib/templates";
import { FormBuilder } from "../../teams/[teamId]/clients/[clientId]/form-builder";

export default async function TemplateBuilderPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { templateId } = await params;
  const template = await getTemplateBuilder(
    session.user.id,
    session.user.role,
    templateId
  );
  if (!template) notFound();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <FormBuilder
        variant="template"
        backHref="/dashboard/templates"
        teamId=""
        clientId=""
        formId={template.id}
        title={template.name}
        description={template.description}
        status="DRAFT"
        publicFormUrl=""
        fields={template.questions.map((question) => ({
          id: question.id,
          type: question.type,
          label: question.label,
          description: question.description,
          required: question.required,
          options: question.options,
          logic: question.logic,
          order: question.order,
        }))}
      />
    </div>
  );
}
