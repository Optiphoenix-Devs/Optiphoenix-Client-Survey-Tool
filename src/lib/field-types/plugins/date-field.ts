import type { FieldTypePlugin } from "../types";

function readDateAnswer(formData: FormData, questionId: string) {
  return String(formData.get(`q_${questionId}`) ?? "").trim();
}

export const dateField: FieldTypePlugin = {
  value: "DATE",
  label: "Date",
  hint: "Pick a calendar date",
  defaultLabel: "Select a date",
  category: "question",
  hasAnswer: true,
  inputKind: "date",
  needsOptions: false,
  minOptions: 0,
  parseAnswer: readDateAnswer,
};
