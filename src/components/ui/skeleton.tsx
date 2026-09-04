"use client";

import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DirectoryView } from "@/components/directory/directory-toolbar";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton app-radius", className)} />;
}

export function Stagger({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("card-enter h-full", className)}
      style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
    >
      {children}
    </div>
  );
}

function DirectoryToolbarSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-10 flex-1 rounded-full" />
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
  );
}

export function DirectoryCardSkeleton({
  metaLines = 2,
  withActions = false,
  withIcon = true,
}: {
  metaLines?: number;
  withActions?: boolean;
  withIcon?: boolean;
}) {
  return (
    <div className="directory-card flex h-full flex-col p-6">
      <div className="relative">
        {withIcon ? <Skeleton className="h-10 w-10" /> : null}
        <Skeleton className={cn("h-7 w-2/3", withIcon ? "mt-4" : undefined)} />
        <div className="mt-5 space-y-2">
          {Array.from({ length: metaLines }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        {withActions ? (
          <div className="directory-card-footer mt-6 flex flex-wrap gap-2 pt-5">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FormCardSkeleton() {
  return (
    <div className="directory-card flex h-full flex-col p-6">
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-10 w-10" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="mt-4 h-7 w-3/4" />
        <div className="mt-5 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function DirectoryTableSkeleton({
  columns = 5,
  rows = 6,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="directory-table-wrap">
      <div className="min-w-[40rem]">
        <div
          className="flex gap-4 border-b border-border px-4 py-3.5"
          style={{ backgroundColor: "var(--chrome)" }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn("h-5", index === 0 ? "w-[28%]" : "min-w-0 flex-1")}
            />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn("h-4", colIndex === 0 ? "w-[28%]" : "min-w-0 flex-1")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DirectorySkeleton({
  view = "grid",
  cardVariant = "directory",
  tableColumns = 5,
  withActions = false,
  metaLines = 2,
}: {
  view?: DirectoryView;
  cardVariant?: "directory" | "form";
  tableColumns?: number;
  withActions?: boolean;
  metaLines?: number;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <DirectoryToolbarSkeleton />
      {view === "grid" ? (
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) =>
            cardVariant === "form" ? (
              <FormCardSkeleton key={index} />
            ) : (
              <DirectoryCardSkeleton
                key={index}
                metaLines={metaLines}
                withActions={withActions}
              />
            )
          )}
        </div>
      ) : (
        <DirectoryTableSkeleton columns={tableColumns} />
      )}
    </div>
  );
}

export function DashboardSkeleton({ formsView = "grid" }: { formsView?: DirectoryView }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <Skeleton className="h-52 app-radius lg:col-span-2" />
        <Skeleton className="h-52 app-radius" />
        <Skeleton className="h-52 app-radius" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 app-radius" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-48 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </div>
        {formsView === "grid" ? (
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <FormCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <DirectoryTableSkeleton columns={6} />
        )}
      </div>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-72 app-radius" />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Skeleton className="h-56 app-radius" />
        <Skeleton className="h-56 app-radius" />
      </div>
      <Skeleton className="h-72 app-radius" />
      <div className="space-y-4 app-radius border border-border bg-card p-6">
        <Skeleton className="h-6 w-56" />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-48 app-radius" />
        </div>
        <DirectoryTableSkeleton columns={3} rows={5} />
      </div>
      <div className="space-y-4 app-radius border border-border bg-card p-6">
        <Skeleton className="h-6 w-64" />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-48 app-radius" />
        </div>
        <DirectoryTableSkeleton columns={3} rows={5} />
      </div>
      <div className="space-y-4 app-radius border border-border bg-card p-6">
        <Skeleton className="h-6 w-72" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 app-radius" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SummarizeGeneratingOverlay({
  onStop,
  sidebarLeft = "lg:left-64",
}: {
  onStop?: () => void;
  sidebarLeft?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm",
        "left-0",
        sidebarLeft
      )}
      role="status"
      aria-live="polite"
      aria-label="Generating AI briefing"
    >
      <div className="w-full max-w-md app-radius border border-border bg-card p-8 text-center app-shadow-card">
        <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-accent" />
        <p className="mt-4 text-lg font-semibold tracking-tight">
          Building your briefing
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          This usually takes 1–2 minutes. Please stay on this page while we
          analyze the feedback.
        </p>
        {onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="mt-6 app-btn-secondary px-4 py-2 text-sm"
          >
            Stop generating
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SummarizeSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-44" />
        <div className="ml-auto flex flex-wrap gap-2">
          <Skeleton className="h-10 w-56 app-radius" />
          <Skeleton className="h-10 w-44 app-radius" />
          <Skeleton className="h-10 w-36 app-radius" />
        </div>
      </div>
      <div className="space-y-4 app-radius border border-border bg-card p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 app-radius" />
          <Skeleton className="h-32 app-radius" />
        </div>
      </div>
    </div>
  );
}

export function BuilderSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-4 w-14" />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="flex flex-col border-b border-border bg-card lg:h-full lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-4 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>
          <div className="space-y-1 px-3 py-3 lg:px-4 lg:py-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto bg-background px-4 py-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex gap-6 border-b border-border pb-2.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>

            <div className="overflow-hidden app-radius border border-border bg-white shadow-sm">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="space-y-3 px-5 py-5">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 app-radius border border-border bg-white px-3 py-3 shadow-sm"
                >
                  <Skeleton className="h-9 w-9 shrink-0" />
                  <Skeleton className="h-8 w-8 shrink-0 app-radius" />
                  <Skeleton className="h-4 min-w-0 flex-1" />
                  <Skeleton className="h-8 w-8 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function ResponseDetailSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <Skeleton className="h-4 w-14" />

      <div className="app-radius border border-border bg-card app-shadow-card p-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-9 w-4/5 max-w-lg" />
        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      <section className="overflow-hidden app-radius border border-border bg-card app-shadow-card">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="border-b border-border px-6 pt-8 pb-5 last:border-0"
          >
            <div className="flex items-start gap-2">
              <Skeleton className="h-6 w-6 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <Skeleton className="h-6 w-2/3 max-w-md" />
                  <Skeleton className="h-6 w-16 shrink-0" />
                </div>
                <Skeleton className="mt-3 h-4 w-32" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
