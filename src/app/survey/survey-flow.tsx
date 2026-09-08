"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { FieldView, type ViewField } from "@/components/form/field-view";
import { PageFlash } from "@/components/ui/page-flash";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/cn";
import {
  buildSurveySteps,
  findBranchingQuestion,
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
  return validateQuestionStep(container, step.question);
}

function persistStepAnswers(
  container: HTMLElement,
  step: SurveyStep,
  merge: (answers: Record<string, string>) => void
) {
  const next: Record<string, string> = {};
  const scoped = container.querySelector(
    `[data-question-id="${step.question.id}"]`
  ) as HTMLElement | null;
  if (scoped) {
    next[step.question.id] = collectStepAnswer(scoped, step.question);
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
  const branchingQuestion = useMemo(
    () => findBranchingQuestion(questionRecords),
    [questionRecords]
  );
  const branchingAwaitingChoice = Boolean(
    branchingQuestion &&
      !(answers[branchingQuestion.id] ?? "").trim() &&
      sections.some((section) => Boolean(section.branchValue))
  );
  // Avoid implying a fixed length — branching can add steps after an answer.
  const progress =
    totalSteps === 0
      ? 0
      : Math.min(
          95,
          Math.round((step / (totalSteps + (branchingAwaitingChoice ? 2 : 1))) * 100)
        );
  const currentStep = step > 0 ? steps[step - 1] : null;
  const isLastStep =
    step === totalSteps && totalSteps > 0 && !branchingAwaitingChoice;

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
        <div className="mb-4">
          <div className="h-1.5 overflow-hidden app-radius bg-hover">
            <div
              className="h-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {onWelcome ? (
        <section className="page-enter overflow-hidden app-radius border border-border bg-white">
          {headerImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headerImageUrl}
              alt=""
              className="h-36 w-full object-cover sm:h-40"
            />
          ) : null}
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
                {description}
              </p>
            ) : null}
            <button
              type="button"
              onClick={goNext}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 app-btn-primary px-5 py-2.5 text-sm sm:w-auto"
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
          className="flex min-h-0 flex-col"
        >
          {!previewMode ? <input type="hidden" name="token" value={token} /> : null}

          <div className="flex max-h-[min(72vh,42rem)] flex-col overflow-hidden app-radius border border-border bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
              {steps.map((surveyStep, index) => {
                const surveyStepNumber = index + 1;
                const active = step === surveyStepNumber;
                const question = surveyStep.question;

                return (
                  <div
                    key={question.id}
                    data-survey-step={surveyStepNumber}
                    className={cn(active ? "page-enter" : "hidden")}
                    aria-hidden={!active}
                  >
                    <div data-question-id={question.id}>
                      {surveyStep.sectionIntro && surveyStep.section ? (
                        <div className="mb-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-sage">
                            {surveyStep.section.title}
                          </p>
                          {surveyStep.section.description ? (
                            <p className="mt-1 text-sm leading-6 text-muted">
                              {surveyStep.section.description}
                            </p>
                          ) : null}
                        </div>
                      ) : surveyStep.section ? (
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                          {surveyStep.section.title}
                        </p>
                      ) : null}
                      <h2 className="text-xl font-semibold leading-7 tracking-tight sm:text-2xl">
                        {question.label}
                        {question.required ? (
                          <span className="ml-1 text-rose-600">*</span>
                        ) : null}
                      </h2>
                      {question.description ? (
                        <p className="mt-1.5 text-sm leading-6 text-muted">
                          {question.description}
                        </p>
                      ) : null}
                      <div className="mt-4">
                        <FieldView
                          field={question}
                          mode="live"
                          presentation="survey"
                          defaultAnswer={answers[question.id]}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 border-t border-border bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex min-h-10 items-center gap-1.5 app-btn-secondary px-4 py-2 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                {isLastStep ? (
                  previewMode ? (
                    <button
                      type="button"
                      onClick={() =>
                        toast("Preview only — nothing is submitted.", {
                          tone: "success",
                        })
                      }
                      className="inline-flex min-h-10 items-center gap-2 app-btn-primary px-5 py-2 text-sm"
                    >
                      <Send className="h-4 w-4" />
                      End preview
                    </button>
                  ) : (
                    <PendingButton
                      type="submit"
                      className="inline-flex min-h-10 items-center gap-2 app-btn-primary px-5 py-2 text-sm"
                    >
                      <Send className="h-4 w-4" />
                      Send feedback
                    </PendingButton>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex min-h-10 items-center gap-2 app-btn-primary px-5 py-2 text-sm"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
