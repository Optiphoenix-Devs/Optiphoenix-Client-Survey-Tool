import { Suspense } from "react";
import { DashboardLoadingShell } from "@/components/directory/dashboard-loading";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLoadingShell />
    </Suspense>
  );
}
