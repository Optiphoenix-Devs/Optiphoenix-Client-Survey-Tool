import { checkDatabase } from "@/lib/db-check";

export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await checkDatabase();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-6 py-16 text-foreground">
      <p className="text-sm font-medium uppercase tracking-wide text-muted">
        OptiPhoenix Client Survey Tool
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Survey tool setup
      </h1>
      <p className="text-base leading-7 text-muted">
        Next.js is talking to MAMP MySQL. Sign in as Admin or Team Lead to
        create teams. Clients never log in.
      </p>

      <p>
        <a
          href="/login"
          className="inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Go to sign in
        </a>
      </p>

      <section
        className={`rounded-xl border p-5 ${
          result.ok
            ? "border-emerald-700 bg-emerald-50"
            : "border-rose-700 bg-rose-50"
        }`}
      >
        <p
          className={`font-semibold ${
            result.ok ? "text-emerald-900" : "text-rose-900"
          }`}
        >
          {result.ok ? "Connected" : "Not connected"}
        </p>
        <p
          className={`mt-1 text-sm ${
            result.ok ? "text-emerald-800" : "text-rose-800"
          }`}
        >
          {result.message}
        </p>
      </section>

      {result.counts && (
        <section className="rounded-xl border border-border bg-card p-5 text-foreground">
          <h2 className="mb-3 font-semibold text-foreground">
            Row counts (empty is OK)
          </h2>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted sm:grid-cols-3">
            <li>Users: {result.counts.users}</li>
            <li>Teams: {result.counts.teams}</li>
            <li>Clients: {result.counts.clients}</li>
            <li>Forms: {result.counts.forms}</li>
            <li>Surveys: {result.counts.surveys}</li>
            <li>Questions: {result.counts.questions}</li>
            <li>Responses: {result.counts.responses}</li>
            <li>Answers: {result.counts.answers}</li>
          </ul>
        </section>
      )}

      <p className="text-sm text-muted">
        JSON version:{" "}
        <a className="font-medium text-accent underline hover:text-accent-hover" href="/api/db-check">
          /api/db-check
        </a>
      </p>
    </main>
  );
}
