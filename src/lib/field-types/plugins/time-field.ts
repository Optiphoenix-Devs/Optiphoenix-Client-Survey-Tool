import type { FieldTypePlugin } from "../types";

function readTimeAnswer(formData: FormData, questionId: string) {
  const value = String(formData.get(`q_${questionId}`) ?? "").trim();
  if (!value) return "";
  // Always store with an explicit GMT label so responses stay timezone-clear.
  if (/^\d{2}:\d{2}$/.test(value)) return `${value} GMT`;
  return value;
}

export const timeField: FieldTypePlugin = {
  value: "TIME",
  label: "Time (GMT)",
  hint: "Pick a time in GMT",
  defaultLabel: "Select a time (GMT)",
  category: "question",
  hasAnswer: true,
  inputKind: "time",
  needsOptions: false,
  minOptions: 0,
  parseAnswer: readTimeAnswer,
};
