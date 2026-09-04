"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/action-result";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: "Enter a valid name." };

  let avatarUrl: string | undefined;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    const maxBytes = 2 * 1024 * 1024;
    const name = file.name.toLowerCase();
    const allowedType =
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "image/jpg";
    const allowedExt =
      name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg");
    if (!allowedType || !allowedExt) {
      return { error: "Avatar must be a .png, .jpg, or .jpeg file." };
    }
    if (file.size > maxBytes) {
      return { error: "Avatar must be 2 MB or smaller." };
    }
    const ext = name.endsWith(".png") ? "png" : "jpg";
    const dir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(dir, { recursive: true });
    const filename = `${session.user.id}.${ext}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    avatarUrl = `/uploads/avatars/${filename}?v=${Date.now()}`;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return {};
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  revalidatePath("/dashboard/profile");
  return {};
}
