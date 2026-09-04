export type ChoiceFieldOptions = {
  choices: string[];
  allowOther?: boolean;
};

export type TextFieldOptions = {
  maxLength?: number;
};

export function getChoiceList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String).filter((value) => value.trim().length > 0);
  }
  if (raw && typeof raw === "object" && "choices" in raw) {
    const choices = (raw as ChoiceFieldOptions).choices;
    if (Array.isArray(choices)) {
      return choices.map(String).filter((value) => value.trim().length > 0);
    }
  }
  return [];
}

export function getAllowOther(raw: unknown): boolean {
  if (raw && typeof raw === "object" && "allowOther" in raw) {
    return Boolean((raw as ChoiceFieldOptions).allowOther);
  }
  return false;
}

export function getMaxLength(raw: unknown): number | undefined {
  if (raw && typeof raw === "object" && "maxLength" in raw) {
    const value = Number((raw as TextFieldOptions).maxLength);
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }
  return undefined;
}

export function buildChoiceOptions(
  choices: string[],
  allowOther?: boolean
): ChoiceFieldOptions {
  const normalized = choices.map((item) => item.trim()).filter(Boolean);
  if (allowOther) return { choices: normalized, allowOther: true };
  return { choices: normalized };
}

export function buildTextOptions(maxLength?: number): TextFieldOptions | null {
  if (!maxLength || maxLength <= 0) return null;
  return { maxLength };
}

/** @deprecated Use getChoiceList */
export function parseOptionList(options: unknown) {
  return getChoiceList(options);
}
