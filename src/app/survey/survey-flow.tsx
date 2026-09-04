"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { FieldView, type ViewField } from "@/components/form/field-view";
import { PageFlash } from "@/components/ui/page-flash";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/cn";
import {
  buildSurveySteps,
  type FormSectionRecord,
  type SectionQuestion,
  type SurveyStep,
} from "@/lib/form-sections";
import { collectStepAnswer, getChoiceList } from "@/lib/question-types";
import { toast } from "@/components/ui/toaster";

type SurveyQuestion = ViewField & {
  description?: string | null;
  sectionId?: string | null;
  order: number;
};

function validateQuestionInContainer(
  container: HTMLElement,
  question: SurveyQuestion
) {
  const scoped = container.querySelector(
    `[data-question-id="${question.id}"]`
  ) as HTMLElement | null;
  if (!scoped) return true;
  return validateQuestionStep(scoped, question);
}

function validateQuestionStep(container: HTMLElement, question: SurveyQuestion) {
  const controls = container.querySelectorAll("input, select, textarea");
  for (const control of controls) {
    const element = control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (element.type === "checkbox") continue;
    if (element.name.endsWith("__other") && !element.value.trim()) continue;
    if (!element.checkValidity()) {
      element.reportValidity();
      return false;
    }
  }

  if (question.type === "MULTIPLE_CHOICE" && question.required) {
    const checked = container.querySelectorAll('input[type="checkbox"]:checked');
    if (checked.length === 0) {
      toast("Please select at least one option.", { tone: "error" });
      return false;
    }
  }

  if (question.type === "RESOURCE_RATING" && question.required) {
    const rows = getChoiceList(question.options);
    for (let index = 0; index < rows.length; index += 1) {
      const selected = container.querySelector(
        `input[name="q_${question.id}__${index}"]:checked`
      );
      if (!selected) {
        toast("Please rate every name.", { tone: "error" });
        return false;
      }
    }
  }

  return true;
}

function validateStep(container: HTMLElement, step: SurveyStep) {
  if (step.kind === "question") {
    return validateQuestionStep(container, step.question);
  }
  for (const question of step.questions) {
    if (!validateQuestionInContainer(container, question)) return false;
  }
  return true;
}

function persistStepAnswers(
  container: HTMLElement,
  step: SurveyStep,
  merge: (answers: Record<string, string>) => void
) {
  const next: Record<string, string> = {};
  if (step.kind === "question") {
    const scoped = container.querySelector(
      `[data-question-id="${step.question.id}"]`
    ) as HTMLElement | null;
    if (scoped) {
      next[step.question.id] = collectStepAnswer(scoped, step.question);
    }
  } else {
    for (const question of step.questions) {
      const scoped = container.querySelector(
        `[data-question-id="${question.id}"]`
      ) as HTMLElement | null;
      if (scoped) {
        next[question.id] = collectStepAnswer(scoped, question);
      }
    }
  }
  merge(next);
}

