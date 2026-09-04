import { cookies } from "next/headers";
import type { DirectoryView } from "@/components/directory/directory-toolbar";
import { DirectorySkeleton } from "@/components/ui/skeleton";
import { directoryViewCookieName, parseDirectoryView } from "@/lib/directory-view";

type DirectoryLoadingShellProps = {
  storageKey: string;
  fallback?: DirectoryView;
  cardVariant?: "directory" | "form";
  tableColumns?: number;
  withActions?: boolean;
  metaLines?: number;
};

export async function DirectoryLoadingShell({
  storageKey,
  fallback = "grid",
  cardVariant = "directory",
  tableColumns = 5,
  withActions = false,
  metaLines = 2,
}: DirectoryLoadingShellProps) {
  const cookieStore = await cookies();
  const view = parseDirectoryView(
    cookieStore.get(directoryViewCookieName(storageKey))?.value,
    fallback
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
