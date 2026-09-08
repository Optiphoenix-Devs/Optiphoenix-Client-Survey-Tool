"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";
import {
  clearLoginLock,
  createResetTokenValue,
  hashToken,
  rotateSessionVersion,
  TEAM_INVITE_TOKEN_MS,
} from "@/lib/auth-security";
import { sendEmail, EmailSendError } from "@/lib/email/send-email";
import {
  accountApprovedEmail,
  accountDeactivatedEmail,
  accountReactivatedEmail,
  teamAccessUpdatedEmail,
  teamAccessRevokedEmail,
  teamAccessRestoredEmail,
  teamInviteEmail,
} from "@/lib/email/templates";
import { getAppBaseUrl } from "@/lib/app-url";
import { accessLevelLabel } from "@/lib/teams";
import type { TeamAccessLevel, UserRole } from "@/generated/prisma/client";

const ACCESS_LEVELS = new Set<TeamAccessLevel>(["VIEW", "SHARE", "FULL"]);

function parseAccessLevel(value: FormDataEntryValue | null): TeamAccessLevel | null {
  const raw = String(value ?? "").toUpperCase();
  if (ACCESS_LEVELS.has(raw as TeamAccessLevel)) {
    return raw as TeamAccessLevel;
  }
  return null;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}

async function requireManageableUser(adminId: string, userId: string) {
  if (!userId) return { error: "User not found." as const };
  if (userId === adminId) {
    return { error: "Manage your own account from Account settings." as const };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, status: true },
  });
  if (!user) return { error: "User not found." as const };
  if (user.role === "ADMIN") {
    return { error: "Admin accounts are managed from Account settings." as const };
  }
  return { user };
}

export async function approveUser(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const check = await requireManageableUser(session.user!.id!, userId);
  if ("error" in check) return { error: check.error };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "APPROVED" },
    });
  } catch (error) {
    console.error("[approveUser]", error);
    return { error: "Could not approve this account. Try again." };
  }

  if (check.user.email) {
    const mail = accountApprovedEmail({
      name: check.user.name,
      loginUrl: `${getAppBaseUrl()}/login`,
    });
    await sendEmail({
      to: check.user.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  return {};
}

export async function rejectUser(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const check = await requireManageableUser(session.user!.id!, userId);
  if ("error" in check) return { error: check.error };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "REJECTED" },
    });
    await rotateSessionVersion(userId);
  } catch (error) {
    console.error("[rejectUser]", error);
    return { error: "Could not reject this account. Try again." };
  }
  revalidatePath("/dashboard/users");
  return {};
}

export async function deactivateUser(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const check = await requireManageableUser(session.user!.id!, userId);
  if ("error" in check) return { error: check.error };

  if (check.user.status !== "APPROVED") {
    return { error: "Only active accounts can be deactivated." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "DEACTIVATED" },
    });
    await rotateSessionVersion(userId);

    if (check.user.email) {
      const mail = accountDeactivatedEmail({
        name: check.user.name,
      });
      await sendEmail({
        to: check.user.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }).catch((err) =>
        console.error("[deactivateUser] Could not send notification email", err)
      );
    }
  } catch (error) {
    console.error("[deactivateUser]", error);
    return { error: "Could not deactivate this account. Try again." };
  }
  revalidatePath("/dashboard/users");
  return {};
}

export async function reactivateUser(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const check = await requireManageableUser(session.user!.id!, userId);
  if ("error" in check) return { error: check.error };

  if (check.user.status !== "DEACTIVATED") {
    return { error: "Only deactivated accounts can be reactivated." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "APPROVED" },
    });

    if (check.user.email) {
      const mail = accountReactivatedEmail({
        name: check.user.name,
        loginUrl: `${getAppBaseUrl()}/login`,
      });
      await sendEmail({
        to: check.user.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }).catch((err) =>
        console.error("[reactivateUser] Could not send notification email", err)
      );
    }
  } catch (error) {
    console.error("[reactivateUser]", error);
    return { error: "Could not reactivate this account. Try again." };
  }
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  return {};
}

export async function unlockUser(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const check = await requireManageableUser(session.user!.id!, userId);
  if ("error" in check) return { error: check.error };

  try {
    await clearLoginLock(userId);
  } catch (error) {
    console.error("[unlockUser]", error);
    return { error: "Could not unlock this account. Try again." };
  }
  revalidatePath("/dashboard/users");
  return {};
}

