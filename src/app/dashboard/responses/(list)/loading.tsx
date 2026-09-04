import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";

export default function ResponsesListLoading() {
  return (
    <DirectoryLoadingShell
      storageKey="optiphoenix.responsesView"
      tableColumns={5}
      metaLines={4}
    />
  );
}
