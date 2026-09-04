"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import type { AiSummary } from "@/lib/ai-summary";
import type { SummarizeScope } from "@/lib/summarize-scope";
import { SummarizeGeneratingOverlay } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { usePersistedValue } from "@/lib/use-persisted-value";
import { SummarizeBriefing } from "./summarize-briefing";
import { SummarizeToolbar } from "./summarize-toolbar";
import { generateSummaryAction } from "./generate-summary";

const SUMMARY_STORAGE_PREFIX = "optiphoenix.aiSummary:";

function storageKey(requestKey: string) {
  return `${SUMMARY_STORAGE_PREFIX}${requestKey}`;
}

function readStoredSummary(requestKey: string): AiSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(requestKey));
    if (!raw) return null;
    return JSON.parse(raw) as AiSummary;
  } catch {
    return null;
  }
}

function writeStoredSummary(requestKey: string, summary: AiSummary) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(requestKey), JSON.stringify(summary));
  } catch {
    /* quota / private mode — ignore */
  }
}

function waitForAbort(signal: AbortSignal) {
  return new Promise<never>((_, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    signal.addEventListener(
      "abort",
      () => {
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

function SummarizeIntroCard() {
  return (
    <article className="app-radius border border-dashed border-border bg-card px-6 py-14 text-center sm:px-10">
      <span className="mx-auto grid h-12 w-12 place-items-center app-radius bg-sage/15 text-accent">
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">Ready to summarize</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        Choose a client and period above, then click Generate to build an AI briefing
        from the feedback in that view. This usually takes 1–2 minutes.
      </p>
    </article>
  );
}

export function SummarizeView({
  data,
  clientParam,
  periodParam,
  hasSummary,
  summary,
}: {
  data: SummarizeScope;
  clientParam?: string;
  periodParam?: string;
  hasSummary: boolean;
  summary: AiSummary | null;
}) {
  const router = useRouter();
  const requestKey = `${data.selectedClientId}:${data.selectedPeriod}`;
  const [generating, setGenerating] = useState(false);
  const [awaitingResult, setAwaitingResult] = useState(false);
  /** Client/session cache — starts null to avoid SSR hydration mismatch. */
  const [liveSummary, setLiveSummary] = useState<AiSummary | null>(null);
  const [sidebarCollapsed] = usePersistedValue("optiphoenix.sidebarCollapsed", "0", ["0", "1"]);
  const runIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const displaySummary = liveSummary ?? summary;
  const showLoader = generating || awaitingResult;
  const showIntro = data.responseCount > 0 && !displaySummary && !showLoader;

  const stopGenerate = useCallback(() => {
    runIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
    setAwaitingResult(false);
  }, []);

  const runGenerate = useCallback(async () => {
    const runId = ++runIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAwaitingResult(false);
    setGenerating(true);

    try {
      const result = await Promise.race([
        generateSummaryAction(data.selectedClientId, data.selectedPeriod),
        waitForAbort(controller.signal),
      ]);
      if (runId !== runIdRef.current) return;
      if (result.error) {
        toast(result.error, { tone: "error" });
        return;
      }
      if (result.summary) {
        setLiveSummary(result.summary);
        writeStoredSummary(requestKey, result.summary);
        setAwaitingResult(false);
        router.refresh();
        return;
      }
      setAwaitingResult(true);
      router.refresh();
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast("Could not generate the briefing. Try again.", { tone: "error" });
    } finally {
      if (runId === runIdRef.current) {
        setGenerating(false);
        abortRef.current = null;
      }
    }
  }, [data.selectedClientId, data.selectedPeriod, requestKey, router]);

  useEffect(() => {
    if (summary) {
      setLiveSummary(summary);
      writeStoredSummary(requestKey, summary);
      setAwaitingResult(false);
      return;
    }
    const stored = readStoredSummary(requestKey);
    if (stored) setLiveSummary(stored);
  }, [summary, requestKey]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    runIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
    setAwaitingResult(false);
    setLiveSummary(null);
  }, [requestKey]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      {showLoader ? (
        <SummarizeGeneratingOverlay
          onStop={generating ? stopGenerate : undefined}
          sidebarLeft={sidebarCollapsed === "1" ? "lg:left-[4.75rem]" : "lg:left-64"}
        />
      ) : null}
      <SummarizeToolbar
        key={`${clientParam ?? ""}:${periodParam ?? ""}`}
        data={data}
        clientParam={clientParam}
        periodParam={periodParam}
        hasSummary={hasSummary || Boolean(displaySummary)}
        generating={showLoader}
        onGenerate={() => void runGenerate()}
      />
      {data.responseCount === 0 ? (
        <p className="app-radius border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted">
          {data.selectedClientId
            ? `No submitted responses for ${data.selectedClientName} yet.`
            : "No submitted responses yet. Publish a form and collect the first one."}
        </p>
      ) : displaySummary ? (
        <SummarizeBriefing summary={displaySummary} />
      ) : showIntro ? (
        <SummarizeIntroCard />
      ) : null}
    </main>
  );
}
