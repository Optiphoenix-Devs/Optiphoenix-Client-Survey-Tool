import { prisma } from "@/lib/prisma";
import type { QuestionType, UserRole } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { userCanManageTeam } from "@/lib/teams";
import { fieldNeedsOptions, fieldTypeMeta, minOptionsForType, parseOptionList } from "@/lib/question-types";

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
        },
      },
    },
  });
}

export async function getClientFormBuilder(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  formId: string
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) return null;

  return prisma.form.findFirst({
    where: { id: formId, teamId, clientId },
    include: {
      client: true,
      team: true,
      questions: { orderBy: { order: "asc" } },
    },
  });
}

export async function createClientForm(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  title: string
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) throw new Error("No access");

  const client = await prisma.client.findFirst({
    where: { id: clientId, teamId },
  });
  if (!client) throw new Error("Client not found");

  return prisma.form.create({
    data: {
      teamId,
      clientId,
      createdById: userId,
      title,
      status: "DRAFT",
    },
  });
}

export async function updateClientForm(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  formId: string,
  title: string
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) throw new Error("No access");

  const form = await prisma.form.findFirst({
    where: { id: formId, teamId, clientId },
  });
  if (!form) throw new Error("Form not found");

  return prisma.form.update({
    where: { id: formId },
    data: { title },
  });
}

export async function deleteClientForm(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  formId: string
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) throw new Error("No access");

  const form = await prisma.form.findFirst({
    where: { id: formId, teamId, clientId },
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
  teamId: string,
  clientId: string,
  formId: string,
  publish: boolean
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) throw new Error("No access");

  const form = await prisma.form.findFirst({
    where: { id: formId, teamId, clientId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!form) throw new Error("Form not found");

  if (publish) {
    if (form.questions.length < 1) {
      throw new Error("Add at least one field before publishing.");
    }

    await prisma.form.update({
      where: { id: formId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    const existing = await prisma.clientSurvey.findFirst({
      where: { formId, clientId },
    });

    if (!existing) {
      await prisma.clientSurvey.create({
        data: {
          formId,
          clientId,
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
  teamId: string,
  clientId: string,
  formId: string,
  type: QuestionType
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) throw new Error("No access");

  const meta = fieldTypeMeta(type);
  if (!meta) throw new Error("Unknown field type");

  const form = await prisma.form.findFirst({
    where: { id: formId, teamId, clientId },
    include: { questions: { select: { order: true } } },
  });
  if (!form) throw new Error("Form not found");

  const nextOrder =
    form.questions.reduce((max, item) => Math.max(max, item.order), 0) + 1;

  let options: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
  if ("defaultOptions" in meta) {
    options = [...meta.defaultOptions];
  }

  return prisma.question.create({
    data: {
      formId,
      type,
      label: meta.defaultLabel,
      required: false,
      order: nextOrder,
      options,
    },
  });
}

export async function updateFieldOnForm(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  formId: string,
  fieldId: string,
  data: { label: string; required: boolean; optionsText?: string }
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) throw new Error("No access");

  const field = await prisma.question.findFirst({
    where: { id: fieldId, formId, form: { teamId, clientId } },
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

  return prisma.question.update({
    where: { id: fieldId },
    data: {
      label: data.label,
      required: data.required,
      options,
    },
  });
}

export async function deleteFieldOnForm(
  userId: string,
  role: UserRole,
  teamId: string,
  clientId: string,
  formId: string,
  fieldId: string
) {
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) throw new Error("No access");

  const field = await prisma.question.findFirst({
    where: { id: fieldId, formId, form: { teamId, clientId } },
    include: { _count: { select: { answers: true } } },
  });
  if (!field) throw new Error("Field not found");

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
  const allowed = await userCanManageTeam(userId, role, teamId);
  if (!allowed) throw new Error("No access");

  const fields = await prisma.question.findMany({
    where: { formId, form: { teamId, clientId } },
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
      prisma.question.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  );
}

export async function getPublishedFormByToken(token: string) {
  return prisma.form.findFirst({
    where: { publicToken: token },
    include: {
      client: true,
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

  for (const question of form.questions) {
    let value = "";

    if (question.type === "RESOURCE_RATING") {
      const rows = parseOptionList(question.options);
      const scores = rows.map((row, index) => ({
        name: row,
        score: String(formData.get(`q_${question.id}__${index}`) ?? ""),
      }));
      if (question.required && scores.some((item) => !item.score)) {
        throw new Error("Please rate every name.");
      }
      value = JSON.stringify(scores);
    } else if (question.type === "MULTIPLE_CHOICE") {
      const selected = formData
        .getAll(`q_${question.id}[]`)
        .map(String)
        .filter(Boolean);
      if (question.required && selected.length === 0) {
        throw new Error("Please complete all required questions.");
      }
      value = JSON.stringify(selected);
    } else {
      value = String(formData.get(`q_${question.id}`) ?? "").trim();
      if (question.required && !value) {
        throw new Error("Please complete all required questions.");
      }
    }

    answers.push({ questionId: question.id, value });
  }

  await prisma.$transaction(async (tx) => {
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
}
