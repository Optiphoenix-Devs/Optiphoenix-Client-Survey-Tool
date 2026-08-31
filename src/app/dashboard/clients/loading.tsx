import { Suspense } from "react";
import { DirectoryLoading } from "@/components/directory/directory-loading";
import { DirectorySkeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
  return (
    <Suspense fallback={<DirectorySkeleton withActions tableColumns={6} metaLines={4} />}>
      <DirectoryLoading
        storageKey="optiphoenix.clientsView"
        withActions
        tableColumns={6}
        metaLines={4}
      />
    </Suspense>
  );
}
