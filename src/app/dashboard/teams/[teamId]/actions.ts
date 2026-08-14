"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import {
  createClientSchema,
  deleteClientSchema,
  updateClientSchema,
} from "@/lib/validations";
import {
  createClientForTeam,
  deleteClientForTeam,
  updateClientForTeam,
} from "@/lib/clients";
import { isUniqueNameError } from "@/lib/teams";

async function requireSession() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  return session;
}

function revalidateWorkspace(teamId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/teams");
  revalidatePath("/dashboard/clients");
  if (teamId) revalidatePath(`/dashboard/teams/${teamId}`);
}

export async function createClient(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");

  const parsed = createClientSchema.safeParse({
    teamId,
    name: formData.get("name"),
    email: formData.get("email") ?? undefined,
    company: formData.get("company") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Check client name, team, and email." };
  }

  try {
    await createClientForTeam(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company,
      }
    );
  } catch (error) {
    if (isUniqueNameError(error)) return { error: error.message };
    return { error: "You cannot add clients to this team." };
  }

  revalidateWorkspace(parsed.data.teamId);
  return {};
}

export async function updateClient(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");

  const parsed = updateClientSchema.safeParse({
    teamId,
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    email: formData.get("email") ?? undefined,
    company: formData.get("company") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Check client name and email." };
  }

  try {
    await updateClientForTeam(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId,
      {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company,
      }
    );
  } catch (error) {
    if (isUniqueNameError(error)) return { error: error.message };
    return { error: "You cannot edit this client." };
  }

  revalidateWorkspace(parsed.data.teamId);
  return {};
}

export async function deleteClient(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");

  const parsed = deleteClientSchema.safeParse({
    teamId,
    clientId: formData.get("clientId"),
  });

  if (!parsed.success) {
    return { error: "Client not found." };
  }

  try {
    await deleteClientForTeam(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId
    );
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "You cannot delete this client." };
  }

  revalidateWorkspace(parsed.data.teamId);
  return {};
}
