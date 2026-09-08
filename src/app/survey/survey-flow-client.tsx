"use client";

import dynamic from "next/dynamic";

export const SurveyFlowClient = dynamic(
  () => import("./survey-flow").then((mod) => mod.SurveyFlow),
  {
    ssr: false,
    loading: () => (
      <div className="app-radius border border-border bg-white px-5 py-8 text-sm text-muted">
        Loading form…
      </div>
    ),
  }
);
