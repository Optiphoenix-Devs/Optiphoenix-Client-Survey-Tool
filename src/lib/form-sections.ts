import {
  isQuestionVisible,
  parseQuestionLogic,
  type QuestionLogic,
} from "@/lib/field-types/logic";

export type FormSectionRecord = {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  branchValue?: string | null;
  logic?: unknown;
};

export type SectionQuestion = {
  id: string;
  type: string;
  label: string;
  description?: string | null;
  required: boolean;
  options: unknown;
  sectionId?: string | null;
  order: number;
};

/** One survey screen — always a single question (section fields continue step-by-step). */
export type SurveyStep = {
  kind: "question";
  question: SectionQuestion;
  /** Present when this question belongs to a branched/visible section. */
  section?: FormSectionRecord | null;
  /** True for the first question shown from this section in the current path. */
  sectionIntro?: boolean;
};

export function findBranchingQuestion(questions: SectionQuestion[]) {
  return questions.find(
    (question) => question.type === "BRANCHING_DROPDOWN" && !question.sectionId
  );
}

export function isSectionVisible(
  section: Pick<FormSectionRecord, "logic" | "branchValue">,
  answers: Record<string, string>,
  branchingQuestionId?: string | null
) {
  if (section.branchValue && branchingQuestionId) {
    return (answers[branchingQuestionId] ?? "") === section.branchValue;
  }
  return isQuestionVisible(section.logic, answers);
}

export function buildSurveySteps(
  sections: FormSectionRecord[],
  questions: SectionQuestion[],
  answers: Record<string, string>
): SurveyStep[] {
  const branchingQuestion = findBranchingQuestion(questions);
  const globalQuestions = questions
    .filter((question) => !question.sectionId)
    .sort((a, b) => a.order - b.order);

  const visibleSections = sections
    .filter((section) =>
      isSectionVisible(section, answers, branchingQuestion?.id)
    )
    .sort((a, b) => a.order - b.order);

  const steps: SurveyStep[] = globalQuestions.map((question) => ({
    kind: "question",
    question,
  }));

  for (const section of visibleSections) {
    const sectionQuestions = questions
      .filter((question) => question.sectionId === section.id)
      .sort((a, b) => a.order - b.order);

    sectionQuestions.forEach((question, index) => {
      steps.push({
        kind: "question",
        question,
        section,
        sectionIntro: index === 0,
      });
    });
  }

  return steps;
}

export function getVisibleQuestionsForSubmit(
  sections: FormSectionRecord[],
  questions: SectionQuestion[],
  answersSoFar: Record<string, string>
) {
  const branchingQuestion = findBranchingQuestion(questions);
  const visibleSectionIds = new Set(
    sections
      .filter((section) =>
        isSectionVisible(section, answersSoFar, branchingQuestion?.id)
      )
      .map((section) => section.id)
  );

  return questions.filter((question) => {
    if (!question.sectionId) return true;
    return visibleSectionIds.has(question.sectionId);
  });
}

export { parseQuestionLogic, type QuestionLogic };
