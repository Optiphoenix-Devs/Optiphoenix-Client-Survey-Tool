import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientWorkspace } from "@/lib/forms";
import { createForm, deleteForm } from "./actions";

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; clientId: string }>;
  searchParams: Promise<{
    error?: string;
    formDeleted?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { teamId, clientId } = await params;
  const { error, formDeleted } = await searchParams;
  const client = await getClientWorkspace(
    session.user.id,
    session.user.role,
    teamId,
    clientId
  );

  if (!client) notFound();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8 text-foreground">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-muted">
          <Link href="/dashboard" className="text-accent hover:text-accent-hover">
            Dashboard
          </Link>
          {" / "}
          <Link
            href={`/dashboard/teams/${teamId}`}
            className="text-accent hover:text-accent-hover"
          >
            {client.team.name}
          </Link>
          {" / Client"}
        </p>
        <h1 className="mt-1 text-3xl font-semibold">{client.name}</h1>
        <p className="mt-1 text-base text-muted">
          {client.email || "No email"} · {client.company || "No company"}
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-rose-700 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
          {error.replaceAll("+", " ")}
        </p>
      ) : null}
      {formDeleted ? (
        <p className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Form deleted.
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">New feedback form</h2>
        <p className="mt-1 text-sm text-muted">
          Forms belong to this client only. After creating, pick field types and
          drag them into the order you want.
        </p>
        <form action={createForm} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="clientId" value={clientId} />
          <input
            name="title"
            required
            minLength={2}
            placeholder="Form title, e.g. Q1 delivery feedback"
            className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            Create form
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold">Feedback forms</h2>
        {client.forms.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No forms for this client yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {client.forms.map((form) => (
              <li
                key={form.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-semibold">
                    <Link
                      href={`/dashboard/teams/${teamId}/clients/${clientId}/forms/${form.id}`}
                      className="hover:text-accent"
                    >
                      {form.title}
                    </Link>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {form.status === "PUBLISHED" ? "Published" : "Draft"} ·{" "}
                    {form._count.questions} fields
                  </p>
                  <Link
                    href={`/dashboard/teams/${teamId}/clients/${clientId}/forms/${form.id}`}
                    className="mt-2 inline-block text-sm font-medium text-accent hover:text-accent-hover"
                  >
                    Build / preview →
                  </Link>
                </div>
                <form action={deleteForm}>
                  <input type="hidden" name="teamId" value={teamId} />
                  <input type="hidden" name="clientId" value={clientId} />
                  <input type="hidden" name="formId" value={form.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-rose-700 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-900"
                  >
                    Delete
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
