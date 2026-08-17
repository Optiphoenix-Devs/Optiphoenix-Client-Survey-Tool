export const RATING_SCALE = ["1", "2", "3", "4", "5"] as const;
export const RESOURCE_SCALE = [...RATING_SCALE];
export const RESOURCE_SCALE_LEGEND =
  "1 star = Very dissatisfied · 5 stars = Very satisfied";

export const FIELD_TYPES = [
  {
    value: "SHORT_TEXT",
    label: "Short text",
    hint: "One-line answer",
    needsOptions: false,
    minOptions: 0,
    defaultLabel: "Short text question",
  },
  {
    value: "LONG_TEXT",
    label: "Long text",
    hint: "Paragraph answer",
    needsOptions: false,
    minOptions: 0,
    defaultLabel: "Long text question",
  },
  {
    value: "SINGLE_CHOICE",
    label: "Single choice",
    hint: "Pick one option",
    needsOptions: true,
    minOptions: 1,
    defaultLabel: "Choose one option",
    defaultOptions: ["Option 1", "Option 2", "Option 3", "Option 4"],
  },
  {
    value: "MULTIPLE_CHOICE",
    label: "Multiple choice",
    hint: "Pick one or more",
    needsOptions: true,
    minOptions: 1,
    defaultLabel: "Select all that apply",
    defaultOptions: ["Option 1", "Option 2", "Option 3", "Option 4"],
  },
  {
    value: "DROPDOWN",
    label: "Dropdown",
    hint: "Pick one from a list",
    needsOptions: true,
    minOptions: 1,
    defaultLabel: "Choose from the list",
    defaultOptions: ["Option 1", "Option 2", "Option 3"],
  },
  {
    value: "RATING",
    label: "Rating",
    hint: "1 to 5 stars",
    needsOptions: false,
    minOptions: 0,
    defaultLabel: "Overall rating",
  },
  {
    value: "RESOURCE_RATING",
    label: "Resource ratings",
    hint: "Name + 1–5 stars",
    needsOptions: true,
    minOptions: 1,
    defaultLabel: "How satisfied were you with the team?",
    defaultOptions: ["Name 1", "Name 2", "Name 3"],
  },
  {
    value: "SUGGESTION",
    label: "Suggestion",
    hint: "Ideas or suggestion",
    needsOptions: false,
    minOptions: 0,
    defaultLabel: "Suggestions",
  },
] as const;

export type FieldTypeValue = (typeof FIELD_TYPES)[number]["value"];

export function fieldTypeMeta(type: string) {
  return FIELD_TYPES.find((item) => item.value === type);
}

export function fieldNeedsOptions(type: string) {
  return Boolean(fieldTypeMeta(type)?.needsOptions);
}

export function minOptionsForType(type: string) {
  return fieldTypeMeta(type)?.minOptions ?? 0;
}

export function parseOptionList(options: unknown) {
  if (!Array.isArray(options)) return [];
  return options.map(String).filter((value) => value.trim().length > 0);
}
