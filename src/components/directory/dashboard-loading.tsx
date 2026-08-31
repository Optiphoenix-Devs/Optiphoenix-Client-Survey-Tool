"use client";

import { useSearchParams } from "next/navigation";
import { resolveDirectoryView } from "@/lib/directory-view";
import { DashboardSkeleton } from "@/components/ui/skeleton";

const FORMS_VIEW_KEY = "optiphoenix.formsView";

export function DashboardLoadingShell() {
  const searchParams = useSearchParams();
  const formsView = resolveDirectoryView(searchParams.get("view"), FORMS_VIEW_KEY);

  return <DashboardSkeleton formsView={formsView} />;
}
