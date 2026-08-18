/**
 * AI survey briefing.
 *
 * Flow:
 * 1. Collect ratings + comments for a client/period (`collectSurveyEvidence`).
 * 2. Prefer Gemini (free-tier). OpenAI is fallback. Heuristic summary is last resort.
 * 3. Cache the JSON briefing in memory for 10 minutes so page loads do not re-call the model.
 * 4. `force: true` (Generate button) bypasses that cache.
 *
 * Page loads should use `getCachedAiSummary` only — never this function — so filters stay fast.
 */
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { formsAccessibleWhere } from "@/lib/forms";
import { getTeamsForUser } from "@/lib/teams";
import { getClientsForUser } from "@/lib/clients";
import { NONE_CLIENT } from "@/lib/analytics-format";
import {
  periodStartDate,
  resolveSummaryPeriod,
  summaryPeriodLabel,
} from "@/lib/summary-period";

const MAX_COMMENTS = 80;
const MAX_COMMENT_CHARS = 600;
const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const CACHE_TTL_MS = 10 * 60 * 1000;

type SummarySource = "gemini" | "openai" | "local";
type CacheEntry = { summary: AiSummary; expires: number };

/** In-process cache so regenerating the same filter does not hit Gemini again. */
const summaryCache = new Map<string, CacheEntry>();

function summaryCacheKey(
  userId: string,
  role: string,
  clientFilter?: string,
  periodFilter?: string
) {
  return [userId, role, clientFilter ?? "", periodFilter ?? ""].join(":");
}

/** Returns a previously generated briefing, or null if it expired / was never generated. */
export function getCachedAiSummary(
  userId: string,
  role: string,
  clientFilter?: string,
  periodFilter?: string
) {
  const cached = summaryCache.get(summaryCacheKey(userId, role, clientFilter, periodFilter));
  if (cached && cached.expires > Date.now()) return cached.summary;
  return null;
}

export const sentimentLabelSchema = z.enum([
  "positive",
  "mixed",
  "negative",
  "neutral",
]);

export const aiSummarySchema = z.object({
  headline: z.string(),
  overview: z.string(),
  sentiment: z.object({
    overall: sentimentLabelSchema,
    score: z.number(),
    positiveShare: z.number(),
    mixedShare: z.number(),
    negativeShare: z.number(),
    explanation: z.string(),
  }),
  positives: z.array(z.object({ title: z.string(), detail: z.string() })),
  painPoints: z.array(z.object({ title: z.string(), detail: z.string() })),
  themes: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      sentiment: sentimentLabelSchema,
    })
  ),
  recommendations: z.array(
    z.object({
      title: z.string(),
      action: z.string(),
      priority: z.enum(["high", "medium", "low"]),
    })
  ),
  attention: z.array(
    z.object({
      name: z.string(),
      kind: z.enum(["resource", "area"]),
      reason: z.string(),
    })
  ),
});

export type AiSummary = z.infer<typeof aiSummarySchema> & {
  generatedAt: string;
  scope: string;
  responseCount: number;
  commentCount: number;
  source: SummarySource;
};

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

type ParsedResource = { name: string; score: number | null };

export async function generateAiSummaryForUser(
  userId: string,
  role: UserRole,
  clientFilter?: string,
  periodFilter?: string,
  options?: { localOnly?: boolean; force?: boolean }
): Promise<{ summary?: AiSummary; error?: string }> {
  const cacheKey = summaryCacheKey(userId, role, clientFilter, periodFilter);
  if (!options?.force) {
    const cached = getCachedAiSummary(userId, role, clientFilter, periodFilter);
    if (cached) {
      return { summary: cached };
    }
  }

  const evidence = await collectSurveyEvidence(userId, role, clientFilter, periodFilter);
  if (evidence.responseCount === 0) {
    return { error: "No submitted responses in this view yet." };
  }

  if (options?.localOnly) {
    return cacheAndReturn(cacheKey, toSummary(buildLocalSummary(evidence), evidence, "local"));
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    try {
      const raw = await callGemini(
        geminiKey,
        process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
        evidence
      );
      const parsed = aiSummarySchema.safeParse(raw);
      if (!parsed.success) {
        return { error: "Gemini returned an unexpected shape. Try generating again." };
      }
      return cacheAndReturn(cacheKey, toSummary(parsed.data, evidence, "gemini"));
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Could not reach Gemini. Try again in a moment.",
      };
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    try {
      const raw = await callOpenAi(
        openaiKey,
        process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
        evidence
      );
      const parsed = aiSummarySchema.safeParse(raw);
      if (!parsed.success) {
        return { error: "The model returned an unexpected shape. Try generating again." };
      }
      return cacheAndReturn(cacheKey, toSummary(parsed.data, evidence, "openai"));
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Could not reach OpenAI. Try again in a moment.",
      };
    }
  }

  return cacheAndReturn(cacheKey, toSummary(buildLocalSummary(evidence), evidence, "local"));
}

