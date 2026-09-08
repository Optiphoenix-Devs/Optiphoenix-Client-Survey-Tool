import { DirectorySkeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <DirectorySkeleton view="table" tableColumns={4} withActions metaLines={1} />
  );
}
