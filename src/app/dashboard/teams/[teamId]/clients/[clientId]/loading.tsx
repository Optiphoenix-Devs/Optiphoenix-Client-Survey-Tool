import { DirectoryLoadingShell } from "@/components/directory/directory-loading-shell";

export default function ClientLoading() {
  return (
    <DirectoryLoadingShell
      storageKey="optiphoenix.clientFormsView"
      cardVariant="form"
      tableColumns={6}
    />
  );
}
