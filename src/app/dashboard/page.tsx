import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getTeamsForUser } from "@/lib/teams";
import { createTeam, deleteTeam, updateTeam } from "./actions";
import { DeleteTeamButton } from "./delete-team-button";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    updated?: string;
    deleted?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const { error, created, updated, deleted } = await searchParams;
  const teams = await getTeamsForUser(session.user.id, session.user.role);
  const isAdmin = session.user.role === "ADMIN";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-12 text-foreground">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Welcome, {session.user.name}
          </h1>
          <p className="mt-1 text-base text-muted">
            Role: {isAdmin ? "Admin (all teams)" : "Team Lead (your teams only)"}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-stone-100"
          >
            Sign out
          </button>
        </form>
      </header>

      {error ? (
        <p className="rounded-lg border border-rose-700 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
          {error.replaceAll("+", " ")}
        </p>
      ) : null}
      {created ? (
        <p className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Team created. You are a member of this team.
        </p>
      ) : null}
      {updated ? (
        <p className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Team name updated.
        </p>
      ) : null}
      {deleted ? (
        <p className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Team deleted.
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Create a team</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Team Leads work inside a team: Clients → Feedback forms. Creating a
          team also adds you as a member.
        </p>
        <form action={createTeam} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Team name"
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Create team
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">
          {isAdmin ? "All teams" : "Your teams"}
        </h2>
        {teams.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No teams yet. Create one above, or wait for an Admin to invite you.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {teams.map((team) => (
              <li
                key={team.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      <Link
                        href={`/dashboard/teams/${team.id}`}
                        className="hover:text-accent"
                      >
                        {team.name}
                      </Link>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {team._count.members} members · {team._count.clients}{" "}
                      clients · {team._count.forms} forms
                    </p>
                    <Link
                      href={`/dashboard/teams/${team.id}`}
                      className="mt-2 inline-block text-sm font-medium text-accent hover:text-accent-hover"
                    >
                      Open clients →
                    </Link>
                  </div>
                  <DeleteTeamButton
                    teamId={team.id}
                    teamName={team.name}
                    deleteAction={deleteTeam}
                  />
                </div>

                <form
                  action={updateTeam}
                  className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center"
                >
                  <input type="hidden" name="teamId" value={team.id} />
                  <label className="sr-only" htmlFor={`team-name-${team.id}`}>
                    Rename {team.name}
                  </label>
                  <input
                    id={`team-name-${team.id}`}
                    type="text"
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    defaultValue={team.name}
                    className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-medium text-foreground hover:bg-stone-100"
                  >
                    Save name
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
