import { prisma } from "@/lib/prisma";
import type { QuestionType, UserRole } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { userCanManageTeam } from "@/lib/teams";
import { fieldNeedsOptions, fieldTypeMeta, getFieldType, minOptionsForType, parseFieldAnswer, getChoiceList, buildChoiceOptions, buildTextOptions } from "@/lib/question-types";
import { buildQuestionLogic } from "@/lib/field-types/logic";
import { getVisibleQuestionsForSubmit } from "@/lib/form-sections";
import { sendEmail } from "@/lib/email/send-email";
import { feedbackSubmittedEmail } from "@/lib/email/templates";
import { getAppBaseUrl } from "@/lib/app-url";

export function formsAccessibleWhere(
  userId: string,
  role: UserRole,
  teamIds: string[]
): Prisma.FormWhereInput {
  if (role === "ADMIN") return {};
  return {
    OR: [
      { createdById: userId },
      ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
    ],
  };
}

export async function userCanAccessFormRecord(
  userId: string,
  role: UserRole,
  form: { createdById: string; teamId: string | null }
) {
  if (role === "ADMIN") return true;
  if (form.createdById === userId) return true;
  if (form.teamId) return userCanManageTeam(userId, role, form.teamId);
  return false;
}

export async function requireFormAccess(
  userId: string,
  role: UserRole,
  formId: string
) {
  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form) throw new Error("Form not found");
  if (!(await userCanAccessFormRecord(userId, role, form))) {
    throw new Error("No access");
  }
  return form;
}

export function formHasSubmission(
  surveys: Array<{ _count: { responses: number } }>
) {
  return surveys.some((survey) => survey._count.responses > 0);
}

export async function getClientWorkspace(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) return null;

  return prisma.client.findFirst({
    where: { id: clientId, teamId },
    include: {
      team: true,
      forms: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { questions: true } },
          surveys: { select: { _count: { select: { responses: true } } } },
        },
      },
    },
  });
}

export async function getFormBuilder(
  userId: string,
  role: UserRole,
  formId: string
) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      client: true,
      team: true,
      sections: { orderBy: { order: "asc" } },
      questions: { orderBy: { order: "asc" } },
      surveys: { include: { _count: { select: { responses: true } } } },
    },
  });
  if (!form) return null;
  if (!(await userCanAccessFormRecord(userId, role, form))) return null;
  return form;
}

export async function getClientFormBuilder(
  userId: string,
  role: UserRole,
  _teamId: string | undefined,
  _clientId: string | undefined,
  formId: string
) {
  return getFormBuilder(userId, role, formId);
}

/** Draft forms not yet linked to a client — pickable from a client workspace. */
export async function getUnassignedDraftForms(userId: string, role: UserRole) {
  const where =
    role === "ADMIN"
      ? { clientId: null, status: "DRAFT" as const }
      : { clientId: null, status: "DRAFT" as const, createdById: userId };

  return prisma.form.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      _count: { select: { questions: true } },
    },
  });
}

export async function createFormForUser(
  userId: string,
  role: UserRole,
  data: {
    title: string;
    templateId?: string;
    teamId?: string;
    clientId?: string;
  }
) {
  let teamId: string | null = data.teamId || null;
  let clientId: string | null = data.clientId || null;

  if (teamId && clientId) {
    const allowed = await userCanManageTeam(userId, role, teamId);
    if (!allowed) throw new Error("No access");
    const client = await prisma.client.findFirst({
      where: { id: clientId, teamId },
    });
    if (!client) throw new Error("Client not found");
  } else {
    teamId = null;
    clientId = null;
  }

  const title = data.title.trim();

  const template = data.templateId
    ? await prisma.formTemplate.findUnique({
        where: { id: data.templateId },
        include: { questions: { orderBy: { order: "asc" } } },
      })
    : null;

  if (data.templateId && !template) throw new Error("Template not found");

  const form = await prisma.form.create({
    data: {
      teamId,
      clientId,
      createdById: userId,
      title,
      status: "DRAFT",
      sourceTemplateId: template?.id ?? null,
    },
  });

  if (template && template.questions.length > 0) {
    await prisma.question.createMany({
      data: template.questions.map((question) => ({
        formId: form.id,
        type: question.type,
        label: question.label,
        description: question.description,
        order: question.order,
        required: question.required,
        options:
          question.options === null
            ? Prisma.JsonNull
            : (question.options as Prisma.InputJsonValue),
        logic:
          question.logic === null
            ? Prisma.JsonNull
            : (question.logic as Prisma.InputJsonValue),
      })),
    });
  }

  return form;
}

