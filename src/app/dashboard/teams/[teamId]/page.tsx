import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTeamWithClients } from "@/lib/clients";
import { createClient, deleteClient, updateClient } from "./actions";
import { DeleteClientButton } from "./delete-client-button";

export default async function TeamClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
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

  const { teamId } = await params;
  const { error, created, updated, deleted } = await searchParams;
  const team = await getTeamWithClients(
    session.user.id,
    session.user.role,
    teamId
  );

  if (!team) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8 text-foreground">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted">
            <Link href="/dashboard" className="text-accent hover:text-accent-hover">
              Dashboard
            </Link>
            {" / "}
            Team
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            {team.name}
          </h1>
          <p className="mt-1 text-base text-muted">
            {team._count.clients} clients · {team._count.forms} forms ·{" "}
            {team._count.members} members
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-stone-100"
        >
          Back to teams
        </Link>
      </header>

      {error ? (
        <p className="rounded-lg border border-rose-700 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
          {error.replaceAll("+", " ")}
        </p>
      ) : null}
      {created ? (
        <p className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Client added.
        </p>
      ) : null}
      {updated ? (
        <p className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Client updated.
        </p>
      ) : null}
      {deleted ? (
        <p className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Client deleted.
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Add a client</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Clients belong to this team. Open a client to create their feedback
          forms.
        </p>
        <form action={createClient} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="teamId" value={team.id} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground sm:col-span-2">
            Client name *
            <input
              type="text"
              name="name"
              required
              minLength={2}
              maxLength={120}
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Email (optional)
            <input
              type="email"
              name="email"
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Company (optional)
            <input
              type="text"
              name="company"
              maxLength={120}
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
            >
              Add client
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">Clients</h2>
        {team.clients.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No clients yet. Add the first one above.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {team.clients.map((client) => (
              <li
                key={client.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      <Link
                        href={`/dashboard/teams/${team.id}/clients/${client.id}`}
                        className="hover:text-accent"
                      >
                        {client.name}
                      </Link>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {client.email || "No email"} ·{" "}
                      {client.company || "No company"} · {client._count.forms}{" "}
                      forms
                    </p>
                    <Link
                      href={`/dashboard/teams/${team.id}/clients/${client.id}`}
                      className="mt-2 inline-block text-sm font-medium text-accent hover:text-accent-hover"
                    >
                      Open client & forms →
                    </Link>
                  </div>
                  <DeleteClientButton
                    teamId={team.id}
                    clientId={client.id}
                    clientName={client.name}
                    deleteAction={deleteClient}
                  />
                </div>

                <form
                  action={updateClient}
                  className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2"
                >
                  <input type="hidden" name="teamId" value={team.id} />
                  <input type="hidden" name="clientId" value={client.id} />
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground sm:col-span-2">
                    Name
                    <input
                      type="text"
                      name="name"
                      required
                      minLength={2}
                      maxLength={120}
                      defaultValue={client.name}
                      className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Email
                    <input
                      type="email"
                      name="email"
                      defaultValue={client.email ?? ""}
                      className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Company
                    <input
                      type="text"
                      name="company"
                      maxLength={120}
                      defaultValue={client.company ?? ""}
                      className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-medium text-foreground hover:bg-stone-100"
                    >
                      Save client
                    </button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
