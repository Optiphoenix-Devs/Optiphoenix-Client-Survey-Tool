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

export function BuilderSkeleton() {
  return (
    <div className="flex h-full min-h-[70vh] gap-4 p-4">
      <Skeleton className="hidden w-56 shrink-0 app-radius lg:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Skeleton className="h-14 app-radius" />
        <Skeleton className="h-32 app-radius" />
        <Skeleton className="h-32 app-radius" />
        <Skeleton className="h-32 app-radius" />
      </div>
      <Skeleton className="hidden w-72 shrink-0 app-radius xl:block" />
    </div>
  );
}