export async function createClientForm(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  title: string
) {
  return createFormForUser(userId, role, { title, teamId, clientId });
}

export async function updateClientForm(
  userId: string,
  role: UserRole,
  _teamId: string | undefined,
  _clientId: string | undefined,
  formId: string,
  title: string,
  description?: string | null,
  thankYouTitle?: string | null,
  thankYouMessage?: string | null,
  headerImageUrl?: string | null | undefined,
  thankYouImageUrl?: string | null | undefined,
  thankYouBgColor?: string | null | undefined
) {
  await requireFormAccess(userId, role, formId);

  return prisma.form.update({
    where: { id: formId },
    data: {
      title,
      description: description?.trim() ? description.trim() : null,
      thankYouTitle: thankYouTitle?.trim() ? thankYouTitle.trim() : null,
      thankYouMessage: thankYouMessage?.trim() ? thankYouMessage.trim() : null,
      ...(headerImageUrl !== undefined ? { headerImageUrl } : {}),
      ...(thankYouImageUrl !== undefined ? { thankYouImageUrl } : {}),
      ...(thankYouBgColor !== undefined
        ? {
            thankYouBgColor: thankYouBgColor?.trim()
              ? thankYouBgColor.trim()
              : null,
          }
        : {}),
    },
  });
}

export async function deleteClientForm(
  userId: string,
  role: UserRole,
  _teamId: string | undefined,
  _clientId: string | undefined,
  formId: string
) {
  await requireFormAccess(userId, role, formId);

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      surveys: { include: { _count: { select: { responses: true } } } },
    },
  });
  if (!form) throw new Error("Form not found");

  const hasFilled = form.surveys.some((survey) => survey._count.responses > 0);
  if (hasFilled) {
    throw new Error(
      "This form has submitted responses. Unpublish it instead of deleting."
    );
  }

  return prisma.form.delete({ where: { id: formId } });
}

export async function setClientFormPublish(
  userId: string,
  role: UserRole,
  _teamId: string | undefined,
  _clientId: string | undefined,
  formId: string,
  publish: boolean
) {
  await requireFormAccess(userId, role, formId);

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!form) throw new Error("Form not found");

  if (publish) {
    if (!form.clientId) {
      throw new Error(
        "Link this form to a client before publishing. Use Integrate with client on the builder."
      );
    }
    if (form.questions.length < 1) {
      throw new Error("Add at least one field before publishing.");
    }

    await prisma.form.update({
      where: { id: formId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    const existing = await prisma.clientSurvey.findFirst({
      where: { formId },
    });

    if (!existing) {
      await prisma.clientSurvey.create({
        data: {
          formId,
          clientId: form.clientId,
          status: "UPCOMING",
        },
      });
    }

    return prisma.form.findUniqueOrThrow({ where: { id: formId } });
  }

  return prisma.form.update({
    where: { id: formId },
    data: { status: "DRAFT" },
  });
}

export async function addFieldToForm(
  userId: string,
  role: UserRole,
  _teamId: string | undefined,
  _clientId: string | undefined,
  formId: string,
  type: QuestionType,
  sectionId?: string | null
) {
  await requireFormAccess(userId, role, formId);

  const meta = fieldTypeMeta(type);
  if (!meta) throw new Error("Unknown field type");

  if (type === "BRANCHING_DROPDOWN") {
    if (sectionId) {
      throw new Error("Section branching belongs in intro questions only.");
    }
    const existingBranch = await prisma.question.findFirst({
      where: { formId, type: "BRANCHING_DROPDOWN", sectionId: null },
    });
    if (existingBranch) {
      throw new Error("This form already has a section branching field.");
    }
  }

  if (sectionId) {
    const section = await prisma.formSection.findFirst({
      where: { id: sectionId, formId },
    });
    if (!section) throw new Error("Section not found");
  }

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: { select: { order: true } } },
  });
  if (!form) throw new Error("Form not found");

  const nextOrder =
    form.questions.reduce((max, item) => Math.max(max, item.order), 0) + 1;

  let options: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
  if ("defaultOptions" in meta && meta.defaultOptions) {
    options = buildChoiceOptions([...meta.defaultOptions]) as Prisma.InputJsonValue;
  }

  return prisma.question.create({
    data: {
      formId,
      sectionId: sectionId ?? null,
      type,
      label: meta.defaultLabel,
      required: false,
      order: nextOrder,
      options,
    },
  });
}

