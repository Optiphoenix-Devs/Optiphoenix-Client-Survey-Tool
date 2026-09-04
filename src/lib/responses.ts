import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { formsAccessibleWhere, userCanAccessFormRecord } from "@/lib/forms";
import { getTeamsForUser } from "@/lib/teams";
import { fieldTypeMeta } from "@/lib/question-types";
import type { DirectorySort } from "@/lib/sort";
import { buildResponseSearchWhere } from "@/lib/directory-search";
import { RESPONSE_PAGE_SIZE } from "@/lib/page-size";

export { RESPONSE_PAGE_SIZE } from "@/lib/page-size";

function responsesOrderBy(sort: DirectorySort = "newest") {
  if (sort === "oldest") return { submittedAt: "asc" as const };
  if (sort === "name-asc") {
    return { clientSurvey: { form: { title: "asc" as const } } };
  }
  if (sort === "name-desc") {
    return { clientSurvey: { form: { title: "desc" as const } } };
  }
  return { submittedAt: "desc" as const };
}

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

export type ResponsesPageResult = {
  rows: ResponseListRow[];
  total: number;
  page: number;
  pageSize: number;
};

function mapResponseRow(
  row: Awaited<ReturnType<typeof fetchResponseRows>>[number]
): ResponseListRow {
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
}

function buildResponsesWhere(
  formAccess: ReturnType<typeof formsAccessibleWhere>,
  options: { formId?: string; query?: string }
) {
  const formFilter = options.formId
    ? { AND: [formAccess, { id: options.formId }] }
    : formAccess;

  const accessClause = { clientSurvey: { form: formFilter } };
  const searchClause = buildResponseSearchWhere(options.query ?? "");

  if (!searchClause) return accessClause;

  return {
    AND: [accessClause, searchClause],
  };
}

async function fetchResponseRows(
  userId: string,
  role: UserRole,
  options: {
    formId?: string;
    query?: string;
    skip?: number;
    take?: number;
    sort?: DirectorySort;
  }
) {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);

  return prisma.response.findMany({
    where: buildResponsesWhere(formAccess, options),
    orderBy: responsesOrderBy(options.sort),
    skip: options.skip,
    take: options.take,
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
}

export async function getResponsesPage(
  userId: string,
  role: UserRole,
  options: {
    page?: number;
    pageSize?: number;
    formId?: string;
    query?: string;
    sort?: DirectorySort;
  } = {}
): Promise<ResponsesPageResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = options.pageSize ?? RESPONSE_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);
  const where = buildResponsesWhere(formAccess, options);

  const [total, rows] = await Promise.all([
    prisma.response.count({ where }),
    fetchResponseRows(userId, role, { ...options, skip, take: pageSize }),
  ]);

  return {
    rows: rows.map(mapResponseRow),
    total,
    page,
    pageSize,
  };
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

  if (type === "DATE" && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }

  return trimmed;
}
