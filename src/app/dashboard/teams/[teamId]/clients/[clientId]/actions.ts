"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  addFieldSchema,
  createFormSchema,
  deleteFieldSchema,
  deleteFormSchema,
  publishFormSchema,
  reorderFieldsSchema,
  updateFieldSchema,
  updateFormSchema,
  saveTemplateSchema,
} from "@/lib/validations";
import {
  addFieldToForm,
  createFormForUser,
  deleteClientForm,
  deleteFieldOnForm,
  reorderFieldsOnForm,
  setClientFormPublish,
  updateClientForm,
  updateFieldOnForm,
} from "@/lib/forms";
import { saveFormAsTemplate } from "@/lib/templates";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");
  return session;
}

function clientPath(teamId: string, clientId: string) {
  return `/dashboard/teams/${teamId}/clients/${clientId}`;
}

function builderPath(teamId: string, clientId: string, formId: string) {
  return `/dashboard/teams/${teamId}/clients/${clientId}/forms/${formId}`;
}

function revalidateBuilder(teamId: string, clientId: string, formId: string) {
  revalidateTag("dashboard-shell", "max");
  revalidatePath(`/dashboard/forms/${formId}`);
  revalidatePath(builderPath(teamId, clientId, formId));
  revalidatePath(clientPath(teamId, clientId));
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard");
}

export async function createForm(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");

  const parsed = createFormSchema.safeParse({
    teamId: teamId || undefined,
    clientId: clientId || undefined,
    title: formData.get("title"),
    templateId: String(formData.get("templateId") ?? "") || undefined,
  });

  if (!parsed.success) {
    return { error: "Enter a form title." };
  }

  let form;
  try {
    form = await createFormForUser(session.user.id, session.user.role, parsed.data);
  } catch {
    return { error: "Could not create this form." };
  }

  revalidateTag("dashboard-shell", "max");
  revalidatePath(clientPath(teamId, clientId));
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard");
  return { formId: form.id };
}

export async function updateForm(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");

  const parsed = updateFormSchema.safeParse({
    teamId,
    clientId,
    formId,
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { error: "Enter a form title." };
  }

  try {
    await updateClientForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.title,
      parsed.data.description
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Save failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return {};
}

export async function deleteForm(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");

  const parsed = deleteFormSchema.safeParse({
    teamId,
    clientId,
    formId: formData.get("formId"),
  });

  if (!parsed.success) {
    return { error: "Form not found." };
  }

  try {
    await deleteClientForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Delete failed." };
  }

  revalidatePath(clientPath(teamId, clientId));
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard");
  return {};
}

export async function togglePublishForm(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");

  const parsed = publishFormSchema.safeParse({
    teamId,
    clientId,
    formId,
    action: formData.get("action"),
  });

  if (!parsed.success) {
    return { error: "Invalid action." };
  }

  try {
    await setClientFormPublish(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.action === "publish"
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Publish failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return {};
}

export async function addField(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");

  const parsed = addFieldSchema.safeParse({
    teamId,
    clientId,
    formId,
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: "Unknown field type." };
  }

  let question;
  try {
    question = await addFieldToForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.type
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Add failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return { fieldId: question.id };
}

export async function updateField(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");
  const fieldId = String(formData.get("fieldId") ?? "");

  const parsed = updateFieldSchema.safeParse({
    teamId,
    clientId,
    formId,
    fieldId,
    label: formData.get("label"),
    required: formData.get("required"),
    optionsText: formData.get("optionsText") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Check field details." };
  }

  try {
    await updateFieldOnForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId ?? "",
      parsed.data.clientId ?? "",
      parsed.data.formId,
      parsed.data.fieldId,
      {
        label: parsed.data.label,
        required: parsed.data.required,
        optionsText: parsed.data.optionsText,
      }
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Save failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return {};
}

export async function deleteField(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");

  const parsed = deleteFieldSchema.safeParse({
    teamId,
    clientId,
    formId,
    fieldId: formData.get("fieldId"),
  });

  if (!parsed.success) {
    return { error: "Field not found." };
  }

  try {
    await deleteFieldOnForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId ?? "",
      parsed.data.clientId ?? "",
      parsed.data.formId,
      parsed.data.fieldId
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Delete failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return {};
}

export async function reorderFields(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");
  const orderedRaw = String(formData.get("orderedIds") ?? "[]");

  let orderedIds: string[] = [];
  try {
    orderedIds = JSON.parse(orderedRaw);
  } catch {
    return { error: "Could not reorder." };
  }

  const parsed = reorderFieldsSchema.safeParse({
    teamId,
    clientId,
    formId,
    orderedIds,
  });

  if (!parsed.success) {
    return { error: "Could not reorder." };
  }

  try {
    await reorderFieldsOnForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId ?? "",
      parsed.data.clientId ?? "",
      parsed.data.formId,
      parsed.data.orderedIds
    );
  } catch {
    return { error: "Could not reorder." };
  }

  return {};
}

export async function saveAsTemplate(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = saveTemplateSchema.safeParse({
    formId: formData.get("formId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { error: "Enter a template name." };
  }

  try {
    await saveFormAsTemplate(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.name,
      parsed.data.description
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save template.",
    };
  }

  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/forms");
  return {};
}
