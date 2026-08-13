import { checkDatabase } from "@/lib/db-check";

export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await checkDatabase();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-zinc-500">
        OptiPhoenix Client Survey Tool
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Step 3 — Database connection test
      </h1>
      <p className="text-zinc-600">
        This page asks Next.js to talk to MySQL through Prisma. If you see
        Connected below, Aiven (or later MAMP) is working.
      </p>

      <section
        className={`rounded-xl border p-5 ${
          result.ok
            ? "border-emerald-200 bg-emerald-50"
            : "border-rose-200 bg-rose-50"
        }`}
      >
        <p className="font-medium">{result.ok ? "Connected" : "Not connected"}</p>
        <p className="mt-1 text-sm text-zinc-700">{result.message}</p>
      </section>

      {result.counts && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 font-medium">Row counts (empty is OK)</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <li>Users: {result.counts.users}</li>
            <li>Forms: {result.counts.forms}</li>
            <li>Questions: {result.counts.questions}</li>
            <li>Responses: {result.counts.responses}</li>
            <li>Answers: {result.counts.answers}</li>
          </ul>
        </section>
      )}

      <p className="text-sm text-zinc-500">
        JSON version:{" "}
        <a className="underline" href="/api/db-check">
          /api/db-check
        </a>
      </p>
    </main>
  );
}
