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

export type SurveyStep =
  | { kind: "question"; question: SectionQuestion }
  | {
      kind: "section";
      section: FormSectionRecord;
      questions: SectionQuestion[];
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
    steps.push({
      kind: "section",
      section,
      questions: sectionQuestions,
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
