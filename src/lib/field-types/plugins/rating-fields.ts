import type { FieldTypePlugin } from "../types";
import { getChoiceList } from "../options";

export const ratingField: FieldTypePlugin = {
  value: "RATING",
  label: "Rating",
  hint: "1 to 5 stars",
  defaultLabel: "Overall rating",
  category: "question",
  hasAnswer: true,
  inputKind: "rating",
  needsOptions: false,
  minOptions: 0,
  parseAnswer(formData, questionId) {
    return String(formData.get(`q_${questionId}`) ?? "").trim();
  },
};

export const resourceRatingField: FieldTypePlugin = {
  value: "RESOURCE_RATING",
  label: "Resource ratings",
  hint: "Name + 1–5 stars",
  defaultLabel: "How satisfied were you with the team?",
  category: "question",
  hasAnswer: true,
  inputKind: "resource-rating",
  needsOptions: true,
  minOptions: 1,
  defaultOptions: ["Name 1", "Name 2", "Name 3"],
  parseAnswer(formData, questionId, options) {
    const rows = getChoiceList(options);
    const scores = rows.map((row, index) => ({
      name: row,
      score: String(formData.get(`q_${questionId}__${index}`) ?? ""),
    }));
    return JSON.stringify(scores);
  },
};
