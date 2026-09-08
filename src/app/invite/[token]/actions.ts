"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";
import { hashToken } from "@/lib/auth-security";
import { acceptInviteSchema, passwordSchema } from "@/lib/validations";

export async function acceptTeamInvite(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const tokenHash = hashToken(parsed.data.token);
  const invite = await prisma.teamInvite.findUnique({
    where: { tokenHash },
    include: { team: { select: { id: true, name: true } } },
  });

  if (!invite || invite.status !== "PENDING") {
    return { error: "This invite is invalid or has already been used." };
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return { error: "This invite has expired. Ask an admin to send a new one." };
  }

  const email = invite.email.toLowerCase();
  const name = parsed.data.name.trim();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (!existingUser) {
    const passwordCheck = passwordSchema.safeParse(parsed.data.password);
    if (!passwordCheck.success) {
      return {
        error:
          passwordCheck.error.issues[0]?.message ??
          "Create a password to join.",
      };
    }
  }

  const passwordHash = existingUser
    ? null
    : await bcrypt.hash(parsed.data.password!, 10);

  try {
    await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });

      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            name,
            password: passwordHash!,
            role: invite.role === "ADMIN" ? "TEAM_LEAD" : invite.role,
            status: "APPROVED",
          },
        });
      } else {
        if (user.role === "ADMIN") {
          throw new Error("ADMIN_INVITE");
        }
        // Keep existing password and role — only refresh name / approve status.
        await tx.user.update({
          where: { id: user.id },
          data: {
            name,
            status: "APPROVED",
          },
        });
      }

      await tx.teamMembership.upsert({
        where: {
          teamId_userId: { teamId: invite.teamId, userId: user.id },
        },
        create: {
          teamId: invite.teamId,
          userId: user.id,
          accessLevel: invite.accessLevel,
          revokedAt: null,
        },
        update: {
          accessLevel: invite.accessLevel,
          revokedAt: null,
        },
      });

      await tx.teamInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_INVITE") {
      return { error: "Admin accounts cannot join teams via invite." };
    }
    console.error("[acceptTeamInvite]", error);
    return { error: "Could not join the team. Try again." };
  }

  // Existing accounts keep their password.
  if (existingUser) {
    const session = await auth();
    if (session?.user?.id === existingUser.id) {
      redirect(`/dashboard/teams/${invite.teamId}`);
    }
    redirect("/login?notice=Team+joined.+Sign+in+with+your+existing+password.");
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: `/dashboard/teams/${invite.teamId}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?notice=Team+joined.+Sign+in+to+continue.");
    }
    throw error;
  }

  return {};
}
