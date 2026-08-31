import { Suspense } from "react";
import { DirectoryLoading } from "@/components/directory/directory-loading";
import { DirectorySkeleton } from "@/components/ui/skeleton";

export default function TeamsLoading() {
  return (
    <Suspense fallback={<DirectorySkeleton withActions tableColumns={5} />}>
      <DirectoryLoading
        storageKey="optiphoenix.teamsView"
        withActions
        tableColumns={5}
        metaLines={2}
      />
    </Suspense>
  );
}
