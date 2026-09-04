import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";

export default function FormsLoading() {
  return (
    <DirectoryLoadingShell
      storageKey="optiphoenix.formsView"
      cardVariant="form"
      tableColumns={6}
    />
  );
}
