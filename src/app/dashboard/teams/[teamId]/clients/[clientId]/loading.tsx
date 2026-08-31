import { Suspense } from "react";
import { DirectoryLoading } from "@/components/directory/directory-loading";
import { DirectorySkeleton } from "@/components/ui/skeleton";

export default function ClientLoading() {
  return (
    <Suspense fallback={<DirectorySkeleton cardVariant="form" tableColumns={6} />}>
      <DirectoryLoading
        storageKey="optiphoenix.clientFormsView"
        cardVariant="form"
        tableColumns={6}
      />
    </Suspense>
  );
}
