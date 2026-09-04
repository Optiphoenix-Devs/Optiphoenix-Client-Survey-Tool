import type { FieldTypePlugin } from "../types";
import { getChoiceList } from "../options";

function readSingleChoice(formData: FormData, questionId: string) {
  const value = String(formData.get(`q_${questionId}`) ?? "").trim();
  if (value === "__other__") {
    const other = String(formData.get(`q_${questionId}__other`) ?? "").trim();
    return other ? `Other: ${other}` : "";
  }
  return value;
}

function readMultipleChoice(
  formData: FormData,
  questionId: string,
  options: unknown
) {
  const selected = formData
    .getAll(`q_${questionId}[]`)
    .map(String)
    .filter(Boolean);
  const allowOther = getChoiceList(options).length >= 0;
  void allowOther;
  const otherSelected = selected.includes("__other__");
  const other = String(formData.get(`q_${questionId}__other`) ?? "").trim();
  const normalized = selected.filter((item) => item !== "__other__");
  if (otherSelected && other) normalized.push(`Other: ${other}`);
  return JSON.stringify(normalized);
}

export const singleChoiceField: FieldTypePlugin = {
  value: "SINGLE_CHOICE",
  label: "Single choice",
  hint: "Pick one option",
  defaultLabel: "Choose one option",
  category: "question",
  hasAnswer: true,
  inputKind: "single-choice",
  needsOptions: true,
  minOptions: 1,
  defaultOptions: ["Option 1", "Option 2", "Option 3", "Option 4"],
  supportsAllowOther: true,
  parseAnswer: readSingleChoice,
};

export const multipleChoiceField: FieldTypePlugin = {
  value: "MULTIPLE_CHOICE",
  label: "Multiple choice",
  hint: "Pick one or more",
  defaultLabel: "Select all that apply",
  category: "question",
  hasAnswer: true,
  inputKind: "multi-choice",
  needsOptions: true,
  minOptions: 1,
  defaultOptions: ["Option 1", "Option 2", "Option 3", "Option 4"],
  supportsAllowOther: true,
  parseAnswer: readMultipleChoice,
};

export const dropdownField: FieldTypePlugin = {
  value: "DROPDOWN",
  label: "Dropdown",
  hint: "Pick one from a list",
  defaultLabel: "Choose from the list",
  category: "question",
  hasAnswer: true,
  inputKind: "dropdown",
  needsOptions: true,
  minOptions: 1,
  defaultOptions: ["Option 1", "Option 2", "Option 3"],
  supportsAllowOther: true,
  parseAnswer: readSingleChoice,
};
