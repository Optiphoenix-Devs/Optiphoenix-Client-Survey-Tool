export const RATING_SCALE = ["1", "2", "3", "4", "5"] as const;
export const RESOURCE_SCALE = [...RATING_SCALE];
export const RESOURCE_SCALE_LEGEND =
  "1 star = Very dissatisfied · 5 stars = Very satisfied";

export type FieldCategory = "question" | "layout" | "branching";

export type FieldInputKind =
  | "short-text"
  | "long-text"
  | "comment"
  | "suggestion"
  | "single-choice"
  | "multi-choice"
  | "dropdown"
  | "branching-dropdown"
  | "rating"
  | "resource-rating"
  | "date"
  | "yes-no";

export type FieldTypeValue =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "COMMENT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "DROPDOWN"
  | "BRANCHING_DROPDOWN"
  | "SUGGESTION"
  | "RATING"
  | "RESOURCE_RATING"
  | "DATE"
  | "YES_NO";

export type FieldTypePlugin = {
  value: FieldTypeValue;
  label: string;
  hint: string;
  defaultLabel: string;
  category: FieldCategory;
  hasAnswer: boolean;
  inputKind: FieldInputKind;
  needsOptions: boolean;
  minOptions: number;
  defaultOptions?: readonly string[];
  supportsMaxLength?: boolean;
  supportsAllowOther?: boolean;
  introOnly?: boolean;
  maxPerForm?: number;
  parseAnswer: (
    formData: FormData,
    questionId: string,
    options: unknown
  ) => string;
};

export type FieldRenderProps = {
  field: {
    id: string;
    type: string;
    label: string;
    required: boolean;
    options: unknown;
  };
  mode: "preview" | "live";
  presentation?: "default" | "survey";
};
