"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import { saveFormImageUpload } from "@/lib/form-image-upload";
import { normalizeThankYouBg } from "@/lib/form-thank-you";
import {
  addFieldSchema,
  addSectionSchema,
  createFormSchema,
  deleteFieldSchema,
  deleteFormSchema,
  deleteSectionSchema,
  duplicateFieldSchema,
  duplicateFormSchema,
  publishFormSchema,
  reorderFieldsSchema,
  updateFieldSchema,
  updateFormSchema,
  updateSectionSchema,
  saveTemplateSchema,
} from "@/lib/validations";
import {
  addFieldToForm,
  addSectionToForm,
  applyTemplateToForm,
  attachFormToClient,
  createFormForUser,
  deleteClientForm,
  deleteFieldOnForm,
  deleteSectionOnForm,
  duplicateFieldOnForm,
  duplicateFormForUser,
  reorderFieldsOnForm,
  setClientFormPublish,
  updateClientForm,
  updateFieldOnForm,
  updateSectionOnForm,
} from "@/lib/forms";
import { saveFormAsTemplate } from "@/lib/templates";
import { prisma } from "@/lib/prisma";

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
  const source = String(formData.get("source") ?? "blank");
  const templateId = String(formData.get("templateId") ?? "") || undefined;
  const draftFormId = String(formData.get("draftFormId") ?? "") || undefined;

  // Attach an existing unassigned draft to this client.
  if (source === "draft" && draftFormId) {
    try {
      await attachFormToClient(
        session.user.id,
        session.user.role,
        draftFormId,
        teamId,
        clientId
      );
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Could not link this draft.",
      };
    }
    revalidateTag("dashboard-shell", "max");
    revalidatePath(clientPath(teamId, clientId));
    revalidatePath("/dashboard/forms");
    revalidatePath(`/dashboard/forms/${draftFormId}`);
    return { formId: draftFormId };
  }

  let title = String(formData.get("title") ?? "").trim();
  if (!title) {
    if (source === "template" && templateId) {
      const template = await prisma.formTemplate.findUnique({
        where: { id: templateId },
        select: { name: true },
      });
      title = template?.name?.trim() || "Untitled form";
    } else {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { name: true },
      });
      title = client?.name ? `${client.name} feedback` : "Untitled form";
    }
  }

  const parsed = createFormSchema.safeParse({
    teamId: teamId || undefined,
    clientId: clientId || undefined,
    title,
    templateId: source === "template" ? templateId : undefined,
  });

  if (!parsed.success) {
    return { error: "Could not create this form." };
  }

  let form;
  try {
    form = await createFormForUser(session.user.id, session.user.role, parsed.data);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create this form.",
    };
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
    thankYouTitle: formData.get("thankYouTitle") ?? "",
    thankYouMessage: formData.get("thankYouMessage") ?? "",
    thankYouBgColor: formData.get("thankYouBgColor") ?? "",
  });

  if (!parsed.success) {
    return { error: "Enter a form title." };
  }

  let headerImageUrl: string | null | undefined;
  if (formData.get("removeHeaderImage") === "1") {
    headerImageUrl = null;
  } else {
    const file = formData.get("headerImage");
    if (file instanceof File && file.size > 0) {
      const saved = await saveFormImageUpload(parsed.data.formId, file, "form-headers");
      if ("error" in saved) return { error: saved.error };
      headerImageUrl = saved.url;
    }
  }

  let thankYouImageUrl: string | null | undefined;
  if (formData.get("removeThankYouImage") === "1") {
    thankYouImageUrl = null;
  } else {
    const file = formData.get("thankYouImage");
    if (file instanceof File && file.size > 0) {
      const saved = await saveFormImageUpload(parsed.data.formId, file, "form-thank-you");
      if ("error" in saved) return { error: saved.error };
      thankYouImageUrl = saved.url;
    }
  }

  const thankYouBgColor =
    formData.get("thankYouBgColor") != null
      ? normalizeThankYouBg(String(formData.get("thankYouBgColor") ?? ""))
      : undefined;

  try {
    await updateClientForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.title,
      parsed.data.description,
      parsed.data.thankYouTitle,
      parsed.data.thankYouMessage,
      headerImageUrl,
      thankYouImageUrl,
      thankYouBgColor
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
    sectionId: formData.get("sectionId") ?? "",
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
      parsed.data.type,
      parsed.data.sectionId ?? null
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Add failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return { fieldId: question.id };
}

