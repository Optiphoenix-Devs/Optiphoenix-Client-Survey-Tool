import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarCounts } from "@/lib/teams";
import { logout } from "./actions";
import { DashboardShell } from "./dashboard-shell";

const getShellData = (userId: string, role: "ADMIN" | "TEAM_LEAD") =>
  unstable_cache(
    async () => {
      const [counts, user, userCount] = await Promise.all([
        getSidebarCounts(userId, role),
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, avatarUrl: true, role: true },
        }),
        role === "ADMIN" ? prisma.user.count() : Promise.resolve(0),
      ]);
      return { counts, user, userCount };
    },
    ["dashboard-shell", userId, role],
    { revalidate: 20, tags: ["dashboard-shell"] }
  )();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const { counts, user, userCount } = await getShellData(
    session.user.id,
    session.user.role
  );

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
      responseCount={counts.responseCount}
      templateCount={counts.templateCount}
      userCount={userCount}
      logoutAction={logout}
    >
      {children}
    </DashboardShell>
  );
}
