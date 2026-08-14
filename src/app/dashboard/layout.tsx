import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarCounts } from "@/lib/teams";
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

  const [counts, user, userCount] = await Promise.all([
    getSidebarCounts(session.user.id, session.user.role),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, avatarUrl: true, role: true },
    }),
    session.user.role === "ADMIN" ? prisma.user.count() : Promise.resolve(0),
  ]);

  if (!user) redirect("/login");

  return (
    <DashboardShell
      name={user.name}
      email={user.email}
      role={user.role}
      avatarUrl={user.avatarUrl}
      teamCount={counts.teamCount}
      clientCount={counts.clientCount}
      formCount={counts.formCount}
      userCount={userCount}
      logoutAction={logout}
    >
      {children}
    </DashboardShell>
  );
}
