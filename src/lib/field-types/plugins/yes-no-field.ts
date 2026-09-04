import type { FieldTypePlugin } from "../types";

function readYesNoAnswer(formData: FormData, questionId: string) {
  return String(formData.get(`q_${questionId}`) ?? "").trim();
}

export const yesNoField: FieldTypePlugin = {
  value: "YES_NO",
  label: "Yes / No",
  hint: "Toggle switch for yes or no",
  defaultLabel: "Yes or no?",
  category: "question",
  hasAnswer: true,
  inputKind: "yes-no",
  needsOptions: false,
  minOptions: 0,
  parseAnswer: readYesNoAnswer,
};
