import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const seedUsers = [
  {
    email: "admin@optiphoenix.local",
    name: "Org Admin",
    role: "ADMIN" as const,
    password: "Admin123!",
  },
  {
    email: "lead@optiphoenix.local",
    name: "Team Lead",
    role: "TEAM_LEAD" as const,
    password: "Lead123!",
  },
];

const DEMO_TEAM = "Demo Delivery Team";
const DEMO_PREFIX = "Demo — ";

const RATING_QUESTIONS = [
  "Speed",
  "Accuracy",
  "Quality",
  "Communication",
  "Overall Satisfaction",
] as const;

const COMMENT_POOL = [
  "Turnaround was quick and the team kept us posted.",
  "A few revisions took longer than expected, but quality was solid.",
  "Would like clearer weekly updates during the build.",
  "Great collaboration. Happy to continue next quarter.",
  "The first draft missed a couple of requirements.",
  "Communication improved a lot after the kickoff call.",
  "Please share test links a day earlier next time.",
  "Very satisfied with the launch support.",
  "Resource availability dipped in the last two weeks.",
  "Clear documentation. Easy for our stakeholders to review.",
];

const SUGGESTION_POOL = [
  "A shared Slack channel would help day-to-day questions.",
  "Add a mid-sprint demo so we can catch issues sooner.",
  "Keep the same pod on this account if possible.",
  "Send a short written recap after each call.",
  "A simple dashboard of open tasks would be useful.",
];

const DEMO_CLIENTS = [
  {
    name: "Northwind Retail",
    email: "ops@northwind.example",
    company: "Northwind",
    resources: ["Aisha Khan", "Rohan Mehta", "Priya Shah"],
    trend: "up" as const,
  },
  {
    name: "Helios Bank",
    email: "pm@helios.example",
    company: "Helios",
    resources: ["Daniel Cole", "Maya Iyer", "Luis Ortega"],
    trend: "stable" as const,
  },
  {
    name: "Maple Health",
    email: "it@maple.example",
    company: "Maple Health",
    resources: ["Sara Bell", "Kenji Sato", "Amelia Frost"],
    trend: "down" as const,
  },
  {
    name: "BrightCart",
    email: "growth@brightcart.example",
    company: "BrightCart",
    resources: ["Noah Patel", "Elena Rossi", "Chris Young"],
    trend: "mixed" as const,
  },
];

async function main() {
  const users = [];
  for (const user of seedUsers) {
    const password = await bcrypt.hash(user.password, 10);
    const row = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        password,
        status: "APPROVED",
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        password,
        status: "APPROVED",
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    users.push(row);
  }

  const admin = users.find((user) => user.role === "ADMIN");
  const lead = users.find((user) => user.role === "TEAM_LEAD");
  if (!admin || !lead) throw new Error("Seed users missing.");

  await resetDemoData();

  const team = await prisma.team.create({
    data: { name: DEMO_TEAM, createdById: admin.id },
  });
  await prisma.teamMembership.createMany({
    data: [
      { teamId: team.id, userId: admin.id },
      { teamId: team.id, userId: lead.id },
    ],
  });

  const months = monthKeys(new Date(2025, 8, 1), new Date(2026, 7, 1));
  let responseCount = 0;

  for (const [clientIndex, spec] of DEMO_CLIENTS.entries()) {
    const client = await prisma.client.create({
      data: {
        teamId: team.id,
        createdById: lead.id,
        name: spec.name,
        email: spec.email,
        company: spec.company,
      },
    });

    const form = await createDemoForm({
      title: `${DEMO_PREFIX}${spec.name} monthly feedback`,
      description: "Seeded demo form so Insights has ratings to chart.",
      teamId: team.id,
      clientId: client.id,
      createdById: lead.id,
      resources: spec.resources,
    });

    const rng = mulberry32(0x91e2 + clientIndex * 17);
    for (const [monthIndex, month] of months.entries()) {
      const perMonth = 2 + (rng() > 0.55 ? 1 : 0);
      for (let n = 0; n < perMonth; n += 1) {
        await createDemoResponse({
          form,
          submittedAt: dateInMonth(month, 4 + n * 8, rng),
          scores: scoresFor(spec.trend, monthIndex, months.length, rng),
          resources: spec.resources,
          rng,
        });
        responseCount += 1;
      }
    }
  }

  const independent = await createDemoForm({
    title: `${DEMO_PREFIX}Independent launch review`,
    description: "No client attached. Used to test the Independent forms sort.",
    teamId: null,
    clientId: null,
    createdById: admin.id,
    resources: ["Jordan Lee", "Samira Noor"],
  });
  const independentRng = mulberry32(0x51a0);
  for (const [monthIndex, month] of months.entries()) {
    await createDemoResponse({
      form: independent,
      submittedAt: dateInMonth(month, 12, independentRng),
      scores: scoresFor("stable", monthIndex, months.length, independentRng),
      resources: ["Jordan Lee", "Samira Noor"],
      rng: independentRng,
    });
    responseCount += 1;
  }

  console.log("Seeded login users:");
  console.log("  Admin     admin@optiphoenix.local  /  Admin123!");
  console.log("  Team Lead lead@optiphoenix.local   /  Lead123!");
  console.log(
    `Seeded demo Insights data: ${DEMO_CLIENTS.length} clients, ${months.length} months, ${responseCount} responses.`
  );
  console.log("  Open Dashboard → Insights, then Sort By a client.");
}