export async function addSectionToForm(
  userId: string,
  role: UserRole,
  _teamId: string | undefined,
  _clientId: string | undefined,
  formId: string,
  branchValue: string
) {
  await requireFormAccess(userId, role, formId);

  const trimmed = branchValue.trim();
  if (!trimmed) throw new Error("Choose a section option.");

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      questions: {
        where: { sectionId: null },
        orderBy: { order: "asc" },
      },
      sections: { select: { order: true, branchValue: true } },
    },
  });
  if (!form) throw new Error("Form not found");

  const branchingField = form.questions.find(
    (question) => question.type === "BRANCHING_DROPDOWN"
  );
  if (!branchingField) {
    throw new Error("Add a section branching field before creating sections.");
  }

  const options = getChoiceList(branchingField.options);
  if (!options.includes(trimmed)) {
    throw new Error("That option is not on the section branching field.");
  }

  if (form.sections.some((section) => section.branchValue === trimmed)) {
    throw new Error("A section for that option already exists.");
  }

  const nextOrder =
    form.sections.reduce((max, item) => Math.max(max, item.order), 0) + 1;

  const logic = buildQuestionLogic({
    questionId: branchingField.id,
    operator: "equals",
    value: trimmed,
  });

  return prisma.formSection.create({
    data: {
      formId,
      title: trimmed,
      branchValue: trimmed,
      order: nextOrder,
      logic: logic ? (logic as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  });
}

export async function updateSectionOnForm(
  userId: string,
  role: UserRole,
  _teamId: string | undefined,
  _clientId: string | undefined,
  formId: string,
  sectionId: string,
  data: {
    description?: string;
  }
) {
  await requireFormAccess(userId, role, formId);

  const section = await prisma.formSection.findFirst({
    where: { id: sectionId, formId },
  });
  if (!section) throw new Error("Section not found");

  return prisma.formSection.update({
    where: { id: sectionId },
    data: {
      description: data.description?.trim() ? data.description.trim() : null,
    },
  });
}

export async function deleteSectionOnForm(
  userId: string,
  role: UserRole,
  _teamId: string | undefined,
  _clientId: string | undefined,
  formId: string,
  sectionId: string
) {
  await requireFormAccess(userId, role, formId);

  const section = await prisma.formSection.findFirst({
    where: { id: sectionId, formId },
    include: {
      questions: { include: { _count: { select: { answers: true } } } },
    },
  });
  if (!section) throw new Error("Section not found");

  const hasAnswers = section.questions.some(
    (question) => question._count.answers > 0
  );
  if (hasAnswers) {
    throw new Error(
      "This section has submitted answers. Leave it so existing responses stay readable."
    );
  }

  await prisma.$transaction([
    prisma.question.deleteMany({ where: { sectionId } }),
    prisma.formSection.delete({ where: { id: sectionId } }),
  ]);
}

export async function updateFieldOnForm(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  formId: string,
  fieldId: string,
  data: {
    label: string;
    description?: string;
    required: boolean;
    optionsText?: string;
    maxLength?: number;
    allowOther?: boolean;
  }
) {
  await requireFormAccess(userId, role, formId);

  const field = await prisma.question.findFirst({
    where: { id: fieldId, formId },
  });
  if (!field) throw new Error("Field not found");

  const plugin = getFieldType(field.type);
  let options: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
  let nextChoices: string[] | null = null;

  if (fieldNeedsOptions(field.type)) {
    const parsed = (data.optionsText ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const minimum = minOptionsForType(field.type);
    if (parsed.length < minimum) {
      throw new Error(
        field.type === "RESOURCE_RATING"
          ? "Add at least one name to rate."
          : "Add at least one option."
      );
    }
    if (field.type === "BRANCHING_DROPDOWN") {
      const unique = new Set(parsed);
      if (unique.size !== parsed.length) {
        throw new Error("Section branching options must be unique.");
      }
    }
    nextChoices = parsed;
    options = buildChoiceOptions(parsed, data.allowOther) as Prisma.InputJsonValue;
  } else if (plugin?.supportsMaxLength && data.maxLength) {
    options = buildTextOptions(data.maxLength) as Prisma.InputJsonValue;
  }

  if (field.type === "BRANCHING_DROPDOWN" && nextChoices) {
    await syncBranchingOptionSections({
      formId,
      branchingQuestionId: field.id,
      previousOptions: getChoiceList(field.options),
      nextOptions: nextChoices,
    });
  }

  return prisma.question.update({
    where: { id: fieldId },
    data: {
      label: data.label,
      description: data.description?.trim() ? data.description.trim() : null,
      required: data.required,
      options,
    },
  });
}

async function syncBranchingOptionSections(input: {
  formId: string;
  branchingQuestionId: string;
  previousOptions: string[];
  nextOptions: string[];
}) {
  const { formId, branchingQuestionId, previousOptions, nextOptions } = input;
  const renames = new Map<string, string>();

  if (previousOptions.length === nextOptions.length) {
    for (let index = 0; index < previousOptions.length; index += 1) {
      const previous = previousOptions[index];
      const next = nextOptions[index];
      if (previous !== next) renames.set(previous, next);
    }
  }

  const removed = previousOptions.filter((option) => !nextOptions.includes(option));
  const sections = await prisma.formSection.findMany({
    where: { formId, branchValue: { not: null } },
  });

  for (const option of removed) {
    if (renames.has(option)) continue;
    const linked = sections.find((section) => section.branchValue === option);
    if (linked) {
      throw new Error(
        `Remove the "${option}" section before deleting that branching option.`
      );
    }
  }

  if (renames.size === 0) return;

  const plannedValues = sections
    .map((section) => {
      const current = section.branchValue;
      if (!current) return null;
      return renames.get(current) ?? current;
    })
    .filter((value): value is string => Boolean(value));

  if (new Set(plannedValues).size !== plannedValues.length) {
    throw new Error(
      "Another section is already linked to that option. Use unique option names."
    );
  }

  const linkedToRename = sections.filter(
    (section) => section.branchValue && renames.has(section.branchValue)
  );
  if (linkedToRename.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const section of linkedToRename) {
      await tx.formSection.update({
        where: { id: section.id },
        data: {
          branchValue: `__tmp__${section.id}`,
        },
      });
    }

    for (const section of linkedToRename) {
      const previous = section.branchValue!;
      const next = renames.get(previous)!;
      const logic = buildQuestionLogic({
        questionId: branchingQuestionId,
        operator: "equals",
        value: next,
      });
      await tx.formSection.update({
        where: { id: section.id },
        data: {
          title: next,
          branchValue: next,
          logic: logic ? (logic as Prisma.InputJsonValue) : Prisma.DbNull,
        },
      });
    }
  });
}

