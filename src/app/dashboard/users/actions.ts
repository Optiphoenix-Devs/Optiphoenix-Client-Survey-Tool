"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";
import { clearLoginLock, createPasswordResetToken } from "@/lib/auth-security";
import { sendEmail } from "@/lib/email/send-email";
import { accountApprovedEmail } from "@/lib/email/templates";
import { getAppBaseUrl } from "@/lib/app-url";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}

export async function approveUser(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "User not found." };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { status: "APPROVED" },
  });

  if (user?.email) {
    const mail = accountApprovedEmail({
      name: user.name,
      loginUrl: `${getAppBaseUrl()}/login`,
    });
    await sendEmail({
      to: user.email,
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
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "User not found." };
  await prisma.user.update({
    where: { id: userId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/dashboard/users");
  return {};
}

export async function unlockUser(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "User not found." };
  await clearLoginLock(userId);
  revalidatePath("/dashboard/users");
  return {};
}

export async function createUserResetLink(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (user.status === "REJECTED") {
    return { error: "Rejected accounts cannot receive a reset link." };
  }
  if (user.id === session.user.id) {
    // Admin can reset their own too
  }
  const token = await createPasswordResetToken(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { resetRequestedAt: null },
  });
  const base = getAppBaseUrl();
  revalidatePath("/dashboard/users");
  return { resetUrl: `${base}/reset-password?token=${token}` };
}
