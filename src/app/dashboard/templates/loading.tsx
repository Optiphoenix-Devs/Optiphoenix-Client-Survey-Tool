import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";

export default function TemplatesLoading() {
  return (
    <DirectoryLoadingShell
      storageKey="optiphoenix.templatesView"
      withActions
      tableColumns={5}
      metaLines={2}
    />
  );
}
