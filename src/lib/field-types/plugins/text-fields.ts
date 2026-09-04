import type { FieldTypePlugin } from "../types";

function readTextAnswer(formData: FormData, questionId: string) {
  return String(formData.get(`q_${questionId}`) ?? "").trim();
}

export const shortTextField: FieldTypePlugin = {
  value: "SHORT_TEXT",
  label: "Short text",
  hint: "Short answer text",
  defaultLabel: "Short text question",
  category: "question",
  hasAnswer: true,
  inputKind: "short-text",
  needsOptions: false,
  minOptions: 0,
  supportsMaxLength: true,
  parseAnswer: readTextAnswer,
};

export const longTextField: FieldTypePlugin = {
  value: "LONG_TEXT",
  label: "Long text",
  hint: "Long answer text",
  defaultLabel: "Long text question",
  category: "question",
  hasAnswer: true,
  inputKind: "long-text",
  needsOptions: false,
  minOptions: 0,
  supportsMaxLength: true,
  parseAnswer: readTextAnswer,
};

export const suggestionField: FieldTypePlugin = {
  value: "SUGGESTION",
  label: "Suggestion/Comments",
  hint: "Ideas or comments",
  defaultLabel: "Suggestions or comments",
  category: "question",
  hasAnswer: true,
  inputKind: "suggestion",
  needsOptions: false,
  minOptions: 0,
  supportsMaxLength: true,
  parseAnswer: readTextAnswer,
};
