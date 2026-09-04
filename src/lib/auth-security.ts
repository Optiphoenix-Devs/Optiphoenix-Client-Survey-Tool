import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const MAX_LOGIN_ATTEMPTS = 3;
export const LOCKOUT_MS = 3 * 60 * 60 * 1000;
export const RESET_TOKEN_MS = 60 * 60 * 1000;
export const SIGNUP_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createResetTokenValue() {
  return randomBytes(32).toString("hex");
}

export function isLocked(lockedUntil: Date | null | undefined) {
  return Boolean(lockedUntil && lockedUntil.getTime() > Date.now());
}

export async function recordFailedLogin(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
  });

  if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: new Date(Date.now() + LOCKOUT_MS) },
    });
  }
}

export async function clearLoginLock(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/** New login wins: bump version so every older JWT is signed out elsewhere. */
export async function rotateSessionVersion(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      sessionVersion: { increment: 1 },
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

export async function createPasswordResetToken(userId: string) {
  const token = createResetTokenValue();
  const tokenHash = hashToken(token);
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_MS),
    },
  });
  return token;
}

export async function resetPasswordWithToken(token: string, password: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (
    !record ||
    record.usedAt ||
    record.expiresAt.getTime() < Date.now() ||
    record.user.status === "REJECTED"
  ) {
    throw new Error("This reset link is invalid or has expired.");
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        password: hashed,
        failedLoginAttempts: 0,
        lockedUntil: null,
        resetRequestedAt: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

export async function createSignupToken(userId: string) {
  const token = createResetTokenValue();
  await prisma.user.update({
    where: { id: userId },
    data: {
      signupTokenHash: hashToken(token),
      signupTokenExpiresAt: new Date(Date.now() + SIGNUP_TOKEN_MS),
    },
  });
  return token;
}

export async function getSignupStatus(token: string) {
  const user = await prisma.user.findFirst({
    where: { signupTokenHash: hashToken(token) },
    select: { status: true, signupTokenExpiresAt: true },
  });
  if (!user) return "INVALID" as const;
  if (user.signupTokenExpiresAt && user.signupTokenExpiresAt.getTime() < Date.now()) {
    return "EXPIRED" as const;
  }
  return user.status;
}

export async function consumeSignupToken(token: string) {
  const user = await prisma.user.findFirst({
    where: { signupTokenHash: hashToken(token) },
  });
  if (
    !user ||
    user.status !== "APPROVED" ||
    (user.signupTokenExpiresAt && user.signupTokenExpiresAt.getTime() < Date.now())
  ) {
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { signupTokenHash: null, signupTokenExpiresAt: null },
  });

  return user;
}
