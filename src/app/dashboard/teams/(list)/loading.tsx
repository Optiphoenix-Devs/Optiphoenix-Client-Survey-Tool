import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";

export default function TeamsListLoading() {
  return (
    <DirectoryLoadingShell
      storageKey="optiphoenix.teamsView"
      withActions
      tableColumns={5}
      metaLines={2}
    />
  );
}
