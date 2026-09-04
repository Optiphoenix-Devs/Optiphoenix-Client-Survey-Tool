import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getResponsesPage } from "@/lib/responses";
import { ResponsesDirectory } from "../responses-directory";

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  const { form: formId } = await searchParams;
  const page = await getResponsesPage(session.user.id, session.user.role, {
    page: 1,
    formId,
  });
  const formTitle =
    formId && page.rows[0] ? page.rows[0].formTitle : undefined;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <ResponsesDirectory
        initialPage={page}
        formId={formId}
        formTitle={formTitle}
      />
    </main>
  );
}
