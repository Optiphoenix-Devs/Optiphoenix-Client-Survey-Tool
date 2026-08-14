"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createFormSchema } from "@/lib/validations";
import { createClientForm } from "@/lib/forms";
import type { ActionResult } from "@/lib/action-result";

export async function createFormFromList(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const parsed = createFormSchema.safeParse({
    teamId: formData.get("teamId"),
    clientId: formData.get("clientId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: "Choose a client and enter a form title." };
  }

  let form;
  try {
    form = await createClientForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.title
    );
  } catch {
    return { error: "Could not create this form." };
  }

  redirect(
    `/dashboard/teams/${parsed.data.teamId}/clients/${parsed.data.clientId}/forms/${form.id}`
  );
}
