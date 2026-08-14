import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientFormBuilder } from "@/lib/forms";
import { FormBuilder } from "../../form-builder";

export default async function ClientFormBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; clientId: string; formId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { teamId, clientId, formId } = await params;
  const flash = await searchParams;
  const form = await getClientFormBuilder(
    session.user.id,
    session.user.role,
    teamId,
    clientId,
    formId
  );

  if (!form) notFound();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {flash.error ? (
        <p className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900">
          {flash.error.replaceAll("+", " ")}
        </p>
      ) : null}
      {(flash.updated || flash.published || flash.unpublished) && (
        <p className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900">
          {flash.unpublished
            ? "Unpublished. New submissions are blocked. Existing answers stay stored."
            : flash.published
              ? "Published. This client can receive the unique survey link."
              : "Saved."}
        </p>
      )}

      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2 text-xs text-muted">
        <Link href="/dashboard" className="hover:text-accent">
          Dashboard
        </Link>
        <span>/</span>
        <Link href={`/dashboard/teams/${teamId}`} className="hover:text-accent">
          {form.team.name}
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/teams/${teamId}/clients/${clientId}`}
          className="hover:text-accent"
        >
          {form.client.name}
        </Link>
      </div>

      <FormBuilder
        teamId={teamId}
        clientId={clientId}
        formId={form.id}
        title={form.title}
        status={form.status}
        publicFormUrl={`${process.env.AUTH_URL ?? "http://localhost:3000"}/survey/${form.publicToken}`}
        focusFieldId={flash.focus}
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
