import { prisma } from "@/lib/prisma";

export type DatabaseCheckResult = {
  ok: boolean;
  message: string;
  counts: {
    users: number;
    teams: number;
    clients: number;
    forms: number;
    surveys: number;
    questions: number;
    responses: number;
    answers: number;
  } | null;
};

export async function checkDatabase(): Promise<DatabaseCheckResult> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const [users, teams, clients, forms, surveys, questions, responses, answers] =
      await Promise.all([
        prisma.user.count(),
        prisma.team.count(),
        prisma.client.count(),
        prisma.form.count(),
        prisma.clientSurvey.count(),
        prisma.question.count(),
        prisma.response.count(),
        prisma.answer.count(),
      ]);

    return {
      ok: true,
      message: "Next.js connected to MySQL successfully.",
      counts: {
        users,
        teams,
        clients,
        forms,
        surveys,
        questions,
        responses,
        answers,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return {
      ok: false,
      message,
      counts: null,
    };
  }
}
