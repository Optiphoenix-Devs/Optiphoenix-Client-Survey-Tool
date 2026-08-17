import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { formsAccessibleWhere, userCanAccessFormRecord } from "@/lib/forms";
import { getTeamsForUser } from "@/lib/teams";
import { fieldTypeMeta } from "@/lib/question-types";

export type ResponseListRow = {
  id: string;
  submittedAt: string;
  formId: string;
  formTitle: string;
  clientName: string;
  teamId: string;
  teamName: string;
  formHref: string;
  href: string;
  preview: string;
};

export type ResponseDetail = {
  id: string;
  submittedAt: string;
  formId: string;
  formTitle: string;
  clientName: string;
  teamId: string;
  teamName: string;
  formHref: string;
  answers: Array<{
    id: string;
    questionId: string;
    label: string;
    type: string;
    typeLabel: string;
    value: string;
    display: string;
  }>;
};

export async function getResponsesForUser(
  userId: string,
  role: UserRole,
  formId?: string
) {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);

  const rows = await prisma.response.findMany({
    where: {
      clientSurvey: {
        form: formId ? { AND: [formAccess, { id: formId }] } : formAccess,
      },
    },
    orderBy: { submittedAt: "desc" },
    include: {
      answers: {
        include: { question: { select: { label: true, order: true, type: true } } },
        orderBy: { question: { order: "asc" } },
      },
      clientSurvey: {
        include: {
          form: {
            include: {
              client: { select: { id: true, name: true } },
              team: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return rows.map((row) => {
    const form = row.clientSurvey.form;
    const first = row.answers.find((answer) => answer.value.trim().length > 0);
    return {
      id: row.id,
      submittedAt: row.submittedAt.toISOString(),
      formId: form.id,
      formTitle: form.title,
      clientName: form.client?.name ?? "—",
      teamId: form.teamId ?? "",
      teamName: form.team?.name ?? "—",
      formHref: `/dashboard/forms/${form.id}`,
      href: `/dashboard/responses/${row.id}`,
      preview: first
        ? formatAnswerValue(first.question.type, first.value)
        : "No answers",
    };
  });
}

export async function getResponseDetail(
  userId: string,
  role: UserRole,
  responseId: string
) {
  const row = await prisma.response.findUnique({
    where: { id: responseId },
    include: {
      answers: {
        include: {
          question: {
            select: { id: true, label: true, order: true, type: true },
          },
        },
        orderBy: { question: { order: "asc" } },
      },
      clientSurvey: {
        include: {
          form: {
            include: {
              client: { select: { id: true, name: true } },
              team: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!row) return null;

  const form = row.clientSurvey.form;
  if (!(await userCanAccessFormRecord(userId, role, form))) return null;

  return {
    id: row.id,
    submittedAt: row.submittedAt.toISOString(),
    formId: form.id,
    formTitle: form.title,
    clientName: form.client?.name ?? "—",
    teamId: form.teamId ?? "",
    teamName: form.team?.name ?? "—",
    formHref: `/dashboard/forms/${form.id}`,
    answers: row.answers.map((answer) => ({
      id: answer.id,
      questionId: answer.question.id,
      label: answer.question.label,
      type: answer.question.type,
      typeLabel: fieldTypeMeta(answer.question.type)?.label ?? answer.question.type,
      value: answer.value,
      display: formatAnswerValue(answer.question.type, answer.value),
    })),
  } satisfies ResponseDetail;
}

export function formatAnswerValue(type: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "—";

  if (type === "MULTIPLE_CHOICE") {
    try {
      const items = JSON.parse(trimmed) as unknown;
      if (Array.isArray(items) && items.length > 0) {
        return items.map(String).join(", ");
      }
      return "—";
    } catch {
      return trimmed;
    }
  }

  if (type === "RESOURCE_RATING") {
    try {
      const rows = JSON.parse(trimmed) as Array<{ name?: string; score?: string }>;
      if (!Array.isArray(rows) || rows.length === 0) return "—";
      return rows
        .map((row) => `${row.name ?? "Name"}: ${row.score ? `${row.score}/5` : "—"}`)
        .join(" · ");
    } catch {
      return trimmed;
    }
  }

  if (type === "RATING") return `${trimmed}/5`;
  return trimmed;
}
