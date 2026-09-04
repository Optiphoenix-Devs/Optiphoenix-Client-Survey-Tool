"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  addFieldSchema,
  createTemplateSchema,
  deleteFieldSchema,
  deleteTemplateSchema,
  reorderFieldsSchema,
  updateFieldSchema,
  updateFormSchema,
} from "@/lib/validations";
import {
  addFieldToTemplate,
  createBlankTemplate,
  deleteFieldOnTemplate,
  deleteTemplateForUser,
  reorderFieldsOnTemplate,
  updateFieldOnTemplate,
  updateTemplateMeta,
} from "@/lib/templates";
import { createFormForUser } from "@/lib/forms";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");
  return session;
}

function revalidateTemplate(templateId: string) {
  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard/templates");
  revalidatePath(`/dashboard/templates/${templateId}`);
  revalidatePath("/dashboard/forms");
}

export async function createTemplate(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = createTemplateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { error: "Enter a template name." };
  }

  try {
    const template = await createBlankTemplate(
      session.user.id,
      parsed.data.name,
      parsed.data.description
    );
    revalidateTemplate(template.id);
    return { templateId: template.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create template.",
    };
  }
}

export async function useTemplate(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("templateId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!templateId || title.length < 2) {
    return { error: "Enter a form title." };
  }

  try {
    const form = await createFormForUser(session.user.id, session.user.role, {
      title,
      templateId,
    });
    revalidateTag("dashboard-shell", "max");
    revalidatePath("/dashboard/forms");
    return { formId: form.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create form.",
    };
  }
}

export async function deleteTemplate(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = deleteTemplateSchema.safeParse({
    templateId: formData.get("templateId"),
  });
  if (!parsed.success) return { error: "Template not found." };

  try {
    await deleteTemplateForUser(
      session.user.id,
      session.user.role,
      parsed.data.templateId
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not delete template.",
    };
  }

  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard/templates");
  return {};
}

export async function updateForm(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("formId") ?? "");
  const parsed = updateFormSchema.safeParse({
    formId: templateId,
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: "Enter a template name." };

  try {
    await updateTemplateMeta(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.title,
      parsed.data.description
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Save failed." };
  }

  revalidateTemplate(templateId);
  return {};
}

export async function addField(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("formId") ?? "");
  const parsed = addFieldSchema.safeParse({
    formId: templateId,
    type: formData.get("type"),
  });
  if (!parsed.success) return { error: "Unknown field type." };

  try {
    const question = await addFieldToTemplate(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.type
    );
    revalidateTemplate(templateId);
    return { fieldId: question.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Add failed." };
  }
}

export async function updateField(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("formId") ?? "");
  const parsed = updateFieldSchema.safeParse({
    formId: templateId,
    fieldId: formData.get("fieldId"),
    label: formData.get("label"),
    description: formData.get("description") ?? "",
    required: formData.get("required"),
    optionsText: formData.get("optionsText") ?? undefined,
    maxLength: formData.get("maxLength") ?? undefined,
    allowOther: formData.get("allowOther"),
  });
  if (!parsed.success) return { error: "Check field details." };

  try {
    await updateFieldOnTemplate(
      session.user.id,
      session.user.role,
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

  revalidateTemplate(templateId);
  return {};
}

export async function deleteField(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("formId") ?? "");
  const parsed = deleteFieldSchema.safeParse({
    formId: templateId,
    fieldId: formData.get("fieldId"),
  });
  if (!parsed.success) return { error: "Field not found." };

  try {
    await deleteFieldOnTemplate(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.fieldId
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Delete failed." };
  }

  revalidateTemplate(templateId);
  return {};
}

export async function reorderFields(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("formId") ?? "");
  let orderedIds: string[] = [];
  try {
    orderedIds = JSON.parse(String(formData.get("orderedIds") ?? "[]"));
  } catch {
    return { error: "Could not reorder." };
  }

  const parsed = reorderFieldsSchema.safeParse({
    formId: templateId,
    orderedIds,
  });
  if (!parsed.success) return { error: "Could not reorder." };

  try {
    await reorderFieldsOnTemplate(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.orderedIds
    );
  } catch {
    return { error: "Could not reorder." };
  }

  return {};
}

export async function togglePublishForm(): Promise<ActionResult> {
  return {};
}

export async function saveAsTemplate(): Promise<ActionResult> {
  return {};
}