export async function duplicateFieldOnForm(
  userId: string,
  role: UserRole,
  _teamId: string | undefined,
  _clientId: string | undefined,
  formId: string,
  fieldId: string
) {
  await requireFormAccess(userId, role, formId);

  const field = await prisma.question.findFirst({
    where: { id: fieldId, formId },
  });
  if (!field) throw new Error("Field not found");

  if (field.type === "BRANCHING_DROPDOWN") {
    throw new Error("Only one section branching field is allowed.");
  }

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: { select: { order: true } } },
  });
  if (!form) throw new Error("Form not found");

  const nextOrder =
    form.questions.reduce((max, item) => Math.max(max, item.order), 0) + 1;

  return prisma.question.create({
    data: {
      formId,
      sectionId: field.sectionId,
      type: field.type,
      label: `${field.label} (copy)`,
      description: field.description,
      required: field.required,
      order: nextOrder,
      options:
        field.options === null
          ? Prisma.JsonNull
          : (field.options as Prisma.InputJsonValue),
    },
  });
}

export async function duplicateFormForUser(
  userId: string,
  role: UserRole,
  formId: string
) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      questions: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
    },
  });
  if (!form) throw new Error("Form not found");
  if (!(await userCanAccessFormRecord(userId, role, form))) {
    throw new Error("No access");
  }

  const copy = await prisma.form.create({
    data: {
      teamId: form.teamId,
      clientId: form.clientId,
      createdById: userId,
      title: `${form.title} (copy)`,
      description: form.description,
      thankYouTitle: form.thankYouTitle,
      thankYouMessage: form.thankYouMessage,
      headerImageUrl: form.headerImageUrl,
      thankYouImageUrl: form.thankYouImageUrl,
      thankYouBgColor: form.thankYouBgColor,
      status: "DRAFT",
      sourceTemplateId: form.sourceTemplateId,
    },
  });

  if (form.sections.length > 0) {
    const sectionMap = new Map<string, string>();
    for (const section of form.sections) {
      const created = await prisma.formSection.create({
        data: {
          formId: copy.id,
          title: section.title,
          description: section.description,
          order: section.order,
          branchValue: section.branchValue,
          logic:
            section.logic === null
              ? Prisma.JsonNull
              : (section.logic as Prisma.InputJsonValue),
        },
      });
      sectionMap.set(section.id, created.id);
    }

    if (form.questions.length > 0) {
      await prisma.question.createMany({
        data: form.questions.map((question) => ({
          formId: copy.id,
          sectionId: question.sectionId
            ? sectionMap.get(question.sectionId) ?? null
            : null,
          type: question.type,
          label: question.label,
          description: question.description,
          order: question.order,
          required: question.required,
          options:
            question.options === null
              ? Prisma.JsonNull
              : (question.options as Prisma.InputJsonValue),
        })),
      });
    }
  } else if (form.questions.length > 0) {
    await prisma.question.createMany({
      data: form.questions.map((question) => ({
        formId: copy.id,
        type: question.type,
        label: question.label,
        description: question.description,
        order: question.order,
        required: question.required,
        options:
          question.options === null
            ? Prisma.JsonNull
            : (question.options as Prisma.InputJsonValue),
      })),
    });
  }

  return copy;
}

