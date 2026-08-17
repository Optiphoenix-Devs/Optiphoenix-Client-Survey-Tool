"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  createTeamSchema,
  deleteTeamSchema,
  updateTeamSchema,
} from "@/lib/validations";
import {
  createTeamForUser,
  deleteTeamForUser,
  isUniqueNameError,
  updateTeamForUser,
} from "@/lib/teams";

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

async function requireSession() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  return session;
}

function revalidateWorkspace() {
  revalidateTag("dashboard-shell", "max");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/teams");
  revalidatePath("/dashboard/clients");
}

export async function createTeam(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid team name." };
  }

  try {
    await createTeamForUser(session.user.id, session.user.role, parsed.data.name);
  } catch (error) {
    if (isUniqueNameError(error)) return { error: error.message };
    return { error: "Could not create this team." };
  }

  revalidateWorkspace();
  return {};
}

export async function updateTeam(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = updateTeamSchema.safeParse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid team name." };
  }

  try {
    await updateTeamForUser(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.name
    );
  } catch (error) {
    if (isUniqueNameError(error)) return { error: error.message };
    return { error: "You cannot edit this team." };
  }

  revalidateWorkspace();
  return {};
}

export async function deleteTeam(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = deleteTeamSchema.safeParse({
    teamId: formData.get("teamId"),
  });

  if (!parsed.success) {
    return { error: "Team not found." };
  }

  try {
    await deleteTeamForUser(
      session.user.id,
      session.user.role,
      parsed.data.teamId
    );
  } catch {
    return { error: "You cannot delete this team." };
  }

  revalidateWorkspace();
  return {};
}
