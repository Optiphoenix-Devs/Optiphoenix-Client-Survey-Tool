export type VisibilityOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "is_answered";

export type VisibilityRule = {
  questionId: string;
  operator: VisibilityOperator;
  value?: string;
};

export type QuestionLogic = {
  visibleWhen?: VisibilityRule;
};

export function parseQuestionLogic(raw: unknown): QuestionLogic | null {
  if (!raw || typeof raw !== "object") return null;
  const visibleWhen = (raw as QuestionLogic).visibleWhen;
  if (!visibleWhen || typeof visibleWhen !== "object") return null;
  if (!visibleWhen.questionId || typeof visibleWhen.questionId !== "string") {
    return null;
  }
  const operator = visibleWhen.operator;
  if (
    operator !== "equals" &&
    operator !== "not_equals" &&
    operator !== "contains" &&
    operator !== "is_answered"
  ) {
    return null;
  }
  return {
    visibleWhen: {
      questionId: visibleWhen.questionId,
      operator,
      value:
        typeof visibleWhen.value === "string" ? visibleWhen.value : undefined,
    },
  };
}

function normalizeAnswerValue(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String).join(", ");
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export function isQuestionVisible(
  logic: unknown,
  answers: Record<string, string>
): boolean {
  const parsed = parseQuestionLogic(logic);
  if (!parsed?.visibleWhen) return true;

  const { questionId, operator, value } = parsed.visibleWhen;
  const answer = normalizeAnswerValue(answers[questionId]);

  switch (operator) {
    case "is_answered":
      return answer.length > 0;
    case "equals":
      return answer === (value ?? "");
    case "not_equals":
      return answer !== (value ?? "");
    case "contains":
      return value ? answer.toLowerCase().includes(value.toLowerCase()) : false;
    default:
      return true;
  }
}

export function buildQuestionLogic(input: {
  questionId?: string;
  operator?: string;
  value?: string;
}): QuestionLogic | null {
  if (!input.questionId?.trim()) return null;
  const operator = input.operator as VisibilityOperator | undefined;
  if (
    operator !== "equals" &&
    operator !== "not_equals" &&
    operator !== "contains" &&
    operator !== "is_answered"
  ) {
    return null;
  }
  return {
    visibleWhen: {
      questionId: input.questionId.trim(),
      operator,
      value: input.value?.trim() || undefined,
    },
  };
}

export function collectStepAnswer(
  container: HTMLElement,
  question: { id: string; type: string; options: unknown }
): string {
  if (question.type === "RESOURCE_RATING") {
    const rows = getChoiceListFromOptions(question.options);
    const scores = rows.map((row, index) => ({
      name: row,
      score: String(
        (
          container.querySelector(
            `input[name="q_${question.id}__${index}"]:checked`
          ) as HTMLInputElement | null
        )?.value ?? ""
      ),
    }));
    return JSON.stringify(scores);
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const selected = Array.from(
      container.querySelectorAll(`input[name="q_${question.id}[]"]:checked`)
    ).map((node) => (node as HTMLInputElement).value);
    const otherInput = container.querySelector(
      `input[name="q_${question.id}__other"]`
    ) as HTMLInputElement | null;
    if (otherInput?.value.trim()) {
      selected.push(`Other: ${otherInput.value.trim()}`);
    }
    return JSON.stringify(selected);
  }

  if (
    question.type === "SINGLE_CHOICE" ||
    question.type === "DROPDOWN" ||
    question.type === "BRANCHING_DROPDOWN"
  ) {
    const selected = (
      container.querySelector(
        `input[name="q_${question.id}"]:checked, select[name="q_${question.id}"]`
      ) as HTMLInputElement | HTMLSelectElement | null
    )?.value;
    const otherInput = container.querySelector(
      `input[name="q_${question.id}__other"]`
    ) as HTMLInputElement | null;
    if (selected === "__other__" && otherInput?.value.trim()) {
      return `Other: ${otherInput.value.trim()}`;
    }
    return selected ?? "";
  }

  const control = container.querySelector(
    `[name="q_${question.id}"]`
  ) as HTMLInputElement | HTMLTextAreaElement | null;
  return control?.value.trim() ?? "";
}

function getChoiceListFromOptions(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw.map(String).filter((value) => value.trim().length > 0);
  }
  if (raw && typeof raw === "object" && "choices" in raw) {
    const choices = (raw as { choices?: unknown }).choices;
    if (Array.isArray(choices)) {
      return choices.map(String).filter((value) => value.trim().length > 0);
    }
  }
  return [];
}
