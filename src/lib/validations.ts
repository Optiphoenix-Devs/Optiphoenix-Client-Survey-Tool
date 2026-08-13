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