export async function revokeTeamAccess(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const check = await requireManageableUser(session.user!.id!, userId);
  if ("error" in check) return { error: check.error };
  if (!teamId) return { error: "Team is required." };

  try {
    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
      include: { team: { select: { name: true } } },
    });
    if (!membership) return { error: "This user is not on that team." };
    if (membership.revokedAt) return { error: "Access is already revoked." };

    await prisma.teamMembership.update({
      where: { id: membership.id },
      data: { revokedAt: new Date() },
    });

    if (check.user.email) {
      const mail = teamAccessRevokedEmail({
        recipientName: check.user.name,
        teamName: membership.team.name,
        adminName: session.user?.name,
      });
      await sendEmail({
        to: check.user.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }).catch((err) =>
        console.error("[revokeTeamAccess] Could not send notification email", err)
      );
    }
  } catch (error) {
    console.error("[revokeTeamAccess]", error);
    return { error: "Could not revoke team access. Try again." };
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/teams");
  return {};
}

export async function restoreTeamAccess(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const check = await requireManageableUser(session.user!.id!, userId);
  if ("error" in check) return { error: check.error };
  if (!teamId) return { error: "Team is required." };

  try {
    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
      include: { team: { select: { name: true } } },
    });
    if (!membership) return { error: "This user is not on that team." };
    if (!membership.revokedAt) return { error: "Access is already active." };

    await prisma.teamMembership.update({
      where: { id: membership.id },
      data: { revokedAt: null },
    });

    if (check.user.email) {
      const mail = teamAccessRestoredEmail({
        recipientName: check.user.name,
        teamName: membership.team.name,
        adminName: session.user?.name,
        dashboardUrl: `${getAppBaseUrl()}/dashboard`,
      });
      await sendEmail({
        to: check.user.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }).catch((err) =>
        console.error("[restoreTeamAccess] Could not send notification email", err)
      );
    }
  } catch (error) {
    console.error("[restoreTeamAccess]", error);
    return { error: "Could not restore team access. Try again." };
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/teams");
  return {};
}

export async function updateTeamAccessLevel(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const accessLevel = parseAccessLevel(formData.get("accessLevel"));
  const check = await requireManageableUser(session.user!.id!, userId);
  if ("error" in check) return { error: check.error };
  if (!teamId) return { error: "Team is required." };
  if (!accessLevel) return { error: "Choose view, write, or full access." };

  try {
    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
      include: { team: { select: { name: true } } },
    });
    if (!membership) return { error: "This user is not on that team." };
    if (membership.accessLevel === accessLevel) return {};

    await prisma.teamMembership.update({
      where: { id: membership.id },
      data: { accessLevel },
    });

    if (check.user.email) {
      const mail = teamAccessUpdatedEmail({
        recipientName: check.user.name,
        teamName: membership.team.name,
        accessLabel: accessLevelLabel(accessLevel),
        adminName: session.user?.name,
        dashboardUrl: `${getAppBaseUrl()}/dashboard`,
      });
      await sendEmail({
        to: check.user.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }).catch((err) =>
        console.error(
          "[updateTeamAccessLevel] Could not send notification email",
          err
        )
      );
    }
  } catch (error) {
    console.error("[updateTeamAccessLevel]", error);
    return { error: "Could not update permissions. Try again." };
  }

  revalidatePath("/dashboard/users");
  return {};
}

export async function inviteTeamMember(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const teamId = String(formData.get("teamId") ?? "");
  const accessLevel = parseAccessLevel(formData.get("accessLevel")) ?? "FULL";
  const role: UserRole = "TEAM_LEAD";

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (!teamId) return { error: "Choose a team." };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true },
  });
  if (!team) return { error: "Team not found." };

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, status: true },
  });
  if (existingUser?.role === "ADMIN") {
    return { error: "Admin accounts cannot be invited as team members." };
  }

  if (existingUser) {
    const membership = await prisma.teamMembership.findUnique({
      where: {
        teamId_userId: { teamId, userId: existingUser.id },
      },
    });
    if (membership && !membership.revokedAt) {
      return { error: "That user already has access to this team." };
    }
  }

  try {
    await prisma.teamInvite.updateMany({
      where: { teamId, email, status: "PENDING" },
      data: { status: "REVOKED" },
    });

    const token = createResetTokenValue();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TEAM_INVITE_TOKEN_MS);

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email,
        role,
        accessLevel,
        invitedById: session.user!.id!,
        tokenHash,
        expiresAt,
        status: "PENDING",
      },
    });

    const mail = teamInviteEmail({
      teamName: team.name,
      invitedByName: session.user!.name,
      accessLabel: accessLevelLabel(accessLevel),
      joinUrl: `${getAppBaseUrl()}/invite/${token}`,
    });

    try {
      await sendEmail({
        to: email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    } catch (error) {
      await prisma.teamInvite.delete({ where: { id: invite.id } }).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error("[inviteTeamMember]", error);
    if (error instanceof EmailSendError) {
      return { error: error.message };
    }
    return { error: "Could not send the invite. Try again." };
  }

  revalidatePath("/dashboard/users");
  return {};
}
