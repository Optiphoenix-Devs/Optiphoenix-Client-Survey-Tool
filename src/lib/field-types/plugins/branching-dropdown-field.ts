import type { FieldTypePlugin } from "../types";
import { getChoiceList } from "../options";

function readBranchingAnswer(formData: FormData, questionId: string) {
  return String(formData.get(`q_${questionId}`) ?? "").trim();
}

export const branchingDropdownField: FieldTypePlugin = {
  value: "BRANCHING_DROPDOWN",
  label: "Section branching",
  hint: "Route respondents into sections",
  defaultLabel: "Which area should we focus on?",
  category: "branching",
  hasAnswer: true,
  inputKind: "branching-dropdown",
  needsOptions: true,
  minOptions: 1,
  defaultOptions: ["Option 1", "Option 2", "Option 3"],
  introOnly: true,
  maxPerForm: 1,
  parseAnswer: readBranchingAnswer,
};

export function getBranchingField<T extends { type: string; sectionId?: string | null }>(
  questions: T[]
) {
  return questions.find(
    (question) => question.type === "BRANCHING_DROPDOWN" && !question.sectionId
  );
}

export function getBranchingOptions(options: unknown) {
  return getChoiceList(options);
}
