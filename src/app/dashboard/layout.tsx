import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logout } from "./actions";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  return (
    <DashboardShell
      name={session.user.name ?? "User"}
      role={session.user.role}
      logoutAction={logout}
    >
      {children}
    </DashboardShell>
  );
}
