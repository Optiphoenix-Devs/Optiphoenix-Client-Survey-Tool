import { notFound } from "next/navigation";
import { getPublishedFormByToken } from "@/lib/forms";
import { FieldView, FormSubmitButton } from "@/components/form/field-view";
import { submitSurvey } from "./actions";

export default async function PublicSurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { token } = await params;
  const { sent, error } = await searchParams;
  const form = await getPublishedFormByToken(token);

  if (!form) notFound();

  const closed = form.status !== "PUBLISHED";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-sage">
        OptiPhoenix
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{form.title}</h1>
      <p className="mt-1 text-sm text-muted">
        Feedback for {form.client.name}
      </p>

      {sent ? (
        <section className="mt-8 rounded-2xl border border-emerald-700 bg-emerald-50 p-6">
          <h2 className="font-semibold text-emerald-900">Thank you</h2>
          <p className="mt-1 text-sm text-emerald-800">
            Your feedback was sent.
          </p>
        </section>
      ) : closed ? (
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted">
            This form is not accepting responses right now.
          </p>
        </section>
      ) : (
        <form
          action={submitSurvey}
          className="mt-8 rounded-2xl border border-border bg-card p-6"
        >
          <input type="hidden" name="token" value={token} />
          {error ? (
            <p className="mb-4 rounded-lg border border-rose-700 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
              {error}
            </p>
          ) : null}
          <div className="space-y-6">
            {form.questions.map((question) => (
              <div key={question.id}>
                <p className="text-sm font-medium">
                  {question.label}
                  {question.required ? (
                    <span className="ml-1 text-rose-600">*</span>
                  ) : null}
                </p>
                <FieldView
                  field={{
                    id: question.id,
                    type: question.type,
                    label: question.label,
                    required: question.required,
                    options: question.options,
                  }}
                  mode="live"
                />
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <FormSubmitButton />
          </div>
        </form>
      )}
    </main>
  );
}
