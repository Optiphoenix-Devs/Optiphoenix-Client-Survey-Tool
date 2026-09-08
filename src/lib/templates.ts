import { prisma } from "@/lib/prisma";
import type { QuestionType, UserRole } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { requireFormAccess } from "@/lib/forms";
import { buildQuestionLogic } from "@/lib/field-types/logic";
import {
  buildChoiceOptions,
  buildTextOptions,
  fieldNeedsOptions,
  fieldTypeMeta,
  getChoiceList,
  getFieldType,
  minOptionsForType,
} from "@/lib/question-types";

export type TemplateListRow = {
  id: string;
  name: string;
  description: string | null;
  fieldCount: number;
  createdByName: string;
  createdById: string;
  updatedAt: string;
  canManage: boolean;
  canShare: boolean;
  /** True when this user created the template. */
  isOwned: boolean;
  /** User hid this non-owned template from their board. */
  isHidden: boolean;
  canHide: boolean;
};

export function templatesAccessibleWhere(
  userId: string,
  role: UserRole,
  email?: string | null
): Prisma.FormTemplateWhereInput {
  if (role === "ADMIN") return {};
  const shareOr: Prisma.FormTemplateShareWhereInput[] = [{ userId }];
  if (email) {
    shareOr.push({ email: email.trim().toLowerCase() });
  }
  return {
    OR: [
      { createdById: userId },
      { shares: { some: { OR: shareOr } } },
    ],
  };
}

export async function userCanViewTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
  email?: string | null
) {
  if (role === "ADMIN") {
    const template = await prisma.formTemplate.findUnique({
      where: { id: templateId },
      select: { id: true },
    });
    return Boolean(template);
  }

  const shareOr: Prisma.FormTemplateShareWhereInput[] = [{ userId }];
  if (email) {
    shareOr.push({ email: email.trim().toLowerCase() });
  }

  const template = await prisma.formTemplate.findFirst({
    where: {
      id: templateId,
      OR: [
        { createdById: userId },
        { shares: { some: { OR: shareOr } } },
      ],
    },
    select: { id: true },
  });
  return Boolean(template);
}

export async function userCanManageTemplate(
  userId: string,
  role: UserRole,
  templateId: string
) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    select: { createdById: true },
  });
  if (!template) return false;
  return role === "ADMIN" || template.createdById === userId;
}

export async function getTemplatesForUser(userId: string, role: UserRole) {
  const user =
    role === "ADMIN"
      ? null
      : await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

  const [templates, hides] = await Promise.all([
    prisma.formTemplate.findMany({
      where: templatesAccessibleWhere(userId, role, user?.email),
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        createdById: true,
        updatedAt: true,
        _count: { select: { questions: true } },
      },
    }),
    prisma.formTemplateHide.findMany({
      where: { userId },
      select: { templateId: true },
    }),
  ]);

  if (templates.length === 0) return [] satisfies TemplateListRow[];

  const hiddenIds = new Set(hides.map((row) => row.templateId));

  const creators = await prisma.user.findMany({
    where: { id: { in: [...new Set(templates.map((item) => item.createdById))] } },
    select: { id: true, name: true },
  });
  const creatorName = new Map(creators.map((row) => [row.id, row.name]));

  return templates.map((template) => {
    const isOwned = template.createdById === userId;
    const canManage = role === "ADMIN" || isOwned;
    const isHidden = !isOwned && hiddenIds.has(template.id);
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      fieldCount: template._count.questions,
      createdByName:
        template.createdById === userId
          ? "You"
          : (creatorName.get(template.createdById) ?? "Unknown"),
      createdById: template.createdById,
      updatedAt: template.updatedAt.toISOString(),
      canManage,
      canShare: canManage,
      isOwned,
      isHidden,
      canHide: !isOwned,
    };
  }) satisfies TemplateListRow[];
}

export async function hideTemplateForUser(userId: string, templateId: string) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    select: { createdById: true },
  });
  if (!template) throw new Error("Template not found.");
  if (template.createdById === userId) {
    throw new Error("You can’t hide a template you created.");
  }

  await prisma.formTemplateHide.upsert({
    where: {
      templateId_userId: { templateId, userId },
    },
    create: { templateId, userId },
    update: {},
  });
}

export async function unhideTemplateForUser(userId: string, templateId: string) {
  await prisma.formTemplateHide.deleteMany({
    where: { templateId, userId },
  });
}

