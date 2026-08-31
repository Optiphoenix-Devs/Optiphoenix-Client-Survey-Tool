import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
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
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
  "SUGGESTION",
  "RATING",
  "RESOURCE_RATING",
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
});

export const updateFieldSchema = z.object({
  teamId: z.string().optional(),
  clientId: z.string().optional(),
  formId: z.string().min(1),
  fieldId: z.string().min(1),
  label: z.string().trim().min(2).max(300),
  required: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.null()])
    .optional()
    .transform((value) => value === "on" || value === "true"),
  optionsText: optionalText,
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
