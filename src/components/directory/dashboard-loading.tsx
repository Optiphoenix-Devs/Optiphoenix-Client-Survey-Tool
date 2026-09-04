import { cookies } from "next/headers";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { directoryViewCookieName, parseDirectoryView } from "@/lib/directory-view";

export async function DashboardLoadingShell() {
  const cookieStore = await cookies();
  const formsView = parseDirectoryView(
    cookieStore.get(directoryViewCookieName("optiphoenix.formsView"))?.value
  );

  return <DashboardSkeleton formsView={formsView} />;
}
