import { notFound } from "next/navigation";
import { getPublishedFormByToken, formHasSubmission } from "@/lib/forms";
import { FieldView, FormSubmitButton } from "@/components/form/field-view";
import { PageFlash } from "@/components/ui/page-flash";
import { SurveyHeader } from "../survey-header";
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
  const alreadySubmitted = formHasSubmission(form.surveys);

  return (
    <div className="flex min-h-dvh flex-col">
      <SurveyHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">{form.title}</h1>
        {form.description ? (
          <p className="mt-2 text-sm leading-6 text-muted">{form.description}</p>
        ) : null}

        {sent ? (
          <section className="mt-8 app-radius border border-emerald-700 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/40">
            <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">Thank you</h2>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
              Your feedback was sent. This link cannot be used again.
            </p>
          </section>
        ) : alreadySubmitted ? (
          <section className="mt-8 app-radius border border-border bg-card p-6">
            <p className="font-medium">This form has already been submitted</p>
            <p className="mt-1 text-sm text-muted">
              Each public link can only be filled once. Ask your OptiPhoenix contact for a new link if you need to send another response.
            </p>
          </section>
        ) : closed ? (
          <section className="mt-8 app-radius border border-border bg-card p-6">
            <p className="text-sm text-muted">
              This form is not accepting responses right now.
            </p>
          </section>
        ) : (
          <form
            action={submitSurvey}
            className="mt-8 app-radius border border-border bg-card p-6"
          >
            <input type="hidden" name="token" value={token} />
            <PageFlash title="Could not send feedback" message={error} />
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
    </div>
  );
}