export async function duplicateTemplateForUser(
  userId: string,
  role: UserRole,
  templateId: string
) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const allowed = await userCanViewTemplate(
    userId,
    role,
    templateId,
    actor?.email
  );
  if (!allowed) throw new Error("No access");

  const source = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    include: {
      questions: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
    },
  });
  if (!source) throw new Error("Template not found");

  return prisma.$transaction(async (tx) => {
    const copy = await tx.formTemplate.create({
      data: {
        name: `${source.name} (copy)`,
        description: source.description,
        thankYouTitle: source.thankYouTitle,
        thankYouMessage: source.thankYouMessage,
        headerImageUrl: source.headerImageUrl,
        thankYouImageUrl: source.thankYouImageUrl,
        thankYouBgColor: source.thankYouBgColor,
        thankYouTextColor: source.thankYouTextColor,
        createdById: userId,
      },
    });

    const sectionMap = new Map<string, string>();
    for (const section of source.sections) {
      const created = await tx.formTemplateSection.create({
        data: {
          templateId: copy.id,
          title: section.title,
          description: section.description,
          order: section.order,
          branchValue: section.branchValue,
          logic:
            section.logic === null
              ? Prisma.DbNull
              : (section.logic as Prisma.InputJsonValue),
        },
      });
      sectionMap.set(section.id, created.id);
    }

    if (source.questions.length > 0) {
      await tx.formTemplateQuestion.createMany({
        data: source.questions.map((question) => ({
          templateId: copy.id,
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
              ? Prisma.DbNull
              : (question.options as Prisma.InputJsonValue),
          logic:
            question.logic === null
              ? Prisma.DbNull
              : (question.logic as Prisma.InputJsonValue),
        })),
      });
    }

    return copy;
  });
}

export async function shareTemplateWithEmail(
  actorId: string,
  role: UserRole,
  templateId: string,
  rawEmail: string
) {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const canShare = await userCanManageTemplate(actorId, role, templateId);
  if (!canShare) throw new Error("No access");

  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, name: true, createdById: true },
  });
  if (!template) throw new Error("Template not found");

  const recipient = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, name: true, email: true },
  });
  if (recipient?.role === "ADMIN") {
    throw new Error("Admins already have access to every template.");
  }
  if (recipient?.id === template.createdById) {
    throw new Error("The creator already has this template.");
  }
  if (recipient?.id === actorId) {
    throw new Error("You already have this template.");
  }

  const existing = await prisma.formTemplateShare.findUnique({
    where: { templateId_email: { templateId, email } },
  });
  if (existing) {
    throw new Error("This template is already shared with that email.");
  }

  const share = await prisma.formTemplateShare.create({
    data: {
      templateId,
      email,
      userId: recipient?.id ?? null,
      sharedById: actorId,
    },
  });

  return { share, template, recipient };
}

export async function listTemplateShares(
  actorId: string,
  role: UserRole,
  templateId: string
) {
  const canShare = await userCanManageTemplate(actorId, role, templateId);
  if (!canShare) throw new Error("No access");

  return prisma.formTemplateShare.findMany({
    where: { templateId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      userId: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });
}

export async function saveFormAsTemplate(
  userId: string,
  role: UserRole,
  formId: string,
  name: string,
  description?: string | null
) {
  const form = await requireFormAccess(userId, role, formId);
  const [questions, sections] = await Promise.all([
    prisma.question.findMany({
      where: { formId: form.id },
      orderBy: { order: "asc" },
    }),
    prisma.formSection.findMany({
      where: { formId: form.id },
      orderBy: { order: "asc" },
    }),
  ]);
  if (questions.length === 0) {
    throw new Error("Add at least one field before saving a template.");
  }

  return prisma.$transaction(async (tx) => {
    const template = await tx.formTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() ? description.trim() : null,
        thankYouTitle: form.thankYouTitle,
        thankYouMessage: form.thankYouMessage,
        headerImageUrl: form.headerImageUrl,
        thankYouImageUrl: form.thankYouImageUrl,
        thankYouBgColor: form.thankYouBgColor,
        thankYouTextColor: form.thankYouTextColor,
        createdById: userId,
      },
    });

    const sectionMap = new Map<string, string>();
    for (const section of sections) {
      const created = await tx.formTemplateSection.create({
        data: {
          templateId: template.id,
          title: section.title,
          description: section.description,
          order: section.order,
          branchValue: section.branchValue,
          logic:
            section.logic === null
              ? Prisma.DbNull
              : (section.logic as Prisma.InputJsonValue),
        },
      });
      sectionMap.set(section.id, created.id);
    }

    await tx.formTemplateQuestion.createMany({
      data: questions.map((question) => ({
        templateId: template.id,
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
            ? Prisma.DbNull
            : (question.options as Prisma.InputJsonValue),
        logic:
          question.logic === null
            ? Prisma.DbNull
            : (question.logic as Prisma.InputJsonValue),
      })),
    });

    return template;
  });
}

