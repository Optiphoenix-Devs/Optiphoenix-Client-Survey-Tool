import { z } from "zod";
import { isPasswordStrongEnough, PASSWORD_HINT } from "@/lib/password-strength";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(isPasswordStrongEnough, PASSWORD_HINT);

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email"),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
});

export const changePasswordSchema = z.object({
  newPassword: passwordSchema,
});

export const teamNameSchema = z
  .string()
  .trim()
  .min(2, "Team name must be at least 2 characters")
  .max(80, "Team name is too long");

export const createTeamSchema = z.object({
  name: teamNameSchema,
});

export const updateTeamSchema = z.object({
  teamId: z.string().min(1, "Team id is required"),
  name: teamNameSchema,
});

export const deleteTeamSchema = z.object({
  teamId: z.string().min(1, "Team id is required"),
});

const clientNameSchema = z
  .string()
  .trim()
  .min(2, "Client name must be at least 2 characters")
  .max(120, "Client name is too long");

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const createClientSchema = z.object({
  teamId: z.string().min(1),
  name: clientNameSchema,
  email: z.email("Enter a valid email"),
  company: z
    .string()
    .trim()
    .max(120, "Organization name is too long")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export const updateClientSchema = z.object({
  teamId: z.string().min(1),
  clientId: z.string().min(1),
  name: clientNameSchema,
  email: z.email("Enter a valid email"),
  company: z
    .string()
    .trim()
    .max(120, "Organization name is too long")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export const deleteClientSchema = z.object({
  teamId: z.string().min(1),
  clientId: z.string().min(1),
});

const fieldTypeSchema = z.enum([
  "SHORT_TEXT",
  "LONG_TEXT",
  "COMMENT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
  "BRANCHING_DROPDOWN",
  "SUGGESTION",
  "RATING",
  "RESOURCE_RATING",
  "DATE",
  "YES_NO",
]);

export const createFormSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  templateId: z.string().optional(),
  teamId: z.string().optional(),
  clientId: z.string().optional(),
});

export const updateFormSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  title: z.string().trim().min(2, "Title is required").max(160),
  description: z.string().max(500).optional(),
  thankYouTitle: z.string().max(120).optional(),
  thankYouMessage: z.string().max(1000).optional(),
  thankYouBgColor: z.string().max(32).optional(),
});

export const deleteFormSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
});

export const publishFormSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  action: z.enum(["publish", "unpublish"]),
});

export const addFieldSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  type: fieldTypeSchema,
  sectionId: optionalText,
});

export const addSectionSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  branchValue: z.string().trim().min(1).max(300),
});

export const updateSectionSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  sectionId: z.string().min(1),
  description: z.string().max(500).optional(),
});

export const deleteSectionSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  sectionId: z.string().min(1),
});

export const updateFieldSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  fieldId: z.string().min(1),
  label: z.string().trim().min(2).max(300),
  description: z.string().max(500).optional(),
  required: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.null()])
    .optional()
    .transform((value) => value === "on" || value === "true"),
  optionsText: optionalText,
  maxLength: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined || value === "") return undefined;
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
      return Math.floor(parsed);
    }),
  allowOther: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.null()])
    .optional()
    .transform((value) => value === "on" || value === "true"),
});

export const duplicateFieldSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  fieldId: z.string().min(1),
});

export const duplicateFormSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
});

export const deleteFieldSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  fieldId: z.string().min(1),
});

export const reorderFieldsSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const saveTemplateSchema = z.object({
  formId: z.string().min(1),
  name: z.string().trim().min(2, "Template name is required").max(160),
  description: z.string().max(500).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().trim().min(2, "Template name is required").max(160),
  description: z.string().max(500).optional(),
});

export const deleteTemplateSchema = z.object({
  templateId: z.string().min(1),
});
