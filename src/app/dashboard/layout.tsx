import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarCounts } from "@/lib/teams";
import { logout } from "./actions";
import { DashboardShell } from "./dashboard-shell";

function hasAuthSessionCookie(
  jar: Awaited<ReturnType<typeof cookies>>
) {
  return jar
    .getAll()
    .some(
      (cookie) =>
        cookie.name.includes("authjs.session-token") ||
        cookie.name.includes("next-auth.session-token")
    );
}

const getShellData = (userId: string, role: "ADMIN" | "TEAM_LEAD") =>
  // Sidebar counts are shared across every dashboard route. Cache them so
  // client-side navigations do not re-run 4–5 MySQL queries each time.
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
    { revalidate: 60, tags: ["dashboard-shell"] }
  )();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    const jar = await cookies();
    // signOut must run in a Route Handler — layouts cannot modify cookies.
    if (hasAuthSessionCookie(jar)) {
      redirect("/api/auth/clear-session?notice=signed-out-elsewhere");
    }
    redirect("/login");
  }

  // Always load real badge counts — even on builder routes (sidebar is hidden
  // there). Returning zeros on the builder poisoned the shared layout cache so
  // soft-navigating back to Forms/Teams showed 0 badges.
  const { counts, user, userCount } = await getShellData(
    session.user.id,
    session.user.role
  );

  if (!user) {
    redirect("/api/auth/clear-session");
  }

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
