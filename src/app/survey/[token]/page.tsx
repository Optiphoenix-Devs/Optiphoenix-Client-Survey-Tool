import { notFound } from "next/navigation";
import { getPublishedFormByToken, formHasSubmission } from "@/lib/forms";
import { normalizeThankYouBg, DEFAULT_THANK_YOU_BG } from "@/lib/form-thank-you";
import { SurveyHeader } from "../survey-header";
import { SurveyFlow } from "../survey-flow";
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
  const questions = form.questions.map((question) => ({
    id: question.id,
    type: question.type,
    label: question.label,
    description: question.description,
    required: question.required,
    options: question.options,
    sectionId: question.sectionId,
    order: question.order,
  }));
  const sections = (form.sections ?? []).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
    branchValue: section.branchValue,
    logic: section.logic,
  }));
  const thankYouBg = normalizeThankYouBg(form.thankYouBgColor ?? DEFAULT_THANK_YOU_BG);

  return (
    <div className="flex min-h-dvh flex-col">
      <SurveyHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:py-10">
        {sent ? (
          <section
            className="page-enter overflow-hidden app-radius border border-border/40 p-0"
            style={{ backgroundColor: thankYouBg }}
          >
            {form.thankYouImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.thankYouImageUrl}
                alt=""
                className="h-44 w-full object-cover"
              />
            ) : null}
            <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              {form.thankYouTitle?.trim() || "Thank you"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {form.thankYouMessage?.trim() ||
                "Your feedback was sent. This link cannot be used again."}
            </p>
            </div>
          </section>
        ) : alreadySubmitted ? (
          <section className="page-enter app-radius border border-border bg-card p-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Already submitted
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Each public link can only be filled once. Ask your OptiPhoenix contact
              for a new link if you need to send another response.
            </p>
          </section>
        ) : closed ? (
          <section className="page-enter app-radius border border-border bg-card p-8">
            <h1 className="text-2xl font-semibold tracking-tight">Form closed</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              This form is not accepting responses right now.
            </p>
          </section>
        ) : questions.length === 0 ? (
          <section className="page-enter app-radius border border-border bg-card p-8">
            <h1 className="text-2xl font-semibold tracking-tight">{form.title}</h1>
            <p className="mt-2 text-sm text-muted">This form has no questions yet.</p>
          </section>
        ) : (
          <SurveyFlow
            token={token}
            title={form.title}
            description={form.description}
            headerImageUrl={form.headerImageUrl}
            sections={sections}
            questions={questions}
            error={error}
            submitAction={submitSurvey}
          />
        )}
      </main>
    </div>
  );
}
