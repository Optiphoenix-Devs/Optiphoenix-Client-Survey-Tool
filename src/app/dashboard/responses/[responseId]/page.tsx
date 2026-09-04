import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AnswerDisplay } from "@/components/response/answer-display";
import { getResponseDetail } from "@/lib/responses";
import { formatMonthYear } from "@/lib/format";

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { responseId } = await params;
  const response = await getResponseDetail(
    session.user.id,
    session.user.role,
    responseId
  );

  if (!response) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href="/dashboard/responses"
        className="text-sm font-medium text-accent hover:text-accent-hover"
      >
        {"< back to responses"}
      </Link>

      <header className="app-radius border border-border bg-card app-shadow-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Feedback
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {response.formTitle}
        </h1>

        <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Client</dt>
            <dd className="mt-1 text-sm font-medium">{response.clientName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Team</dt>
            <dd className="mt-1 text-sm font-medium">{response.teamName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Submitted</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatMonthYear(response.submittedAt)}
            </dd>
          </div>
        </dl>
      </header>

      {response.answers.length === 0 ? (
        <p className="app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          This submission has no answers.
        </p>
      ) : (
        <section className="overflow-hidden app-radius border border-border bg-card app-shadow-card">
          <ol className="divide-y divide-border">
            {response.answers.map((answer, index) => (
              <li key={answer.id} className="px-6 pt-8 pb-5">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 pt-0.5 text-xl font-extrabold tabular-nums leading-snug text-foreground">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <h3 className="min-w-0 text-lg font-extrabold leading-snug tracking-tight text-foreground sm:text-xl">
                        {answer.label}
                      </h3>
                      <span className="w-fit shrink-0 self-start app-radius bg-brand/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                        {answer.typeLabel}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <AnswerDisplay
                        type={answer.type}
                        value={answer.value}
                        display={answer.display}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
