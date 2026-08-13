"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

async function requireSession() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  return session;
}

function teamPath(
  teamId: string,
  query?: { error?: string; created?: string; updated?: string; deleted?: string }
) {
  const params = new URLSearchParams();
  if (query?.error) params.set("error", query.error);
  if (query?.created) params.set("created", query.created);
  if (query?.updated) params.set("updated", query.updated);
  if (query?.deleted) params.set("deleted", query.deleted);
  const suffix = params.toString();
  return `/dashboard/teams/${teamId}${suffix ? `?${suffix}` : ""}`;
}

export async function createClient(formData: FormData) {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");

  const parsed = createClientSchema.safeParse({
    teamId,
    name: formData.get("name"),
    email: formData.get("email") ?? undefined,
    company: formData.get("company") ?? undefined,
  });

  if (!parsed.success) {
    redirect(teamPath(teamId, { error: "Check+client+name+and+email" }));
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
  } catch {
    redirect(teamPath(teamId, { error: "You+cannot+add+clients+to+this+team" }));
  }

  redirect(teamPath(parsed.data.teamId, { created: "1" }));
}

export async function updateClient(formData: FormData) {
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
    redirect(teamPath(teamId, { error: "Check+client+name+and+email" }));
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
  } catch {
    redirect(teamPath(teamId, { error: "You+cannot+edit+this+client" }));
  }

  redirect(teamPath(parsed.data.teamId, { updated: "1" }));
}

export async function deleteClient(formData: FormData) {
  const session = await requireSession();
  const teamId = String(formData.get("teamId") ?? "");

  const parsed = deleteClientSchema.safeParse({
    teamId,
    clientId: formData.get("clientId"),
  });

  if (!parsed.success) {
    redirect(teamPath(teamId, { error: "Client+not+found" }));
  }

  try {
    await deleteClientForTeam(
      session.user.id,
      session.user.role,
      parsed.data.teamId,
      parsed.data.clientId
    );
  } catch {
    redirect(teamPath(teamId, { error: "You+cannot+delete+this+client" }));
  }

  redirect(teamPath(parsed.data.teamId, { deleted: "1" }));
}
