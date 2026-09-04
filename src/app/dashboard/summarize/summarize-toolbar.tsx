"use client";

/**
 * Client/period filters update local state immediately, then `router.replace`
 * loads the matching briefing. Generation is triggered from SummarizeView.
 */
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { NONE_CLIENT } from "@/lib/analytics-format";
import { Select, SelectPlaceholderOption } from "@/components/ui/select";
import { Spinner } from "@/components/ui/pending-button";
import {
  SUMMARY_PERIODS,
  summaryPeriodLabel,
  type SummaryPeriod,
} from "@/lib/summary-period";
import type { SummarizeScope } from "@/lib/summarize-scope";

/** Sentinel for “All clients” so `value=""` can stay the Client placeholder. */
const ALL_CLIENTS = "all";

function clientSelectValue(clientParam?: string) {
  if (clientParam == null || clientParam === "") return "";
  if (clientParam === ALL_CLIENTS) return ALL_CLIENTS;
  return clientParam;
}

function periodSelectValue(periodParam?: string): SummaryPeriod | "" {
  if (!periodParam) return "";
  return SUMMARY_PERIODS.includes(periodParam as SummaryPeriod)
    ? (periodParam as SummaryPeriod)
    : "";
}

export function SummarizeToolbar({
  data,
  clientParam,
  periodParam,
  hasSummary,
  generating,
  onGenerate,
}: {
  data: SummarizeScope;
  /** Raw `?client=` from the URL — undefined means show the Client placeholder. */
  clientParam?: string;
  /** Raw `?period=` from the URL — undefined means show the Period placeholder. */
  periodParam?: string;
  hasSummary: boolean;
  generating: boolean;
  onGenerate: () => void;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(() => clientSelectValue(clientParam));
  const [period, setPeriod] = useState(() => periodSelectValue(periodParam));
  const [, startNav] = useTransition();

  useEffect(() => {
    setClientId(clientSelectValue(clientParam));
    setPeriod(periodSelectValue(periodParam));
  }, [clientParam, periodParam]);

  function navigate(nextClient: string, nextPeriod: string) {
    const params = new URLSearchParams();
    if (nextClient === ALL_CLIENTS) {
      params.set("client", ALL_CLIENTS);
    } else if (nextClient) {
      params.set("client", nextClient);
    }
    if (nextPeriod) params.set("period", nextPeriod);
    const query = params.toString();
    startNav(() => {
      router.replace(query ? `/dashboard/summarize?${query}` : "/dashboard/summarize");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        AI-based summary
      </h1>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="w-full min-w-0">
          <span className="sr-only">Choose Client</span>
          <Select
            value={clientId}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              setClientId(value);
              navigate(value, period);
            }}
            aria-label="Filter summary by client"
            className="w-full"
          >
            <SelectPlaceholderOption label="Choose Client" />
            <option value={ALL_CLIENTS}>All</option>
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
        <label className="w-full min-w-0">
          <span className="sr-only">Choose Period</span>
          <Select
            value={period}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              setPeriod(value as SummaryPeriod);
              navigate(clientId, value);
            }}
            aria-label="Filter summary by period"
            className="w-full"
          >
            <SelectPlaceholderOption label="Choose Period" />
            {SUMMARY_PERIODS.map((item) => (
              <option key={item} value={item}>
                {summaryPeriodLabel(item)}
              </option>
            ))}
          </Select>
        </label>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || data.responseCount === 0}
          className="app-btn-primary w-full justify-center px-4 py-2.5 text-sm disabled:opacity-60 sm:col-span-2 lg:col-span-1 lg:w-auto"
        >
          {generating ? <Spinner /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Generating…" : hasSummary ? "Regenerate" : "Generate"}
        </button>
      </div>
    </div>
  );
}