async function resetDemoData() {
  await prisma.form.deleteMany({
    where: { title: { startsWith: DEMO_PREFIX } },
  });
  const demoTeam = await prisma.team.findFirst({
    where: { name: DEMO_TEAM },
  });
  if (demoTeam) {
    await prisma.client.deleteMany({ where: { teamId: demoTeam.id } });
    await prisma.team.delete({ where: { id: demoTeam.id } });
  }
}

async function createDemoForm({
  title,
  description,
  teamId,
  clientId,
  createdById,
  resources,
}: {
  title: string;
  description: string;
  teamId: string | null;
  clientId: string | null;
  createdById: string;
  resources: string[];
}) {
  const form = await prisma.form.create({
    data: {
      title,
      description,
      teamId,
      clientId,
      createdById,
      status: "PUBLISHED",
      publishedAt: new Date("2025-09-01"),
    },
  });

  const questions = [];
  let order = 1;
  for (const label of RATING_QUESTIONS) {
    questions.push(
      await prisma.question.create({
        data: {
          formId: form.id,
          type: "RATING",
          label,
          required: true,
          order: order++,
        },
      })
    );
  }
  questions.push(
    await prisma.question.create({
      data: {
        formId: form.id,
        type: "RESOURCE_RATING",
        label: "How satisfied were you with the team?",
        required: true,
        order: order++,
        options: resources,
      },
    })
  );
  questions.push(
    await prisma.question.create({
      data: {
        formId: form.id,
        type: "SUGGESTION",
        label: "Suggestions",
        required: false,
        order: order++,
      },
    })
  );
  questions.push(
    await prisma.question.create({
      data: {
        formId: form.id,
        type: "LONG_TEXT",
        label: "Anything else we should know?",
        required: false,
        order: order++,
      },
    })
  );

  const survey = await prisma.clientSurvey.create({
    data: {
      formId: form.id,
      clientId,
      status: "CLOSED",
      openedAt: new Date("2025-09-02"),
      submittedAt: new Date("2026-08-01"),
    },
  });

  return { ...form, questions, surveyId: survey.id };
}

async function createDemoResponse({
  form,
  submittedAt,
  scores,
  resources,
  rng,
}: {
  form: Awaited<ReturnType<typeof createDemoForm>>;
  submittedAt: Date;
  scores: number[];
  resources: string[];
  rng: () => number;
}) {
  const response = await prisma.response.create({
    data: {
      clientSurveyId: form.surveyId,
      submittedAt,
    },
  });

  const answers = form.questions.map((question, index) => {
    let value = "";
    if (question.type === "RATING") {
      value = String(scores[index] ?? 4);
    } else if (question.type === "RESOURCE_RATING") {
      value = JSON.stringify(
        resources.map((name, resourceIndex) => ({
          name,
          score: String(clamp(scores[resourceIndex] + (resourceIndex === 1 ? -1 : 0))),
        }))
      );
    } else if (question.type === "SUGGESTION") {
      value = rng() > 0.35 ? pick(SUGGESTION_POOL, rng) : "";
    } else if (question.type === "LONG_TEXT") {
      value = rng() > 0.4 ? pick(COMMENT_POOL, rng) : "";
    }
    return { responseId: response.id, questionId: question.id, value };
  });

  await prisma.answer.createMany({ data: answers });
}

function scoresFor(
  trend: "up" | "down" | "stable" | "mixed",
  monthIndex: number,
  monthCount: number,
  rng: () => number
) {
  const progress = monthCount <= 1 ? 0 : monthIndex / (monthCount - 1);
  let base = 4;
  if (trend === "up") base = 3.1 + progress * 1.6;
  if (trend === "down") base = 4.7 - progress * 1.5;
  if (trend === "stable") base = 3.9;
  if (trend === "mixed") base = 3.4 + Math.sin(progress * Math.PI) * 1.1;

  return RATING_QUESTIONS.map((_, index) => {
    const wobble = (rng() - 0.5) * 1.4;
    const questionShift = index === 4 ? 0.2 : index === 0 ? -0.15 : 0;
    return clamp(base + wobble + questionShift);
  });
}

function clamp(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function pick<T>(items: T[], rng: () => number) {
  return items[Math.floor(rng() * items.length)] ?? items[0];
}

function monthKeys(start: Date, end: Date) {
  const keys: Array<{ year: number; month: number }> = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    keys.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

function dateInMonth(
  month: { year: number; month: number },
  day: number,
  rng: () => number
) {
  const lastDay = new Date(month.year, month.month + 1, 0).getDate();
  const safeDay = Math.min(lastDay, Math.max(1, day));
  const hour = 9 + Math.floor(rng() * 8);
  return new Date(month.year, month.month, safeDay, hour, Math.floor(rng() * 50));
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