export async function deleteTemplateForUser(
  userId: string,
  role: UserRole,
  templateId: string
) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error("Template not found");
  if (role !== "ADMIN" && template.createdById !== userId) {
    throw new Error("No access");
  }
  return prisma.formTemplate.delete({ where: { id: templateId } });
}

async function requireTemplateAccess(
  userId: string,
  role: UserRole,
  templateId: string
) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error("Template not found");
  if (!(await userCanManageTemplate(userId, role, templateId))) {
    throw new Error("No access");
  }
  return template;
}

export async function createBlankTemplate(
  userId: string,
  name: string,
  description?: string | null
) {
  return prisma.formTemplate.create({
    data: {
      name: name.trim(),
      description: description?.trim() ? description.trim() : null,
      createdById: userId,
    },
  });
}

export async function getTemplateBuilder(
  userId: string,
  role: UserRole,
  templateId: string
) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const allowed = await userCanViewTemplate(
    userId,
    role,
    templateId,
    actor?.email
  );
  if (!allowed) return null;

  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    include: {
      questions: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
    },
  });
  if (!template) return null;

  const canEdit =
    role === "ADMIN" || template.createdById === userId;

  return { ...template, canEdit };
}

export async function updateTemplateMeta(
  userId: string,
  role: UserRole,
  templateId: string,
  name: string,
  description?: string | null,
  thankYouTitle?: string | null,
  thankYouMessage?: string | null,
  headerImageUrl?: string | null | undefined,
  thankYouImageUrl?: string | null | undefined,
  thankYouBgColor?: string | null | undefined,
  thankYouTextColor?: string | null | undefined
) {
  await requireTemplateAccess(userId, role, templateId);
  return prisma.formTemplate.update({
    where: { id: templateId },
    data: {
      name: name.trim(),
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
      ...(thankYouTextColor !== undefined
        ? {
            thankYouTextColor: thankYouTextColor?.trim()
              ? thankYouTextColor.trim()
              : null,
          }
        : {}),
    },
  });
}

export async function addFieldToTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
  type: QuestionType,
  sectionId?: string | null
) {
  await requireTemplateAccess(userId, role, templateId);
  const meta = fieldTypeMeta(type);
  if (!meta) throw new Error("Unknown field type");

  if (type === "BRANCHING_DROPDOWN") {
    if (sectionId) {
      throw new Error("Section branching belongs in intro questions only.");
    }
    const existingBranch = await prisma.formTemplateQuestion.findFirst({
      where: { templateId, type: "BRANCHING_DROPDOWN", sectionId: null },
    });
    if (existingBranch) {
      throw new Error("This template already has a section branching field.");
    }
  }

  if (sectionId) {
    const section = await prisma.formTemplateSection.findFirst({
      where: { id: sectionId, templateId },
    });
    if (!section) throw new Error("Section not found");
  }

  const existing = await prisma.formTemplateQuestion.findMany({
    where: { templateId },
    select: { order: true },
  });
  const nextOrder =
    existing.reduce((max, item) => Math.max(max, item.order), 0) + 1;

  let options: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
  if ("defaultOptions" in meta && meta.defaultOptions) {
    options = buildChoiceOptions([...meta.defaultOptions]) as Prisma.InputJsonValue;
  }

  return prisma.formTemplateQuestion.create({
    data: {
      templateId,
      sectionId: sectionId ?? null,
      type,
      label: meta.defaultLabel,
      required: false,
      order: nextOrder,
      options,
    },
  });
}

