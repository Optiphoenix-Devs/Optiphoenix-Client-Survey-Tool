import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { auth, signOut } from "@/auth";
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
    const replacedElsewhere = hasAuthSessionCookie(jar);
    // Clear stale cookie only when one exists; avoid racing a fresh login.
    if (replacedElsewhere) {
      await signOut({ redirect: false });
      redirect("/login?notice=signed-out-elsewhere");
    }
    redirect("/login");
  }

  const { counts, user, userCount } = await getShellData(
    session.user.id,
    session.user.role
  );

  if (!user) {
    await signOut({ redirect: false });
    redirect("/login");
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
