import { Suspense } from "react";
import { DirectoryLoading } from "@/components/directory/directory-loading";
import { DirectorySkeleton } from "@/components/ui/skeleton";

export default function TemplatesLoading() {
  return (
    <Suspense fallback={<DirectorySkeleton withActions tableColumns={5} metaLines={2} />}>
      <DirectoryLoading
        storageKey="optiphoenix.templatesView"
        withActions
        tableColumns={5}
        metaLines={2}
      />
    </Suspense>
  );
}
