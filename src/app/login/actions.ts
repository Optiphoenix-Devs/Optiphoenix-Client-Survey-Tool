"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations";
import type { ActionResult } from "@/lib/action-result";
import { isLocked, resetPasswordWithToken, createSignupToken, createPasswordResetToken } from "@/lib/auth-security";

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Check your email and password." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { error: "That email or password is incorrect." };
  }

  if (user.status === "PENDING") {
    return { error: "Your account is waiting for admin approval." };
  }

  if (user.status === "REJECTED") {
    return { error: "This account was not approved. Contact an admin." };
  }

  if (isLocked(user.lockedUntil)) {
    return {
      error:
        "This account is locked for 3 hours after 3 failed sign-ins. Ask an admin to unlock it.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That email or password is incorrect." };
    }
    throw error;
  }

  return {};
}

export async function registerAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Check your name, email, and password." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      password: await bcrypt.hash(parsed.data.password, 10),
      role: "TEAM_LEAD",
      status: "PENDING",
    },
  });

  const token = await createSignupToken(user.id);
  redirect(`/waiting?token=${token}`);
}

export async function requestPasswordResetAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user || user.status === "REJECTED") {
    return { error: "No account was found for that email." };
  }

  if (user.status === "PENDING") {
    return {
      error:
        "Wait for the approval. You can reset once the account is approved by the admin. Please wait.",
    };
  }

  const token = await createPasswordResetToken(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { resetRequestedAt: null },
  });
  redirect(`/reset-password?token=${token}`);
}

export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a new password of at least 8 characters." };
  }

  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "This reset link is invalid or has expired.",
    };
  }

  return { ok: true };
}

export async function completeSignupAction(token: string): Promise<ActionResult> {
  if (!token) {
    return { error: "This waiting link is invalid." };
  }

  try {
    await signIn("credentials", {
      signupToken: token,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Your account is not approved yet." };
    }
    throw error;
  }

  return {};
}
