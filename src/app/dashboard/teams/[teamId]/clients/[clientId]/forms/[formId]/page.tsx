import { redirect } from "next/navigation";

export default async function LegacyFormBuilderRedirect({
  params,
}: {
  params: Promise<{ teamId: string; clientId: string; formId: string }>;
}) {
  const { formId } = await params;
  redirect(`/dashboard/forms/${formId}`);
}
