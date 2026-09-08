"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createFormSchema } from "@/lib/validations";
import {
  createFormForUser,
  deleteClientForm,
  duplicateFormForUser,
  requireFormAccess,
} from "@/lib/forms";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";

export async function createFormFromList(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const source = String(formData.get("source") ?? "blank");
  const templateId = String(formData.get("templateId") ?? "") || undefined;
  const draftFormId = String(formData.get("draftFormId") ?? "") || undefined;
  const title = String(formData.get("title") ?? "").trim();

  if (source === "draft" && draftFormId) {
    if (title.length < 2) {
      return { error: "Enter a form title." };
    }
    try {
      const copy = await duplicateFormForUser(
        session.user.id,
        session.user.role,
        draftFormId
      );
      await prisma.form.update({
        where: { id: copy.id },
        data: {
          title,
          teamId: null,
          clientId: null,
          status: "DRAFT",
        },
      });
      revalidateTag("dashboard-shell", "max");
      revalidatePath("/dashboard/forms");
      revalidatePath("/dashboard");
      return { formId: copy.id };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Could not create this form.",
      };
    }
  }

  const parsed = createFormSchema.safeParse({
    title,
    templateId: source === "template" ? templateId : undefined,
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
      return { error: "Only draft forms can be removed. Unpublish first." };
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
      error: error instanceof Error ? error.message : "Remove failed.",
    };
  }

  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard");
  return {};
}