export function SurveyFlow({
  token,
  title,
  description,
  headerImageUrl,
  sections,
  questions,
  error,
  submitAction,
  previewMode = false,
}: {
  token: string;
  title: string;
  description: string | null;
  headerImageUrl?: string | null;
  sections: FormSectionRecord[];
  questions: SurveyQuestion[];
  error?: string;
  submitAction?: (formData: FormData) => Promise<void>;
  previewMode?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questionRecords: SectionQuestion[] = useMemo(
    () =>
      questions.map((question) => ({
        id: question.id,
        type: question.type,
        label: question.label,
        description: question.description,
        required: question.required,
        options: question.options,
        sectionId: question.sectionId,
        order: question.order,
      })),
    [questions]
  );

  const steps = useMemo(
    () => buildSurveySteps(sections, questionRecords, answers),
    [answers, questionRecords, sections]
  );

  const totalSteps = steps.length;
  const onWelcome = step === 0;
  const progress =
    totalSteps === 0 ? 0 : Math.round((step / (totalSteps + 1)) * 100);
  const currentStep = step > 0 ? steps[step - 1] : null;
  const isLastStep = step === totalSteps && totalSteps > 0;

  useEffect(() => {
    if (step > 0 && step > totalSteps) {
      setStep(Math.max(1, totalSteps));
    }
  }, [step, totalSteps]);

  // Keep answers in sync as the user fills the current step so branching
  // sections appear (and Next vs Submit updates) before they click Next.
  useEffect(() => {
    if (onWelcome || !currentStep) return;
    const form = formRef.current;
    if (!form) return;

    function syncCurrentStepAnswers() {
      const activeForm = formRef.current;
      if (!activeForm) return;
      const container = activeForm.querySelector(
        `[data-survey-step="${step}"]`
      ) as HTMLElement | null;
      if (!container || !currentStep) return;
      persistStepAnswers(container, currentStep, (patch) => {
        setAnswers((current) => {
          let changed = false;
          for (const [key, value] of Object.entries(patch)) {
            if (current[key] !== value) {
              changed = true;
              break;
            }
          }
          if (!changed) return current;
          return { ...current, ...patch };
        });
      });
    }

    form.addEventListener("change", syncCurrentStepAnswers);
    form.addEventListener("input", syncCurrentStepAnswers);
    return () => {
      form.removeEventListener("change", syncCurrentStepAnswers);
      form.removeEventListener("input", syncCurrentStepAnswers);
    };
  }, [currentStep, onWelcome, step]);

  function readAnswersWithCurrentStep() {
    if (onWelcome || !currentStep) return answers;
    const container = formRef.current?.querySelector(
      `[data-survey-step="${step}"]`
    ) as HTMLElement | null;
    if (!container) return answers;
    const patch: Record<string, string> = {};
    persistStepAnswers(container, currentStep, (next) => {
      Object.assign(patch, next);
    });
    return { ...answers, ...patch };
  }

  function persistCurrentStep() {
    if (onWelcome || !currentStep) return;
    const container = formRef.current?.querySelector(
      `[data-survey-step="${step}"]`
    ) as HTMLElement | null;
    if (!container) return;
    persistStepAnswers(container, currentStep, (patch) =>
      setAnswers((current) => ({ ...current, ...patch }))
    );
  }

  function goBack() {
    persistCurrentStep();
    setStep((current) => Math.max(0, current - 1));
  }

  function goNext() {
    if (onWelcome) {
      setStep(1);
      return;
    }

    const container = formRef.current?.querySelector(
      `[data-survey-step="${step}"]`
    ) as HTMLElement | null;
    if (container && currentStep && !validateStep(container, currentStep)) {
      return;
    }

    const nextAnswers = readAnswersWithCurrentStep();
    setAnswers(nextAnswers);
    const nextSteps = buildSurveySteps(sections, questionRecords, nextAnswers);
    setStep((current) => Math.min(nextSteps.length, current + 1));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (previewMode) {
      event.preventDefault();
      goNext();
      return;
    }

    if (step < totalSteps) {
      event.preventDefault();
      goNext();
      return;
    }

    const container = formRef.current?.querySelector(
      `[data-survey-step="${step}"]`
    ) as HTMLElement | null;
    if (container && currentStep && !validateStep(container, currentStep)) {
      event.preventDefault();
    }
  }

  return (
    <>
      {!previewMode ? (
        <PageFlash title="Could not send feedback" message={error} />
      ) : null}

      {!onWelcome ? (
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted">
            <span>
              {currentStep?.kind === "section"
                ? "Section"
                : `Step ${Math.min(step, totalSteps)} of ${totalSteps}`}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden app-radius bg-hover">
            <div
              className="h-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {onWelcome ? (
        <section className="page-enter flex flex-1 flex-col justify-center overflow-hidden app-radius border border-border bg-white p-0 sm:p-0">
          {headerImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headerImageUrl}
              alt=""
              className="mb-0 h-40 w-full object-cover sm:h-48"
            />
          ) : null}
          <div className="flex flex-1 flex-col justify-center p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Client feedback
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-lg text-sm leading-7 text-muted">{description}</p>
          ) : null}
          <p className="mt-4 text-sm text-muted">
            {totalSteps === 1
              ? "1 step · about 1 minute"
              : `${totalSteps} steps · about ${Math.max(2, Math.ceil(totalSteps * 0.75))} minutes`}
          </p>
          <button
            type="button"
            onClick={goNext}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 app-btn-primary px-5 py-3 text-sm sm:w-auto"
          >
            Start
            <ArrowRight className="h-4 w-4" />
          </button>
          </div>
        </section>
      ) : (
        <form
          ref={formRef}
          action={previewMode ? undefined : submitAction}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col"
        >
          {!previewMode ? <input type="hidden" name="token" value={token} /> : null}

          <div className="relative flex-1">
            {steps.map((surveyStep, index) => {
              const surveyStepNumber = index + 1;
              const active = step === surveyStepNumber;

              return (
                <div
                  key={
                    surveyStep.kind === "section"
                      ? surveyStep.section.id
                      : surveyStep.question.id
                  }
                  data-survey-step={surveyStepNumber}
                  className={cn(
                    active
                      ? "page-enter app-radius border border-border bg-white p-6 sm:p-8"
                      : "hidden",
                    surveyStep.kind === "section" && active && "border-dashed"
                  )}
                  aria-hidden={!active}
                >
                  {surveyStep.kind === "section" ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                        Section
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold leading-8 tracking-tight">
                        {surveyStep.section.title}
                      </h2>
                      {surveyStep.section.description ? (
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {surveyStep.section.description}
                        </p>
                      ) : null}
                      <div className="mt-8 space-y-8">
                        {surveyStep.questions.length === 0 ? (
                          <p className="text-sm text-muted">
                            No questions in this section yet.
                          </p>
                        ) : (
                          surveyStep.questions.map((question) => (
                          <div key={question.id} data-question-id={question.id}>
                            <h3 className="text-lg font-semibold leading-7">
                              {question.label}
                              {question.required ? (
                                <span className="ml-1 text-rose-600">*</span>
                              ) : null}
                            </h3>
                            {question.description ? (
                              <p className="mt-1 text-sm leading-6 text-muted">
                                {question.description}
                              </p>
                            ) : null}
                            <FieldView
                              field={question}
                              mode="live"
                              presentation="survey"
                            />
                          </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div data-question-id={surveyStep.question.id}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Question
                      </p>
                      <h2 className="mt-2 text-xl font-semibold leading-8 tracking-tight sm:text-2xl">
                        {surveyStep.question.label}
                        {surveyStep.question.required ? (
                          <span className="ml-1 text-rose-600">*</span>
                        ) : null}
                      </h2>
                      {surveyStep.question.description ? (
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {surveyStep.question.description}
                        </p>
                      ) : null}
                      <div className="mt-6">
                        <FieldView
                          field={surveyStep.question}
                          mode="live"
                          presentation="survey"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-0 mt-8 border-t border-border bg-card/95 px-0 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:app-radius sm:border sm:px-4 sm:pb-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex min-h-11 items-center gap-1.5 app-btn-secondary px-4 py-2.5 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              {isLastStep ? (
                previewMode ? (
                  <button
                    type="button"
                    onClick={() =>
                      toast("Preview only — nothing is submitted.", { tone: "success" })
                    }
                    className="inline-flex min-h-11 items-center gap-2 app-btn-primary px-5 py-2.5 text-sm"
                  >
                    <Send className="h-4 w-4" />
                    End preview
                  </button>
                ) : (
                  <PendingButton
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-2 app-btn-primary px-5 py-2.5 text-sm"
                  >
                    <Send className="h-4 w-4" />
                    Send feedback
                  </PendingButton>
                )
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-11 items-center gap-2 app-btn-primary px-5 py-2.5 text-sm"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </>
  );
}
