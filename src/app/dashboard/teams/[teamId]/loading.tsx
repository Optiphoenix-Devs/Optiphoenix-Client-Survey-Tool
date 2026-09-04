import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";

export default function TeamClientsLoading() {
  return (
    <DirectoryLoadingShell
      storageKey="optiphoenix.clientsView"
      withActions
      tableColumns={6}
      metaLines={4}
    />
  );
}