export async function addSection(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");

  const parsed = addSectionSchema.safeParse({
    teamId,
    clientId,
    formId,
    branchValue: formData.get("branchValue"),
  });
  if (!parsed.success) return { error: "Could not add section." };

  let section;
  try {
    section = await addSectionToForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.branchValue
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Add failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return { sectionId: section.id };
}

export async function updateSection(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");

  const parsed = updateSectionSchema.safeParse({
    teamId,
    clientId,
    formId,
    sectionId,
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) return { error: "Check section details." };

  try {
    await updateSectionOnForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.sectionId,
      {
        description: parsed.data.description,
      }
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Save failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return {};
}

export async function deleteSection(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");

  const parsed = deleteSectionSchema.safeParse({
    teamId,
    clientId,
    formId,
    sectionId,
  });
  if (!parsed.success) return { error: "Could not remove section." };

  try {
    await deleteSectionOnForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.sectionId
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Remove failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return {};
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
    description: formData.get("description") ?? "",
    required: formData.get("required"),
    optionsText: formData.get("optionsText") ?? undefined,
    maxLength: formData.get("maxLength") ?? undefined,
    allowOther: formData.get("allowOther"),
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
        description: parsed.data.description,
        required: parsed.data.required,
        optionsText: parsed.data.optionsText,
        maxLength: parsed.data.maxLength,
        allowOther: parsed.data.allowOther,
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

export async function duplicateField(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const formId = String(formData.get("formId") ?? "");

  const parsed = duplicateFieldSchema.safeParse({
    teamId,
    clientId,
    formId,
    fieldId: formData.get("fieldId"),
  });

  if (!parsed.success) {
    return { error: "Field not found." };
  }

  let question;
  try {
    question = await duplicateFieldOnForm(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      parsed.data.formId,
      parsed.data.fieldId
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Duplicate failed." };
  }

  revalidateBuilder(teamId, clientId, formId);
  return { fieldId: question.id };
}

export async function duplicateForm(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");

  const parsed = duplicateFormSchema.safeParse({
    teamId,
    clientId,
    formId: formData.get("formId"),
  });

  if (!parsed.success) {
    return { error: "Form not found." };
  }

  let form;
  try {
    form = await duplicateFormForUser(
      session.user.id,
      session.user.role,
      parsed.data.formId
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Duplicate failed." };
  }

  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard/forms");
  if (teamId && clientId) revalidatePath(clientPath(teamId, clientId));
  return { formId: form.id };
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
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not reorder.",
    };
  }

  revalidateBuilder(teamId, clientId, formId);
  return {};
}

export async function attachClient(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const formId = String(formData.get("formId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");

  if (!formId || !teamId || !clientId) {
    return { error: "Choose a client to integrate." };
  }

  try {
    await attachFormToClient(
      session.user.id,
      session.user.role,
      formId,
      teamId,
      clientId
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not link client.",
    };
  }

  revalidateBuilder(teamId, clientId, formId);
  return {};
}

export async function applyTemplate(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const formId = String(formData.get("formId") ?? "");
  const templateId = String(formData.get("templateId") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");

  if (!formId) {
    return { error: "Form not found." };
  }

  try {
    await applyTemplateToForm(
      session.user.id,
      session.user.role,
      formId,
      templateId || null
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update fields.",
    };
  }

  revalidateBuilder(teamId, clientId, formId);
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
