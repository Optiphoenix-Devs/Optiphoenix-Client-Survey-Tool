export const NONE_CLIENT = "none";

export function formatScore(value: number | null) {
  if (value == null) return "—";
  return value.toFixed(1);
}

export type ScoreDistribution = [number, number, number, number, number];

export type RatingRow = {
  key: string;
  label: string;
  average: number;
  count: number;
  distribution: ScoreDistribution;
  formCount: number;
};

export type ResourceRow = {
  name: string;
  average: number;
  count: number;
  distribution: ScoreDistribution;
};

export type TrendPoint = {
  key: string;
  label: string;
  average: number | null;
  responses: number;
};

export type SummaryComment = {
  id: string;
  text: string;
  formTitle: string;
  clientName: string;
  submittedAt: string;
  href: string;
};

export type AnalyticsClientOption = {
  id: string;
  name: string;
};

export type AnalyticsSnapshot = {
  selectedClientId: string;
  selectedClientName: string;
  clients: AnalyticsClientOption[];
  hasIndependentResponses: boolean;
  responseCount: number;
  formCount: number;
  clientCount: number;
  overall: {
    average: number | null;
    count: number;
    distribution: ScoreDistribution;
  };
  resourceAverage: number | null;
  resourceCount: number;
  combinedAverage: number | null;
  combinedCount: number;
  questions: RatingRow[];
  resources: ResourceRow[];
  trends: TrendPoint[];
  comments: SummaryComment[];
};

