import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, FileText, Users } from "lucide-react";
import { auth } from "@/auth";
import { getDashboardOverview } from "@/lib/teams";
import { createTeam, deleteTeam, updateTeam } from "./actions";
import { DeleteTeamButton } from "./delete-team-button";
import { PageHeader, StatCard } from "@/components/ui/page";

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
  const overview = await getDashboardOverview(
    session.user.id,
    session.user.role
  );
  const isAdmin = session.user.role === "ADMIN";
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description={
          isAdmin
            ? "You can see every team. Open a team, then a client, then build that client’s form."
            : "You only see teams you belong to. Open a team, then a client, then build that client’s form."
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Teams" value={overview.teamCount} />
        <StatCard icon={Users} label="Clients" value={overview.clientCount} />
        <StatCard icon={FileText} label="Forms" value={overview.formCount} />
        <StatCard
          icon={CheckCircle2}
          label="Published"
          value={overview.publishedCount}
          hint={`${overview.responseCount} responses`}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-700 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
          {error.replaceAll("+", " ")}
        </p>
      ) : null}
      {created ? (
        <p className="rounded-xl border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Team created. You are a member of this team.
        </p>
      ) : null}
      {updated ? (
        <p className="rounded-xl border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Team name updated.
        </p>
      ) : null}
      {deleted ? (
        <p className="rounded-xl border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Team deleted.
        </p>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">Create a team</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Path: Dashboard → Team → Client → Form builder. Insights come later
          from submitted answers, not from generating forms with AI.
        </p>
        <form action={createTeam} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Team name"
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            Create team
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold">{isAdmin ? "All teams" : "Your teams"}</h2>
        {overview.teams.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No teams yet. Create one above, or wait for an Admin to invite you.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {overview.teams.map((team) => (
              <li
                key={team.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
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
                    className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium hover:bg-background"
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
