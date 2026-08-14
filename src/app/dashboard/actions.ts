"use server";

import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import {
  createTeamSchema,
  deleteTeamSchema,
  updateTeamSchema,
} from "@/lib/validations";
import {
  createTeamForUser,
  deleteTeamForUser,
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

export async function createTeam(formData: FormData) {
  const session = await requireSession();

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=Enter+a+valid+team+name");
  }

  await createTeamForUser(session.user.id, parsed.data.name);
  redirect("/dashboard?created=1");
}

export async function updateTeam(formData: FormData) {
  const session = await requireSession();

  const parsed = updateTeamSchema.safeParse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=Enter+a+valid+team+name");
  }

  try {
    await updateTeamForUser(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.name
    );
  } catch {
    redirect("/dashboard?error=You+cannot+edit+this+team");
  }

  redirect("/dashboard?updated=1");
}

export async function deleteTeam(formData: FormData) {
  const session = await requireSession();

  const parsed = deleteTeamSchema.safeParse({
    teamId: formData.get("teamId"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=Team+not+found");
  }

  try {
    await deleteTeamForUser(
      session.user.id,
      session.user.role,
      parsed.data.teamId
    );
  } catch {
    redirect("/dashboard?error=You+cannot+delete+this+team");
  }

  redirect("/dashboard?deleted=1");
}