export async function addSectionToTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
  branchValue: string
) {
  await requireTemplateAccess(userId, role, templateId);

  const trimmed = branchValue.trim();
  if (!trimmed) throw new Error("Choose a section option.");

  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    include: {
      questions: {
        where: { sectionId: null },
        orderBy: { order: "asc" },
      },
      sections: { select: { order: true, branchValue: true } },
    },
  });
  if (!template) throw new Error("Template not found");

  const branchingField = template.questions.find(
    (question) => question.type === "BRANCHING_DROPDOWN"
  );
  if (!branchingField) {
    throw new Error("Add a section branching field before creating sections.");
  }

  const options = getChoiceList(branchingField.options);
  if (!options.includes(trimmed)) {
    throw new Error("That option is not on the section branching field.");
  }

  if (template.sections.some((section) => section.branchValue === trimmed)) {
    throw new Error("A section for that option already exists.");
  }

  const nextOrder =
    template.sections.reduce((max, item) => Math.max(max, item.order), 0) + 1;

  const logic = buildQuestionLogic({
    questionId: branchingField.id,
    operator: "equals",
    value: trimmed,
  });

  return prisma.formTemplateSection.create({
    data: {
      templateId,
      title: trimmed,
      branchValue: trimmed,
      order: nextOrder,
      logic: logic ? (logic as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  });
}

export async function updateSectionOnTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
  sectionId: string,
  data: { description?: string }
) {
  await requireTemplateAccess(userId, role, templateId);

  const section = await prisma.formTemplateSection.findFirst({
    where: { id: sectionId, templateId },
  });
  if (!section) throw new Error("Section not found");

  return prisma.formTemplateSection.update({
    where: { id: sectionId },
    data: {
      description: data.description?.trim() ? data.description.trim() : null,
    },
  });
}

export async function deleteSectionOnTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
  sectionId: string
) {
  await requireTemplateAccess(userId, role, templateId);

  const section = await prisma.formTemplateSection.findFirst({
    where: { id: sectionId, templateId },
  });
  if (!section) throw new Error("Section not found");

  await prisma.$transaction([
    prisma.formTemplateQuestion.deleteMany({ where: { sectionId } }),
    prisma.formTemplateSection.delete({ where: { id: sectionId } }),
  ]);
}

export async function updateFieldOnTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
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
  await requireTemplateAccess(userId, role, templateId);
  const field = await prisma.formTemplateQuestion.findFirst({
    where: { id: fieldId, templateId },
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
    await syncTemplateBranchingOptionSections({
      templateId,
      branchingQuestionId: field.id,
      previousOptions: getChoiceList(field.options),
      nextOptions: nextChoices,
    });
  }

  return prisma.formTemplateQuestion.update({
    where: { id: fieldId },
    data: {
      label: data.label,
      description: data.description?.trim() ? data.description.trim() : null,
      required: data.required,
      options,
    },
  });
}

async function syncTemplateBranchingOptionSections(input: {
  templateId: string;
  branchingQuestionId: string;
  previousOptions: string[];
  nextOptions: string[];
}) {
  const { templateId, branchingQuestionId, previousOptions, nextOptions } = input;
  const renames = new Map<string, string>();

  if (previousOptions.length === nextOptions.length) {
    for (let index = 0; index < previousOptions.length; index += 1) {
      const previous = previousOptions[index];
      const next = nextOptions[index];
      if (previous !== next) renames.set(previous, next);
    }
  }

  const removed = previousOptions.filter((option) => !nextOptions.includes(option));
  const sections = await prisma.formTemplateSection.findMany({
    where: { templateId, branchValue: { not: null } },
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

  await prisma.$transaction(async (tx) => {
    for (const section of linkedToRename) {
      await tx.formTemplateSection.update({
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
      await tx.formTemplateSection.update({
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

export async function deleteFieldOnTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
  fieldId: string
) {
  await requireTemplateAccess(userId, role, templateId);
  const field = await prisma.formTemplateQuestion.findFirst({
    where: { id: fieldId, templateId },
  });
  if (!field) throw new Error("Field not found");

  if (field.type === "BRANCHING_DROPDOWN") {
    const linked = await prisma.formTemplateSection.count({
      where: { templateId, branchValue: { not: null } },
    });
    if (linked > 0) {
      throw new Error(
        "Remove linked sections before deleting the section branching field."
      );
    }
  }

  await prisma.formTemplateQuestion.delete({ where: { id: fieldId } });

  const remaining = await prisma.formTemplateQuestion.findMany({
    where: { templateId },
    orderBy: { order: "asc" },
  });

  await prisma.$transaction(
    remaining.map((item, index) =>
      prisma.formTemplateQuestion.update({
        where: { id: item.id },
        data: { order: index + 1 },
      })
    )
  );
}

export async function reorderFieldsOnTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
  orderedIds: string[]
) {
  await requireTemplateAccess(userId, role, templateId);
  const fields = await prisma.formTemplateQuestion.findMany({
    where: { templateId },
  });
  const allowedIds = new Set(fields.map((item) => item.id));
  if (
    orderedIds.length !== fields.length ||
    orderedIds.some((id) => !allowedIds.has(id))
  ) {
    throw new Error("Invalid field order.");
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.formTemplateQuestion.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  );
}
