import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getResponseDetail } from "@/lib/responses";
import { formatRelativeTime } from "@/lib/format";

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

  const submitted = new Date(response.submittedAt);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <div>
        <Link
          href="/dashboard/responses"
          className="text-sm font-medium text-accent hover:text-accent-hover"
        >
          ← Responses
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {response.formTitle}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {response.clientName} · {response.teamName}
        </p>
        <p className="mt-1 text-sm text-muted">
          Submitted {formatRelativeTime(response.submittedAt)} ·{" "}
          {submitted.toLocaleString()}
        </p>
        <Link
          href={response.formHref}
          className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-hover"
        >
          Open form
        </Link>
      </div>

      {response.answers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          This submission has no answers.
        </p>
      ) : (
        <ol className="space-y-3">
          {response.answers.map((answer, index) => (
            <li
              key={answer.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                {index + 1}. {answer.typeLabel}
              </p>
              <p className="mt-1 text-sm font-medium">{answer.label}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {answer.display}
              </p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
