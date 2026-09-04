import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";

export default function ClientsLoading() {
  return (
    <DirectoryLoadingShell
      storageKey="optiphoenix.clientsView"
      withActions
      tableColumns={6}
      metaLines={4}
    />
  );
}
