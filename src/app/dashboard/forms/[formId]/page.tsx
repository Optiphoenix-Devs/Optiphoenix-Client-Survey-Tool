import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFormBuilder, formHasSubmission } from "@/lib/forms";
import { getAppBaseUrl } from "@/lib/app-url";
import { FormBuilder } from "../../teams/[teamId]/clients/[clientId]/form-builder";

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { formId } = await params;
  const form = await getFormBuilder(session.user.id, session.user.role, formId);
  if (!form) notFound();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <FormBuilder
        teamId={form.teamId ?? ""}
        clientId={form.clientId ?? ""}
        formId={form.id}
        title={form.title}
        description={form.description}
        status={form.status}
        hasResponse={formHasSubmission(form.surveys)}
        publicFormUrl={`${getAppBaseUrl()}/survey/${form.publicToken}`}
        backHref={
          form.teamId && form.clientId
            ? `/dashboard/teams/${form.teamId}/clients/${form.clientId}`
            : "/dashboard/forms"
        }
        fields={form.questions.map((question) => ({
          id: question.id,
          type: question.type,
          label: question.label,
          required: question.required,
          options: question.options,
          order: question.order,
        }))}
      />
    </div>
  );
}
