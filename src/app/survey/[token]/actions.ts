"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { submitPublicForm } from "@/lib/forms";

export async function submitSurvey(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) {
    redirect("/survey/missing");
  }

  try {
    await submitPublicForm(token, formData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not send feedback";
    redirect(`/survey/${token}?error=${encodeURIComponent(message)}`);
  }

  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/responses");
  revalidatePath("/dashboard/forms");
  redirect(`/survey/${token}?sent=1`);
}
