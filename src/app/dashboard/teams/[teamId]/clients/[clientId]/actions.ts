"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  addFieldSchema,
  createFormSchema,
  deleteFieldSchema,
  deleteFormSchema,
  publishFormSchema,
  reorderFieldsSchema,
  updateFieldSchema,
  updateFormSchema,
} from "@/lib/validations";
import {
  addFieldToForm,
  createClientForm,
  deleteClientForm,
  deleteFieldOnForm,
  reorderFieldsOnForm,
  setClientFormPublish,
  updateClientForm,
  updateFieldOnForm,
} from "@/lib/forms";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");
  return session;
}

function clientPath(teamId: string, clientId: string, query?: string) {
  return `/dashboard/teams/${teamId}/clients/${clientId}${query ? `?${query}` : ""}`;
}

function builderPath(
  teamId: string,
  clientId: string,
  formId: string,
  query?: Record<string, string>
) {
  const params = new URLSearchParams(query);
  const suffix = params.toString();
  return `/dashboard/teams/${teamId}/clients/${clientId}/forms/${formId}${
    suffix ? `?${suffix}` : ""
  }`;
}

export async function createForm(formData: FormData) {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");

  const parsed = createFormSchema.safeParse({
    teamId,
    clientId,
    title: formData.get("title"),
  });

  if (!parsed.success) {
    redirect(clientPath(teamId, clientId, "error=Enter+a+form+title"));
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
    redirect(clientPath(teamId, clientId, "error=Could+not+create+form"));
  }

  redirect(builderPath(teamId, clientId, form.id));
}

export async function updateForm(formData: FormData) {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");

  const parsed = updateFormSchema.safeParse({
    teamId,
    clientId,
    formId,
    title: formData.get("title"),
  });

  if (!parsed.success) {
    redirect(
      builderPath(teamId, clientId, formId, { error: "Enter a form title" })
    );
  }

  try {
    await updateClientForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.title
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    redirect(builderPath(teamId, clientId, formId, { error: message }));
  }

  redirect(builderPath(teamId, clientId, formId, { updated: "1" }));
}

export async function deleteForm(formData: FormData) {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");

  const parsed = deleteFormSchema.safeParse({
    teamId,
    clientId,
    formId: formData.get("formId"),
  });

  if (!parsed.success) {
    redirect(clientPath(teamId, clientId, "error=Form+not+found"));
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
    const message =
      error instanceof Error ? error.message.replaceAll(" ", "+") : "Delete+failed";
    redirect(clientPath(teamId, clientId, `error=${message}`));
  }

  redirect(clientPath(teamId, clientId, "formDeleted=1"));
}

export async function togglePublishForm(formData: FormData) {
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
    redirect(builderPath(teamId, clientId, formId, { error: "Invalid action" }));
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
    const message = error instanceof Error ? error.message : "Publish failed";
    redirect(builderPath(teamId, clientId, formId, { error: message }));
  }

  redirect(
    builderPath(teamId, clientId, formId, {
      [parsed.data.action === "publish" ? "published" : "unpublished"]: "1",
    })
  );
}

export async function addField(formData: FormData) {
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
    redirect(
      builderPath(teamId, clientId, formId, { error: "Unknown field type" })
    );
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
    const message = error instanceof Error ? error.message : "Add failed";
    redirect(builderPath(teamId, clientId, formId, { error: message }));
  }

  redirect(builderPath(teamId, clientId, formId, { focus: question.id }));
}

export async function updateField(formData: FormData) {
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
    redirect(
      builderPath(teamId, clientId, formId, {
        error: "Check field details",
        focus: fieldId,
      })
    );
  }

  try {
    await updateFieldOnForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.fieldId,
      {
        label: parsed.data.label,
        required: parsed.data.required,
        optionsText: parsed.data.optionsText,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    redirect(
      builderPath(teamId, clientId, formId, { error: message, focus: fieldId })
    );
  }

  redirect(
    builderPath(teamId, clientId, formId, {
      updated: "1",
      focus: parsed.data.fieldId,
    })
  );
}

export async function deleteField(formData: FormData) {
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
    redirect(builderPath(teamId, clientId, formId, { error: "Field not found" }));
  }

  try {
    await deleteFieldOnForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.fieldId
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    redirect(builderPath(teamId, clientId, formId, { error: message }));
  }

  redirect(builderPath(teamId, clientId, formId));
}

export async function reorderFields(formData: FormData) {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");
  const orderedRaw = String(formData.get("orderedIds") ?? "[]");

  let orderedIds: string[] = [];
  try {
    orderedIds = JSON.parse(orderedRaw);
  } catch {
    return { error: "Could not reorder" };
  }

  const parsed = reorderFieldsSchema.safeParse({
    teamId,
    clientId,
    formId,
    orderedIds,
  });

  if (!parsed.success) {
    return { error: "Could not reorder" };
  }

  try {
    await reorderFieldsOnForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.orderedIds
    );
  } catch {
    return { error: "Could not reorder" };
  }

  return { ok: true };
}
