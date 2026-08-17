import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getResponsesForUser } from "@/lib/responses";
import { ResponsesDirectory } from "./responses-directory";

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { form: formId } = await searchParams;
  const responses = await getResponsesForUser(
    session.user.id,
    session.user.role,
    formId
  );
  const formTitle =
    formId && responses[0] ? responses[0].formTitle : undefined;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <ResponsesDirectory responses={responses} formTitle={formTitle} />
    </main>
  );
}
