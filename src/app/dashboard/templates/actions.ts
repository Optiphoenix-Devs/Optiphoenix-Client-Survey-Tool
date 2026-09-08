"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  addFieldSchema,
  addSectionSchema,
  createTemplateSchema,
  deleteFieldSchema,
  deleteSectionSchema,
  deleteTemplateSchema,
  reorderFieldsSchema,
  updateFieldSchema,
  updateFormSchema,
  updateSectionSchema,
} from "@/lib/validations";
import {
  addFieldToTemplate,
  addSectionToTemplate,
  createBlankTemplate,
  deleteFieldOnTemplate,
  deleteSectionOnTemplate,
  deleteTemplateForUser,
  duplicateTemplateForUser,
  hideTemplateForUser,
  reorderFieldsOnTemplate,
  shareTemplateWithEmail,
  unhideTemplateForUser,
  updateFieldOnTemplate,
  updateSectionOnTemplate,
  updateTemplateMeta,
} from "@/lib/templates";
import { createFormForUser } from "@/lib/forms";
import { saveFormImageUpload } from "@/lib/form-image-upload";
import { normalizeThankYouBg, normalizeThankYouText } from "@/lib/form-thank-you";
import { sendEmail } from "@/lib/email/send-email";
import { templateSharedEmail } from "@/lib/email/templates";
import { getAppBaseUrl } from "@/lib/app-url";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");
  return session;
}

function revalidateTemplate(templateId: string) {
  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard/templates");
  revalidatePath(`/dashboard/templates/${templateId}`);
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
    // Only bump the list + shell badge — destination page loads fresh on push.
    revalidateTag("dashboard-shell", "max");
    revalidatePath("/dashboard/templates");
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

export async function shareTemplate(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("templateId") ?? "");
  const email = String(formData.get("email") ?? "");
  if (!templateId) return { error: "Template is required." };

  try {
    const { template, recipient } = await shareTemplateWithEmail(
      session.user.id,
      session.user.role,
      templateId,
      email
    );

    const mail = templateSharedEmail({
      recipientName: recipient?.name,
      templateName: template.name,
      sharedByName: session.user.name,
      templatesUrl: `${getAppBaseUrl()}/dashboard/templates`,
    });
    await sendEmail({
      to: email.trim().toLowerCase(),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    revalidateTag("dashboard-shell", "max");
    revalidatePath("/dashboard/templates");
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not share template.",
    };
  }
}

export async function hideTemplate(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return { error: "Template is required." };

  try {
    await hideTemplateForUser(session.user.id, templateId);
    revalidateTag("dashboard-shell", "max");
    revalidatePath("/dashboard/templates");
    return {};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not hide template.",
    };
  }
}

export async function unhideTemplate(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return { error: "Template is required." };

  try {
    await unhideTemplateForUser(session.user.id, templateId);
    revalidateTag("dashboard-shell", "max");
    revalidatePath("/dashboard/templates");
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not unhide template.",
    };
  }
}

export async function duplicateTemplate(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return { error: "Template is required." };

  try {
    const copy = await duplicateTemplateForUser(
      session.user.id,
      session.user.role,
      templateId
    );
    revalidateTag("dashboard-shell", "max");
    revalidatePath("/dashboard/templates");
    revalidatePath(`/dashboard/templates/${copy.id}`);
    return { templateId: copy.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not duplicate template.",
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
      error: error instanceof Error ? error.message : "Could not remove template.",
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
    thankYouTitle: formData.get("thankYouTitle") ?? "",
    thankYouMessage: formData.get("thankYouMessage") ?? "",
    thankYouBgColor: formData.get("thankYouBgColor") ?? "",
    thankYouTextColor: formData.get("thankYouTextColor") ?? "",
  });
  if (!parsed.success) return { error: "Enter a template name." };

  let headerImageUrl: string | null | undefined;
  if (formData.get("removeHeaderImage") === "1") {
    headerImageUrl = null;
  } else {
    const file = formData.get("headerImage");
    if (file instanceof File && file.size > 0) {
      const saved = await saveFormImageUpload(
        parsed.data.formId,
        file,
        "form-headers"
      );
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
      const saved = await saveFormImageUpload(
        parsed.data.formId,
        file,
        "form-thank-you"
      );
      if ("error" in saved) return { error: saved.error };
      thankYouImageUrl = saved.url;
    }
  }

  const thankYouBgColor =
    formData.get("thankYouBgColor") != null
      ? normalizeThankYouBg(String(formData.get("thankYouBgColor") ?? ""))
      : undefined;
  const thankYouTextColor =
    formData.get("thankYouTextColor") != null
      ? normalizeThankYouText(String(formData.get("thankYouTextColor") ?? ""))
      : undefined;

  try {
    await updateTemplateMeta(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.title,
      parsed.data.description,
      parsed.data.thankYouTitle,
      parsed.data.thankYouMessage,
      headerImageUrl,
      thankYouImageUrl,
      thankYouBgColor,
      thankYouTextColor
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
    sectionId: formData.get("sectionId") ?? "",
  });
  if (!parsed.success) return { error: "Unknown field type." };

  try {
    const question = await addFieldToTemplate(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.type,
      parsed.data.sectionId ?? null
    );
    revalidateTemplate(templateId);
    return { fieldId: question.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Add failed." };
  }
}

export async function addSection(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("formId") ?? "");
  const parsed = addSectionSchema.safeParse({
    formId: templateId,
    branchValue: formData.get("branchValue"),
  });
  if (!parsed.success) return { error: "Could not add section." };

  let section;
  try {
    section = await addSectionToTemplate(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.branchValue
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Add failed." };
  }

  revalidateTemplate(templateId);
  return { sectionId: section.id };
}

export async function updateSection(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("formId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");

  const parsed = updateSectionSchema.safeParse({
    formId: templateId,
    sectionId,
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: "Could not save section." };

  try {
    await updateSectionOnTemplate(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.sectionId,
      { description: parsed.data.description }
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Save failed." };
  }

  revalidateTemplate(templateId);
  return {};
}

export async function deleteSection(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const templateId = String(formData.get("formId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");

  const parsed = deleteSectionSchema.safeParse({
    formId: templateId,
    sectionId,
  });
  if (!parsed.success) return { error: "Section not found." };

  try {
    await deleteSectionOnTemplate(
      session.user.id,
      session.user.role,
      parsed.data.formId,
      parsed.data.sectionId
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Remove failed." };
  }

  revalidateTemplate(templateId);
  return {};
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
    return { error: error instanceof Error ? error.message : "Remove failed." };
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
