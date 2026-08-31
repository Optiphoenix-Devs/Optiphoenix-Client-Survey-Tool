"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createFormSchema } from "@/lib/validations";
import { createFormForUser, deleteClientForm, requireFormAccess } from "@/lib/forms";
import type { ActionResult } from "@/lib/action-result";

export async function createFormFromList(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const parsed = createFormSchema.safeParse({
    title: formData.get("title"),
    templateId: String(formData.get("templateId") ?? "") || undefined,
    teamId: String(formData.get("teamId") ?? "") || undefined,
    clientId: String(formData.get("clientId") ?? "") || undefined,
  });

  if (!parsed.success) {
    return { error: "Enter a form title." };
  }

  let form;
  try {
    form = await createFormForUser(session.user.id, session.user.role, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create this form." };
  }

  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard");
  return { formId: form.id };
}

/** Delete a draft form from the Forms screen (published forms must be unpublished first). */
export async function deleteFormFromList(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const formId = String(formData.get("formId") ?? "");
  if (!formId) return { error: "Form not found." };

  try {
    const form = await requireFormAccess(
      session.user.id,
      session.user.role,
      formId
    );
    if (form.status !== "DRAFT") {
      return { error: "Only draft forms can be deleted. Unpublish first." };
    }
    await deleteClientForm(
      session.user.id,
      session.user.role,
      form.teamId ?? undefined,
      form.clientId ?? undefined,
      formId
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Delete failed.",
    };
  }

  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard");
  return {};
}