function cacheAndReturn(key: string, summary: AiSummary) {
  summaryCache.set(key, { summary, expires: Date.now() + CACHE_TTL_MS });
  return { summary };
}

function toSummary(
  data: z.infer<typeof aiSummarySchema>,
  evidence: SurveyEvidence,
  source: AiSummary["source"]
): AiSummary {
  return {
    ...data,
    generatedAt: new Date().toISOString(),
    scope: evidence.scope,
    responseCount: evidence.responseCount,
    commentCount: evidence.commentCount,
    source,
  };
}

type SurveyEvidence = {
  scope: string;
  responseCount: number;
  commentCount: number;
  overallAverage: number | null;
  resourceAverage: number | null;
  questions: { label: string; average: number; count: number }[];
  resources: { name: string; average: number; count: number }[];
  choices: { question: string; options: { label: string; count: number }[] }[];
  comments: {
    client: string;
    form: string;
    date: string;
    question: string;
    text: string;
  }[];
};

async function collectSurveyEvidence(
  userId: string,
  role: UserRole,
  clientFilter?: string,
  periodFilter?: string
): Promise<SurveyEvidence> {
  const teams = await getTeamsForUser(userId, role);
  const teamIds = teams.map((team) => team.id);
  const formAccess = formsAccessibleWhere(userId, role, teamIds);
  const clients = await getClientsForUser(userId, role);

  const period = resolveSummaryPeriod(periodFilter);
  const startDate = periodStartDate(period);

  const selected =
    clientFilter === NONE_CLIENT
      ? NONE_CLIENT
      : clientFilter && clients.some((client) => client.id === clientFilter)
        ? clientFilter
        : "";

  const clientWhere =
    selected === NONE_CLIENT
      ? { AND: [{ clientId: null }, { form: { clientId: null } }] }
      : selected
        ? {
            OR: [{ clientId: selected }, { form: { clientId: selected } }],
          }
        : {};

  const rows = await prisma.response.findMany({
    where: {
      clientSurvey: {
        AND: [{ form: formAccess }, clientWhere],
      },
      submittedAt: { gte: startDate },
    },
    orderBy: { submittedAt: "desc" },
    include: {
      answers: {
        include: {
          question: { select: { id: true, type: true, label: true } },
        },
      },
      clientSurvey: {
        include: {
          form: {
            select: {
              title: true,
              client: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const overallScores: number[] = [];
  const resourceScores: number[] = [];
  const questionMap = new Map<string, { label: string; scores: number[] }>();
  const resourceMap = new Map<string, { name: string; scores: number[] }>();
  const choiceMap = new Map<string, { question: string; counts: Map<string, number> }>();
  const comments: SurveyEvidence["comments"] = [];

  for (const row of rows) {
    const form = row.clientSurvey.form;
    const clientName = form.client?.name ?? "Independent form";
    const date = row.submittedAt.toISOString().slice(0, 10);

    for (const answer of row.answers) {
      const type = answer.question.type;
      const value = answer.value.trim();
      if (!value) continue;

      if (type === "RATING") {
        const score = parseStar(value);
        if (score == null) continue;
        overallScores.push(score);
        const key = normalize(answer.question.label);
        const item = questionMap.get(key) ?? {
          label: answer.question.label.trim() || "Rating",
          scores: [],
        };
        item.scores.push(score);
        questionMap.set(key, item);
      } else if (type === "RESOURCE_RATING") {
        for (const item of parseResourceRatings(value)) {
          if (item.score == null) continue;
          resourceScores.push(item.score);
          const key = normalize(item.name);
          const resource = resourceMap.get(key) ?? { name: item.name, scores: [] };
          resource.scores.push(item.score);
          resourceMap.set(key, resource);
        }
      } else if (
        type === "SINGLE_CHOICE" ||
        type === "DROPDOWN" ||
        type === "YES_NO"
      ) {
        const key = normalize(answer.question.label);
        const choice = choiceMap.get(key) ?? {
          question: answer.question.label.trim() || "Choice",
          counts: new Map<string, number>(),
        };
        choice.counts.set(value, (choice.counts.get(value) ?? 0) + 1);
        choiceMap.set(key, choice);
      } else if (
        type === "SUGGESTION" ||
        type === "COMMENT" ||
        type === "LONG_TEXT" ||
        type === "SHORT_TEXT"
      ) {
        comments.push({
          client: clientName,
          form: form.title,
          date,
          question: answer.question.label.trim() || type,
          text: value.slice(0, MAX_COMMENT_CHARS),
        });
      }
    }
  }

  const scope =
    selected === NONE_CLIENT
      ? "Independent forms"
      : selected
        ? (clients.find((client) => client.id === selected)?.name ?? "Client")
        : "All responses";

  return {
    scope: `${scope} · ${summaryPeriodLabel(period)}`,
    responseCount: rows.length,
    commentCount: comments.length,
    overallAverage: average(overallScores),
    resourceAverage: average(resourceScores),
    questions: [...questionMap.values()]
      .map((item) => ({
        label: item.label,
        average: average(item.scores) ?? 0,
        count: item.scores.length,
      }))
      .sort((a, b) => a.average - b.average),
    resources: [...resourceMap.values()]
      .map((item) => ({
        name: item.name,
        average: average(item.scores) ?? 0,
        count: item.scores.length,
      }))
      .sort((a, b) => a.average - b.average),
    choices: [...choiceMap.values()].slice(0, 15).map((item) => ({
      question: item.question,
      options: [...item.counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    })),
    comments: comments.slice(0, MAX_COMMENTS),
  };
}

const POSITIVE_WORDS = [
  "thank",
  "great",
  "excellent",
  "good",
  "helpful",
  "love",
  "appreciate",
  "smooth",
  "professional",
  "clear",
  "happy",
  "pleased",
  "responsive",
  "reliable",
];
const NEGATIVE_WORDS = [
  "delay",
  "slow",
  "issue",
  "problem",
  "poor",
  "lack",
  "confus",
  "late",
  "wait",
  "frustrat",
  "miss",
  "unclear",
  "difficult",
  "broken",
  "concern",
  "disappoint",
];

function buildLocalSummary(
  evidence: SurveyEvidence
): z.infer<typeof aiSummarySchema> {
  const score = evidence.overallAverage ?? evidence.resourceAverage ?? 3;
  const sentimentScore = Math.round(((score - 1) / 4) * 100);
  const overallLabel: "positive" | "mixed" | "negative" =
    score >= 4.2 ? "positive" : score >= 3.4 ? "mixed" : "negative";

  const tones = evidence.comments.map((comment) => commentTone(comment.text));
  const positiveCount = tones.filter((tone) => tone === "positive").length;
  const negativeCount = tones.filter((tone) => tone === "negative").length;
  const mixedCount = Math.max(0, tones.length - positiveCount - negativeCount);
  const commentTotal = tones.length || 1;
  const positiveShare =
    tones.length > 0 ? positiveCount / commentTotal : Math.max(0, (score - 3) / 2);
  const negativeShare =
    tones.length > 0 ? negativeCount / commentTotal : Math.max(0, (3 - score) / 2);
  const mixedShare = Math.max(0, 1 - positiveShare - negativeShare);

  const strongQuestions = [...evidence.questions]
    .sort((a, b) => b.average - a.average)
    .filter((item) => item.average >= 4)
    .slice(0, 3);
  const weakQuestions = evidence.questions
    .filter((item) => item.average > 0 && item.average < 3.6)
    .slice(0, 3);
  const strongResources = [...evidence.resources]
    .sort((a, b) => b.average - a.average)
    .filter((item) => item.average >= 4)
    .slice(0, 3);
  const weakResources = evidence.resources
    .filter((item) => item.average > 0 && item.average < 3.6)
    .slice(0, 4);

  const positiveComments = evidence.comments
    .filter((comment) => commentTone(comment.text) === "positive")
    .slice(0, 3);
  const negativeComments = evidence.comments
    .filter((comment) => commentTone(comment.text) === "negative")
    .slice(0, 3);

  const positives = [
    ...strongQuestions.map((item) => ({
      title: item.label,
      detail: `Average ${item.average.toFixed(1)} / 5 across ${item.count} ratings.`,
    })),
    ...strongResources.map((item) => ({
      title: item.name,
      detail: `Resource average ${item.average.toFixed(1)} / 5 from ${item.count} scores.`,
    })),
    ...positiveComments.map((comment) => ({
      title: comment.question,
      detail: clip(comment.text),
    })),
  ].slice(0, 3);

  const painPoints = [
    ...weakQuestions.map((item) => ({
      title: item.label,
      detail: `Average ${item.average.toFixed(1)} / 5 across ${item.count} ratings.`,
    })),
    ...weakResources.map((item) => ({
      title: item.name,
      detail: `Average ${item.average.toFixed(1)} / 5 — below the rest of the team.`,
    })),
    ...negativeComments.map((comment) => ({
      title: comment.question,
      detail: clip(comment.text, 120),
    })),
  ].slice(0, 3);

  const themeMap = new Map<
    string,
    { title: string; texts: string[]; tones: ReturnType<typeof commentTone>[] }
  >();
  for (const comment of evidence.comments) {
    const key = normalize(comment.question);
    const theme = themeMap.get(key) ?? {
      title: comment.question,
      texts: [],
      tones: [],
    };
    theme.texts.push(comment.text);
    theme.tones.push(commentTone(comment.text));
    themeMap.set(key, theme);
  }

  const themes = [...themeMap.values()]
    .filter((theme) => theme.texts.length >= 2)
    .sort((a, b) => b.texts.length - a.texts.length)
    .slice(0, 4)
    .map((theme) => {
      const pos = theme.tones.filter((tone) => tone === "positive").length;
      const neg = theme.tones.filter((tone) => tone === "negative").length;
      const sentiment =
        pos > neg && pos > 0
          ? ("positive" as const)
          : neg > pos && neg > 0
            ? ("negative" as const)
            : pos + neg === 0
              ? ("neutral" as const)
              : ("mixed" as const);
      return {
        title: theme.title,
        sentiment,
        detail: clip(theme.texts[0] ?? "", 100),
      };
    });

  const attention = weakResources.slice(0, 3).map((item) => ({
    name: item.name,
    kind: "resource" as const,
    reason: `Average ${item.average.toFixed(1)} / 5 from ${item.count} ratings.`,
  }));

  const recommendations: Array<{
    title: string;
    action: string;
    priority: "high" | "medium" | "low";
  }> = [
    ...weakResources.slice(0, 2).map((item) => ({
      title: `Follow up with ${item.name}`,
      action: `Review recent work and ask the client what would raise this score from ${item.average.toFixed(1)}.`,
      priority: item.average < 3 ? ("high" as const) : ("medium" as const),
    })),
    ...weakQuestions.slice(0, 2).map((item) => ({
      title: `Improve ${item.label.toLowerCase()}`,
      action: `This question is averaging ${item.average.toFixed(1)}. Pick one concrete change for the next cycle and mention it in the next check-in.`,
      priority: item.average < 3 ? ("high" as const) : ("medium" as const),
    })),
  ];

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Keep the current cadence",
      action: "Scores are in a healthy range. Repeat this form next month and watch for any drop on resources or comments.",
      priority: "low" as const,
    });
  }

  const headline =
    overallLabel === "positive"
      ? "Clients are largely satisfied"
      : overallLabel === "mixed"
        ? "Mixed feedback, with a few clear fixes"
        : "This cycle needs attention";

  const overview =
    overallLabel === "positive"
      ? `Clients are largely satisfied. Average score ${score.toFixed(1)} / 5 across ${evidence.responseCount} ${evidence.responseCount === 1 ? "response" : "responses"}.`
      : overallLabel === "mixed"
        ? `Feedback is mixed. Average score ${score.toFixed(1)} / 5 — a few areas are holding the rest back.`
        : `Feedback is leaning negative. Average score ${score.toFixed(1)} / 5. Start with the items under What to fix.`;

  return {
    headline,
    overview,
    sentiment: {
      overall: overallLabel,
      score: sentimentScore,
      positiveShare,
      mixedShare,
      negativeShare,
      explanation:
        tones.length > 0
          ? `${positiveCount} positive · ${mixedCount} mixed · ${negativeCount} negative comments`
          : `Based on the ${score.toFixed(1)} average score`,
    },
    positives: positives.slice(0, 3),
    painPoints,
    themes,
    recommendations: recommendations.slice(0, 3),
    attention,
  };
}

function commentTone(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positive = POSITIVE_WORDS.some((word) => lower.includes(word));
  const negative = NEGATIVE_WORDS.some((word) => lower.includes(word));
  if (positive && !negative) return "positive";
  if (negative && !positive) return "negative";
  if (positive && negative) return "neutral";
  return "neutral";
}

function clip(value: string, max = 180) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function callGemini(apiKey: string, model: string, evidence: SurveyEvidence) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You analyze OptiPhoenix client survey responses for a delivery team. Be specific and grounded in the data. Do not invent people, clients, or scores that are not present. If written comments are thin, say so and lean on ratings. Keep titles short. Recommendations must be practical next steps a team lead can take this month. Return only JSON matching the requested schema.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: JSON.stringify({
                  instruction:
                    "Summarize this survey evidence. Identify positive feedback, pain points, recurring themes, sentiment of written comments, resources or areas that need attention, and actionable recommendations.",
                  schema: geminiSchema,
                  evidence,
                }),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: geminiSchema,
        },
      }),
    });

    const payload = (await response.json()) as {
      error?: { message?: string; status?: string; code?: number };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    if (!response.ok) {
      throw new Error(mapGeminiError(response.status, payload.error));
    }

    const content = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!content) {
      throw new Error("Gemini returned an empty response.");
    }

    try {
      return extractJson(content);
    } catch {
      throw new Error("Gemini returned invalid JSON. Try generating again.");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The summary took too long. Try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function mapGeminiError(
  status: number,
  error?: { message?: string; status?: string; code?: number }
) {
  if (status === 400 && /API key/i.test(error?.message ?? "")) {
    return "Gemini rejected the API key. Check GEMINI_API_KEY in .env.";
  }
  if (status === 401 || status === 403) {
    return "Gemini rejected the API key. Check GEMINI_API_KEY in .env.";
  }
  if (status === 429) {
    return "Gemini free-tier rate limit reached. Wait a minute and try again.";
  }
  return error?.message?.trim() || `Gemini request failed (${status}).`;
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? trimmed).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found.");
  }
  return JSON.parse(raw.slice(start, end + 1)) as unknown;
}