export async function deleteFieldOnForm(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  formId: string,
  fieldId: string
) {
  await requireFormAccess(userId, role, formId);

  const field = await prisma.question.findFirst({
    where: { id: fieldId, formId },
    include: { _count: { select: { answers: true } } },
  });
  if (!field) throw new Error("Field not found");

  if (field.type === "BRANCHING_DROPDOWN") {
    const linkedSections = await prisma.formSection.count({
      where: { formId, branchValue: { not: null } },
    });
    if (linkedSections > 0) {
      throw new Error(
        "Remove linked sections before deleting the section branching field."
      );
    }
  }

  if (field._count.answers > 0) {
    throw new Error(
      "This field has submitted answers. Leave it so existing responses stay readable."
    );
  }

  await prisma.question.delete({ where: { id: fieldId } });

  const remaining = await prisma.question.findMany({
    where: { formId },
    orderBy: { order: "asc" },
  });

  await prisma.$transaction(
    remaining.map((item, index) =>
      prisma.question.update({
        where: { id: item.id },
        data: { order: index + 1 },
      })
    )
  );
}

export async function reorderFieldsOnForm(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  formId: string,
  orderedIds: string[]
) {
  await requireFormAccess(userId, role, formId);

  const fields = await prisma.question.findMany({
    where: { formId },
    select: { id: true },
  });

  const allowedIds = new Set(fields.map((item) => item.id));
  // Ignore stale ids from optimistic UI; only reorder ids that still exist.
  const nextIds = orderedIds.filter((id) => allowedIds.has(id));
  if (nextIds.length === 0) {
    throw new Error("No fields to reorder.");
  }
  if (nextIds.length !== fields.length) {
    // Field list changed mid-drag (add/delete). Persist what we can for matching ids.
    const missing = [...allowedIds].filter((id) => !nextIds.includes(id));
    nextIds.push(...missing);
  }

  await prisma.$transaction(
    nextIds.map((id, index) =>
      prisma.question.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  );
}

/** Link an independent draft form to a client so it can be published. */
export async function attachFormToClient(
  userId: string,
  role: UserRole,
  formId: string,
  teamId: string,
  clientId: string
) {
  const form = await requireFormAccess(userId, role, formId);
  if (form.status === "PUBLISHED" && form.clientId && form.clientId !== clientId) {
    throw new Error("This published form is already linked to another client.");
  }

  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) throw new Error("No access");

  const client = await prisma.client.findFirst({
    where: { id: clientId, teamId },
  });
  if (!client) throw new Error("Client not found");

  if (form.clientId && form.clientId !== clientId) {
    throw new Error("This form is already linked to a different client.");
  }

  return prisma.form.update({
    where: { id: formId },
    data: { teamId, clientId },
  });
}

