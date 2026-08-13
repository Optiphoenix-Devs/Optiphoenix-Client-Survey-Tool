import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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

export const createClientSchema = z
  .object({
    teamId: z.string().min(1),
    name: clientNameSchema,
    email: optionalText,
    company: z
      .string()
      .trim()
      .max(120, "Company name is too long")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.email) {
      const result = z.email().safeParse(data.email);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid email",
          path: ["email"],
        });
      }
    }
  });

export const updateClientSchema = z
  .object({
    teamId: z.string().min(1),
    clientId: z.string().min(1),
    name: clientNameSchema,
    email: optionalText,
    company: z
      .string()
      .trim()
      .max(120, "Company name is too long")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.email) {
      const result = z.email().safeParse(data.email);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid email",
          path: ["email"],
        });
      }
    }
  });

export const deleteClientSchema = z.object({
  teamId: z.string().min(1),
  clientId: z.string().min(1),
});
