import { Suspense } from "react";
import { DirectoryLoading } from "@/components/directory/directory-loading";
import { DirectorySkeleton } from "@/components/ui/skeleton";

export default function ResponsesLoading() {
  return (
    <Suspense fallback={<DirectorySkeleton tableColumns={5} metaLines={4} />}>
      <DirectoryLoading
        storageKey="optiphoenix.responsesView"
        tableColumns={5}
        metaLines={4}
      />
    </Suspense>
  );
}