/** Replace form fields with a template’s fields, or clear to blank when templateId is empty. */
export async function applyTemplateToForm(
  userId: string,
  role: UserRole,
  formId: string,
  templateId: string | null
) {
  const form = await requireFormAccess(userId, role, formId);
  if (form.status === "PUBLISHED") {
    throw new Error("Unpublish the form before changing the field layout.");
  }

  const surveys = await prisma.clientSurvey.findMany({
    where: { formId },
    include: { _count: { select: { responses: true } } },
  });
  if (formHasSubmission(surveys)) {
    throw new Error("Cannot change fields after responses exist.");
  }

  if (!templateId) {
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { formId } }),
      prisma.form.update({
        where: { id: formId },
        data: { sourceTemplateId: null },
      }),
    ]);
    return getFormBuilder(userId, role, formId);
  }

  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!template) throw new Error("Template not found");

  await prisma.$transaction(async (tx) => {
    await tx.question.deleteMany({ where: { formId } });
    if (template.questions.length > 0) {
      await tx.question.createMany({
        data: template.questions.map((question) => ({
          formId,
          type: question.type,
          label: question.label,
          description: question.description,
          order: question.order,
          required: question.required,
          options:
            question.options === null
              ? Prisma.JsonNull
              : (question.options as Prisma.InputJsonValue),
          logic:
            question.logic === null
              ? Prisma.JsonNull
              : (question.logic as Prisma.InputJsonValue),
        })),
      });
    }
    await tx.form.update({
      where: { id: formId },
      data: { sourceTemplateId: template.id },
    });
  });

  return getFormBuilder(userId, role, formId);
}