async function callOpenAi(
  apiKey: string,
  model: string,
  evidence: SurveyEvidence
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "survey_summary",
            strict: true,
            schema: openAiSchema,
          },
        },
        messages: [
          {
            role: "system",
            content:
              "You analyze OptiPhoenix client survey responses for a delivery team. Be specific and grounded in the data. Do not invent people, clients, or scores that are not present. If written comments are thin, say so and lean on ratings. Keep titles short. Recommendations must be practical next steps a team lead can take this month.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "Summarize this survey evidence. Identify positive feedback, pain points, recurring themes, sentiment of written comments, resources or areas that need attention, and actionable recommendations.",
              evidence,
            }),
          },
        ],
      }),
    });

    const payload = (await response.json()) as {
      error?: { message?: string; code?: string; type?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!response.ok) {
      throw new Error(mapOpenAiError(response.status, payload.error));
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response.");
    }

    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new Error("OpenAI returned invalid JSON. Try generating again.");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The summary took too long. Try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function mapOpenAiError(
  status: number,
  error?: { message?: string; code?: string; type?: string }
) {
  if (status === 401) {
    return "OpenAI rejected the API key. Check OPENAI_API_KEY in .env.";
  }
  if (status === 429 || error?.code === "insufficient_quota") {
    return "OpenAI rate or quota limit reached. Check billing on platform.openai.com.";
  }
  return error?.message?.trim() || `OpenAI request failed (${status}).`;
}

const stringArray = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["title", "detail"],
    properties: {
      title: { type: "string" },
      detail: { type: "string" },
    },
  },
} as const;

const geminiSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    overview: { type: "string" },
    sentiment: {
      type: "object",
      properties: {
        overall: {
          type: "string",
          enum: ["positive", "mixed", "negative", "neutral"],
        },
        score: { type: "number" },
        positiveShare: { type: "number" },
        mixedShare: { type: "number" },
        negativeShare: { type: "number" },
        explanation: { type: "string" },
      },
      required: [
        "overall",
        "score",
        "positiveShare",
        "mixedShare",
        "negativeShare",
        "explanation",
      ],
    },
    positives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
        },
        required: ["title", "detail"],
      },
    },
    painPoints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
        },
        required: ["title", "detail"],
      },
    },
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          sentiment: {
            type: "string",
            enum: ["positive", "mixed", "negative", "neutral"],
          },
        },
        required: ["title", "detail", "sentiment"],
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          action: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["title", "action", "priority"],
      },
    },
    attention: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          kind: { type: "string", enum: ["resource", "area"] },
          reason: { type: "string" },
        },
        required: ["name", "kind", "reason"],
      },
    },
  },
  required: [
    "headline",
    "overview",
    "sentiment",
    "positives",
    "painPoints",
    "themes",
    "recommendations",
    "attention",
  ],
} as const;

const openAiSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "overview",
    "sentiment",
    "positives",
    "painPoints",
    "themes",
    "recommendations",
    "attention",
  ],
  properties: {
    headline: { type: "string" },
    overview: { type: "string" },
    sentiment: {
      type: "object",
      additionalProperties: false,
      required: [
        "overall",
        "score",
        "positiveShare",
        "mixedShare",
        "negativeShare",
        "explanation",
      ],
      properties: {
        overall: {
          type: "string",
          enum: ["positive", "mixed", "negative", "neutral"],
        },
        score: { type: "number" },
        positiveShare: { type: "number" },
        mixedShare: { type: "number" },
        negativeShare: { type: "number" },
        explanation: { type: "string" },
      },
    },
    positives: stringArray,
    painPoints: stringArray,
    themes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "sentiment"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          sentiment: {
            type: "string",
            enum: ["positive", "mixed", "negative", "neutral"],
          },
        },
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "action", "priority"],
        properties: {
          title: { type: "string" },
          action: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    attention: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "kind", "reason"],
        properties: {
          name: { type: "string" },
          kind: { type: "string", enum: ["resource", "area"] },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

function parseStar(value: string) {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 5) return null;
  return score;
}

function parseResourceRatings(value: string): ParsedResource[] {
  try {
    const rows = JSON.parse(value) as unknown;
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => {
      if (!row || typeof row !== "object") {
        return { name: "Name", score: null };
      }
      const record = row as { name?: unknown; score?: unknown };
      return {
        name: String(record.name ?? "Name").trim() || "Name",
        score: parseStar(String(record.score ?? "")),
      };
    });
  } catch {
    return [];
  }
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function average(scores: number[]) {
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
