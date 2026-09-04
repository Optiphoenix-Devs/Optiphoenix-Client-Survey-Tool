import type { FieldTypePlugin } from "../types";

function readCommentAnswer(formData: FormData, questionId: string) {
  return String(formData.get(`q_${questionId}`) ?? "").trim();
}

export const commentField: FieldTypePlugin = {
  value: "COMMENT",
  label: "Paragraph text answer",
  hint: "Multi-line paragraph response",
  defaultLabel: "Paragraph question",
  category: "question",
  hasAnswer: true,
  inputKind: "comment",
  needsOptions: false,
  minOptions: 0,
  supportsMaxLength: true,
  parseAnswer: readCommentAnswer,
};
