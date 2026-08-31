"use client";

import { useSearchParams } from "next/navigation";
import type { DirectoryView } from "@/components/directory/directory-toolbar";
import { resolveDirectoryView } from "@/lib/directory-view";
import { DirectorySkeleton } from "@/components/ui/skeleton";

export function DirectoryLoading({
  storageKey,
  cardVariant = "directory",
  tableColumns = 5,
  withActions = false,
  metaLines = 2,
}: {
  storageKey: string;
  cardVariant?: "directory" | "form";
  tableColumns?: number;
  withActions?: boolean;
  metaLines?: number;
}) {
  const searchParams = useSearchParams();
  const view: DirectoryView = resolveDirectoryView(
    searchParams.get("view"),
    storageKey
  );

  return (
    <DirectorySkeleton
      view={view}
      cardVariant={cardVariant}
      tableColumns={tableColumns}
      withActions={withActions}
      metaLines={metaLines}
    />
  );
}
