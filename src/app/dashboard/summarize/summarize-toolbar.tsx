"use client";

/**
 * Client/period filters update local state immediately, then `router.replace`
 * loads the matching briefing. Do not call Gemini from here — only Generate does.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { NONE_CLIENT } from "@/lib/analytics-format";
import { pluralize } from "@/lib/format";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/pending-button";
import { toast } from "@/components/ui/toaster";
import { generateSummaryAction } from "./generate-summary";
import { SUMMARY_PERIODS, summaryPeriodLabel } from "@/lib/summary-period";
import type { SummarizeScope } from "@/lib/summarize-scope";

export function SummarizeToolbar({
  data,
  geminiReady,
  hasSummary,
}: {
  data: SummarizeScope;
  geminiReady: boolean;
  hasSummary: boolean;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(data.selectedClientId);
  const [period, setPeriod] = useState(data.selectedPeriod);
  const [, startNav] = useTransition();
  const [generating, startGenerate] = useTransition();

  function navigate(nextClient: string, nextPeriod: string) {
    const params = new URLSearchParams();
    if (nextClient) params.set("client", nextClient);
    if (nextPeriod) params.set("period", nextPeriod);
    const query = params.toString();
    startNav(() => {
      router.replace(query ? `/dashboard/summarize?${query}` : "/dashboard/summarize");
    });
  }

  function generate() {
    startGenerate(async () => {
      const result = await generateSummaryAction(clientId, period);
      if (result.error) {
        toast(result.error, { tone: "error" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="shrink-0 text-3xl font-semibold tracking-tight">
          Summarize
        </h1>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <label className="w-full min-w-[12rem] sm:w-56">
            <span className="sr-only">Filter by client</span>
            <Select
              value={clientId}
              onChange={(event) => {
                const value = event.target.value;
                setClientId(value);
                navigate(value, period);
              }}
              aria-label="Filter summary by client"
              className="app-radius py-2"
            >
              <option value="">All responses</option>
              {data.hasIndependentResponses ? (
                <option value={NONE_CLIENT}>Independent forms</option>
              ) : null}
              {data.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="w-full min-w-[12rem] sm:w-52">
            <span className="sr-only">Filter by period</span>
            <Select
              value={period}
              onChange={(event) => {
                const value = event.target.value;
                setPeriod(value as SummarizeScope["selectedPeriod"]);
                navigate(clientId, value);
              }}
              aria-label="Filter summary by period"
              className="app-radius py-2"
            >
              {SUMMARY_PERIODS.map((item) => (
                <option key={item} value={item}>
                  {summaryPeriodLabel(item)}
                </option>
              ))}
            </Select>
          </label>
          <button
            type="button"
            onClick={generate}
            disabled={generating || data.responseCount === 0}
            className="app-btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-60"
          >
            {generating ? <Spinner /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating…" : hasSummary ? "Regenerate" : "Generate"}
          </button>
        </div>
      </div>
      <p className="text-sm text-muted">
        {data.selectedClientName} · {summaryPeriodLabel(data.selectedPeriod)} ·{" "}
        {pluralize(data.responseCount, "response")}
        {geminiReady ? " · Gemini" : " · Add GEMINI_API_KEY in .env to use Gemini"}
      </p>
    </div>
  );
}
