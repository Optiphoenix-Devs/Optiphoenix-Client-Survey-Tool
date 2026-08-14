import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
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
      className={cn("card-enter", className)}
      style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
    >
      {children}
    </div>
  );
}

export function DirectorySkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <FormCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
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
        <Skeleton className="h-52 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-52 rounded-3xl" />
        <Skeleton className="h-52 rounded-3xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-48 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <FormCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-5 h-3 w-40" />
    </div>
  );
}

export function BuilderSkeleton() {
  return (
    <div className="flex h-full min-h-[70vh] gap-4 p-4">
      <Skeleton className="hidden w-56 shrink-0 rounded-2xl lg:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="hidden w-72 shrink-0 rounded-2xl xl:block" />
    </div>
  );
}