export async function getPublishedFormByToken(token: string) {
  return prisma.form.findFirst({
    where: { publicToken: token },
    include: {
      client: true,
      createdBy: { select: { email: true, name: true } },
      sections: { orderBy: { order: "asc" } },
      questions: { orderBy: { order: "asc" } },
      surveys: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { responses: true } } },
      },
    },
  });
}

export async function submitPublicForm(
  token: string,
  formData: FormData
) {
  const form = await getPublishedFormByToken(token);
  if (!form || form.status !== "PUBLISHED") {
    throw new Error("This form is not accepting responses.");
  }
  if (formHasSubmission(form.surveys)) {
    throw new Error("This form has already been submitted.");
  }

  let survey = form.surveys[0];
  if (!survey) {
    survey = await prisma.clientSurvey.create({
      data: {
        formId: form.id,
        clientId: form.clientId,
        status: "IN_PROGRESS",
      },
      include: { _count: { select: { responses: true } } },
    });
  }

  const answers: { questionId: string; value: string }[] = [];

  const sectionRecords = (form.sections ?? []).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
    branchValue: section.branchValue,
    logic: section.logic,
  }));
  const questionRecords = form.questions.map((question) => ({
    id: question.id,
    type: question.type,
    label: question.label,
    description: question.description,
    required: question.required,
    options: question.options,
    sectionId: question.sectionId,
    order: question.order,
  }));

  const parsedAnswers: Record<string, string> = {};
  for (const question of questionRecords) {
    const plugin = getFieldType(question.type);
    if (plugin && !plugin.hasAnswer) continue;
    const value = parseFieldAnswer(
      question.type,
      formData,
      question.id,
      question.options
    );
    if (value) parsedAnswers[question.id] = value;
  }

  const submittableQuestions = getVisibleQuestionsForSubmit(
    sectionRecords,
    questionRecords,
    parsedAnswers
  );

  for (const question of submittableQuestions) {
    const plugin = getFieldType(question.type);
    if (plugin && !plugin.hasAnswer) continue;

    const value =
      parsedAnswers[question.id] ??
      parseFieldAnswer(question.type, formData, question.id, question.options);

    if (question.type === "RESOURCE_RATING") {
      const rows = getChoiceList(question.options);
      const scores = JSON.parse(value || "[]") as Array<{ score?: string }>;
      if (question.required && scores.some((item) => !item.score)) {
        throw new Error("Please rate every name.");
      }
    } else if (question.type === "MULTIPLE_CHOICE") {
      const selected = JSON.parse(value || "[]") as string[];
      if (question.required && selected.length === 0) {
        throw new Error("Please complete all required questions.");
      }
    } else if (question.required && !value) {
      throw new Error("Please complete all required questions.");
    }

    if (value) {
      answers.push({ questionId: question.id, value });
    }
  }

  await prisma.$transaction(async (tx) => {
    const already = await tx.response.count({
      where: { clientSurvey: { formId: form.id } },
    });
    if (already > 0) {
      throw new Error("This form has already been submitted.");
    }

    const response = await tx.response.create({
      data: { clientSurveyId: survey.id },
    });
    if (answers.length > 0) {
      await tx.answer.createMany({
        data: answers.map((answer) => ({
          responseId: response.id,
          questionId: answer.questionId,
          value: answer.value,
        })),
      });
    }
    await tx.clientSurvey.update({
      where: { id: survey.id },
      data: { status: "CLOSED", submittedAt: new Date() },
    });
  });

  // Email notification should happen after the DB transaction completes.
  if (form.createdBy?.email) {
    const mail = feedbackSubmittedEmail({
      recipientName: form.createdBy.name,
      formTitle: form.title,
      clientName: form.client?.name,
      responsesUrl: `${getAppBaseUrl()}/dashboard/responses`,
    });
    await sendEmail({
      to: form.createdBy.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }
}
