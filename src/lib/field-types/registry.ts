import type { FieldTypePlugin, FieldTypeValue } from "./types";
import { branchingDropdownField } from "./plugins/branching-dropdown-field";
import {
  dropdownField,
  multipleChoiceField,
  singleChoiceField,
} from "./plugins/choice-fields";
import {
  ratingField,
  resourceRatingField,
} from "./plugins/rating-fields";
import { commentField } from "./plugins/comment-field";
import { dateField } from "./plugins/date-field";
import { yesNoField } from "./plugins/yes-no-field";
import {
  longTextField,
  shortTextField,
  suggestionField,
} from "./plugins/text-fields";

export const FIELD_PLUGINS: FieldTypePlugin[] = [
  shortTextField,
  longTextField,
  commentField,
  singleChoiceField,
  multipleChoiceField,
  dropdownField,
  branchingDropdownField,
  ratingField,
  resourceRatingField,
  suggestionField,
  dateField,
  yesNoField,
];

const pluginMap = new Map(FIELD_PLUGINS.map((plugin) => [plugin.value, plugin]));

export function getFieldType(type: string) {
  return pluginMap.get(type as FieldTypeValue);
}

export function fieldTypeMeta(type: string) {
  const plugin = getFieldType(type);
  if (!plugin) return undefined;
  return {
    value: plugin.value,
    label: plugin.label,
    hint: plugin.hint,
    needsOptions: plugin.needsOptions,
    minOptions: plugin.minOptions,
    defaultLabel: plugin.defaultLabel,
    defaultOptions: plugin.defaultOptions,
    category: plugin.category,
    hasAnswer: plugin.hasAnswer,
  };
}

export function fieldNeedsOptions(type: string) {
  return Boolean(getFieldType(type)?.needsOptions);
}

export function minOptionsForType(type: string) {
  return getFieldType(type)?.minOptions ?? 0;
}

export function parseFieldAnswer(
  type: string,
  formData: FormData,
  questionId: string,
  options: unknown
) {
  const plugin = getFieldType(type);
  if (!plugin) return "";
  return plugin.parseAnswer(formData, questionId, options);
}

export const FIELD_TYPES = FIELD_PLUGINS.map((plugin) => ({
  value: plugin.value,
  label: plugin.label,
  hint: plugin.hint,
  needsOptions: plugin.needsOptions,
  minOptions: plugin.minOptions,
  defaultLabel: plugin.defaultLabel,
  defaultOptions: plugin.defaultOptions,
  category: plugin.category,
}));

export const ADDABLE_FIELD_TYPES = FIELD_PLUGINS.filter(
  (plugin) => plugin.category === "question" || plugin.category === "branching"
).map((plugin) => ({
  value: plugin.value,
  label: plugin.label,
  hint: plugin.hint,
  needsOptions: plugin.needsOptions,
  minOptions: plugin.minOptions,
  defaultLabel: plugin.defaultLabel,
  defaultOptions: plugin.defaultOptions,
  category: plugin.category,
}));

export const SECTION_QUESTION_FIELD_TYPES = ADDABLE_FIELD_TYPES.filter(
  (type) => type.value !== "BRANCHING_DROPDOWN"
);

export const SECTION_BRANCHING_FIELD = branchingDropdownField;

export type { FieldTypeValue } from "./types";
