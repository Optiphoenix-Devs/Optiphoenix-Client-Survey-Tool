import { prisma } from "@/lib/prisma";
import type { QuestionType, UserRole } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { requireFormAccess } from "@/lib/forms";
import { fieldNeedsOptions, fieldTypeMeta, minOptionsForType } from "@/lib/question-types";

export type TemplateListRow = {
  id: string;
  name: string;
  description: string | null;
  fieldCount: number;
  createdByName: string;
  createdById: string;
  updatedAt: string;
  canManage: boolean;
};

export async function getTemplatesForUser(userId: string, role: UserRole) {
  const templates = await prisma.formTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdById: true,
      updatedAt: true,
      _count: { select: { questions: true } },
    },
  });

  if (templates.length === 0) return [] satisfies TemplateListRow[];

  const creators = await prisma.user.findMany({
    where: { id: { in: [...new Set(templates.map((item) => item.createdById))] } },
    select: { id: true, name: true },
  });
  const creatorName = new Map(creators.map((user) => [user.id, user.name]));

  return templates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    fieldCount: template._count.questions,
    createdByName: creatorName.get(template.createdById) ?? "Unknown",
    createdById: template.createdById,
    updatedAt: template.updatedAt.toISOString(),
    canManage: role === "ADMIN" || template.createdById === userId,
  })) satisfies TemplateListRow[];
}

export async function saveFormAsTemplate(
  userId: string,
  role: UserRole,
  formId: string,
  name: string,
  description?: string | null
) {
  const form = await requireFormAccess(userId, role, formId);
  const questions = await prisma.question.findMany({
    where: { formId: form.id },
    orderBy: { order: "asc" },
  });
  if (questions.length === 0) {
    throw new Error("Add at least one field before saving a template.");
  }

  return prisma.formTemplate.create({
    data: {
      name: name.trim(),
      description: description?.trim() ? description.trim() : null,
      createdById: userId,
      questions: {
        create: questions.map((question) => ({
          type: question.type,
          label: question.label,
          description: question.description,
          order: question.order,
          required: question.required,
          options:
            question.options === null
              ? Prisma.DbNull
              : (question.options as Prisma.InputJsonValue),
        })),
      },
    },
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
  if (role !== "ADMIN" && template.createdById !== userId) {
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
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!template) return null;
  if (role !== "ADMIN" && template.createdById !== userId) return null;
  return template;
}

export async function updateTemplateMeta(
  userId: string,
  role: UserRole,
  templateId: string,
  name: string,
  description?: string | null
) {
  await requireTemplateAccess(userId, role, templateId);
  return prisma.formTemplate.update({
    where: { id: templateId },
    data: {
      name: name.trim(),
      description: description?.trim() ? description.trim() : null,
    },
  });
}

export async function addFieldToTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
  type: QuestionType
) {
  await requireTemplateAccess(userId, role, templateId);
  const meta = fieldTypeMeta(type);
  if (!meta) throw new Error("Unknown field type");

  const existing = await prisma.formTemplateQuestion.findMany({
    where: { templateId },
    select: { order: true },
  });
  const nextOrder =
    existing.reduce((max, item) => Math.max(max, item.order), 0) + 1;

  let options: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
  if ("defaultOptions" in meta) {
    options = [...meta.defaultOptions];
  }

  return prisma.formTemplateQuestion.create({
    data: {
      templateId,
      type,
      label: meta.defaultLabel,
      required: false,
      order: nextOrder,
      options,
    },
  });
}

export async function updateFieldOnTemplate(
  userId: string,
  role: UserRole,
  templateId: string,
  fieldId: string,
  data: { label: string; required: boolean; optionsText?: string }
) {
  await requireTemplateAccess(userId, role, templateId);
  const field = await prisma.formTemplateQuestion.findFirst({
    where: { id: fieldId, templateId },
  });
  if (!field) throw new Error("Field not found");

  let options: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
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
    options = parsed;
  }

  return prisma.formTemplateQuestion.update({
    where: { id: fieldId },
    data: {
      label: data.label,
      required: data.required,
      options,
    },
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
